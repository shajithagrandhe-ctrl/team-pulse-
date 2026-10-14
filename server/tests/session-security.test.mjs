import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import { test } from "node:test";
import jwt from "jsonwebtoken";
import { sessionFixture } from "./helpers/session-fixture.mjs";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = randomBytes(32).toString("hex");
process.env.DATABASE_URL = "mysql://unused@127.0.0.1:3306/unused";
process.env.LOG_LEVEL = "silent";
const { prisma } = await import("../dist/config/prisma.js");
const { assertActiveAccount } = await import("../dist/services/session.service.js");
const { signAccessToken, verifyAccessToken } = await import("../dist/utils/tokens.js");
const { createApp } = await import("../dist/app.js");
const actor = { sub: "fixture", jti: "fixture", role: "EMPLOYEE", email: "fixture@example.test", displayName: "Old Name" };

test("existing JWTs cannot authorize frozen, relieved, deleted or changed accounts", async (t) => {
  sessionFixture(t, prisma);
  let account = { role: actor.role, email: actor.email, displayName: "Current Name", employeeProfile: { status: "ACTIVE" } };
  const original = prisma.user.findUnique;
  prisma.user.findUnique = async () => account;
  t.after(() => { prisma.user.findUnique = original; });
  assert.equal((await assertActiveAccount(actor)).displayName, "Current Name");
  for (const employeeProfile of [{ status: "FROZEN" }, { status: "ACTIVE", dateOfRelieving: new Date(0) }]) {
    account = { ...account, employeeProfile };
    await assert.rejects(() => assertActiveAccount(actor), (error) => error.statusCode === 403);
  }
  account = { ...account, role: "CUSTOMER" };
  await assert.rejects(() => assertActiveAccount(actor), (error) => error.statusCode === 401);
  account = null;
  await assert.rejects(() => assertActiveAccount(actor), (error) => error.statusCode === 401);
});

test("token verification rejects expired, wrong-algorithm and malformed payloads", () => {
  assert.equal(verifyAccessToken(signAccessToken(actor)).role, "EMPLOYEE");
  for (const token of [
    jwt.sign(actor, process.env.JWT_SECRET, { expiresIn: -1 }),
    jwt.sign(actor, process.env.JWT_SECRET, { algorithm: "HS384", expiresIn: "1h" }),
    jwt.sign({ sub: "fixture" }, process.env.JWT_SECRET, { expiresIn: "1h" }),
    jwt.sign(actor, process.env.JWT_SECRET)
  ]) assert.throws(() => verifyAccessToken(token));
});

test("frozen accounts cannot use a previously issued token to provision customers", async (t) => {
  sessionFixture(t, prisma);
  const original = prisma.user.findUnique;
  prisma.user.findUnique = async () => ({
    role: actor.role, email: actor.email, displayName: actor.displayName, employeeProfile: { status: "FROZEN" }
  });
  t.after(() => { prisma.user.findUnique = original; });
  const server = createServer(createApp());
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/customers`, {
    method: "POST", headers: { Authorization: `Bearer ${signAccessToken(actor)}` }
  });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).message, "Employee account is frozen");
});

test("login errors retain credential failures but never expose database details", async (t) => {
  const original = prisma.user.findUnique;
  let databaseFailure = false;
  prisma.user.findUnique = async () => {
    if (databaseFailure) throw new Error("Private database connection details");
    return null;
  };
  t.after(() => { prisma.user.findUnique = original; });
  const server = createServer(createApp());
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const url = `http://127.0.0.1:${server.address().port}/api/auth/login`;
  const request = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
    email: "fixture@example.test", password: randomBytes(12).toString("hex")
  }) };
  let response = await fetch(url, request);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).message, "Invalid email or password");
  databaseFailure = true;
  response = await fetch(url, request);
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { success: false, message: "Unable to sign in. Please try again later." });
});
