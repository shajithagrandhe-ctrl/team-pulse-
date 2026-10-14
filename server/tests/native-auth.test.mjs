import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import { test } from "node:test";
import bcrypt from "bcryptjs";

process.env.NODE_ENV = "production";
process.env.JWT_SECRET = randomBytes(32).toString("hex");
process.env.DATABASE_URL = "mysql://unused@127.0.0.1:3306/unused";
process.env.LOG_LEVEL = "silent";
const { prisma } = await import("../dist/config/prisma.js");
const { createApp } = await import("../dist/app.js");
const { env } = await import("../dist/config/env.js");
const { verifyAccessToken, signAccessToken } = await import("../dist/utils/tokens.js");

test("native and cookie logins share real password/roles, durable logout and production CSRF policy", async (t) => {
  const password = randomBytes(16).toString("hex");
  const record = {
    id: "fixture-user", email: "fixture@example.test", displayName: "Fixture", fullName: "Fixture User",
    role: "CUSTOMER", passwordHash: await bcrypt.hash(password, 4), employeeProfile: null,
    createdAt: new Date(), lastLogin: null
  };
  const sessions = new Map();
  const replace = (target, key, implementation) => {
    const original = target[key]; target[key] = implementation;
    t.after(() => { target[key] = original; });
  };
  replace(prisma.user, "findUnique", async ({ where, select }) => {
    if ((where.id && where.id !== record.id) || (where.email && where.email !== record.email)) return null;
    return select ? Object.fromEntries(Object.keys(select).map((key) => [key, record[key]])) : record;
  });
  replace(prisma.user, "update", async ({ data }) => Object.assign(record, data));
  replace(prisma.employeeProfile, "findUnique", async () => record.employeeProfile);
  replace(prisma.authSession, "create", async ({ data }) => { sessions.set(data.id, { ...data, revokedAt: null }); return data; });
  replace(prisma.authSession, "findUnique", async ({ where }) => sessions.get(where.id) ?? null);
  replace(prisma.authSession, "updateMany", async ({ where, data }) => {
    let count = 0;
    for (const session of sessions.values()) {
      if ((!where.id || session.id === where.id) && (!where.userId || session.userId === where.userId) && !session.revokedAt) {
        Object.assign(session, data); count++;
      }
    }
    return { count };
  });
  replace(prisma, "$transaction", async (promises) => Promise.all(promises));
  const server = createServer(createApp());
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const login = (path, secret = password, headers = {}) => fetch(`${base}${path}`, {
    method: "POST", headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ email: record.email, password: secret, role: "ADMIN" })
  });
  assert.equal((await login("/auth/login")).status, 403);
  assert.equal((await login("/auth/native/login", randomBytes(16).toString("hex"))).status, 401);
  let token;
  for (const role of ["CUSTOMER", "AGENT", "EMPLOYEE", "ADMIN"]) {
    record.role = role;
    const response = await login("/auth/native/login");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const { data } = await response.json();
    assert.equal(data.user.role, role);
    assert.equal(data.user.passwordHash, undefined);
    token = data.token;
    assert.equal(sessions.get(verifyAccessToken(token).jti).userId, record.id);
  }
  const authenticated = (path, method = "GET", body, tokenValue = token) => fetch(`${base}${path}`, {
    method, headers: { Authorization: `Bearer ${tokenValue}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  assert.equal((await authenticated("/auth/me")).status, 200);
  assert.equal((await authenticated("/auth/logout", "POST")).status, 200);
  assert.equal((await authenticated("/auth/me")).status, 401);
  assert.equal((await authenticated("/auth/change-password", "POST", {}, "invalid")).status, 401);
  const csrf = "fixture-csrf";
  const cookieHeaders = { Cookie: `${env.csrfCookieName}=${csrf}`, "X-CSRF-Token": csrf };
  const web = await login("/auth/login", password, cookieHeaders);
  assert.equal(web.status, 200);
  assert.equal((await web.json()).data.token, undefined);
  const accessCookie = web.headers.getSetCookie().find((cookie) => cookie.startsWith(`${env.accessTokenCookieName}=`)).split(";")[0];
  const cookieRequest = { method: "POST", headers: { Cookie: `${accessCookie}; ${env.csrfCookieName}=${csrf}` } };
  assert.equal((await fetch(`${base}/auth/logout`, cookieRequest)).status, 403);
  cookieRequest.headers["X-CSRF-Token"] = csrf;
  assert.equal((await fetch(`${base}/auth/logout`, cookieRequest)).status, 200);
  assert.equal((await fetch(`${base}/auth/me`, { headers: { Cookie: accessCookie } })).status, 401);
  token = (await (await login("/auth/native/login")).json()).data.token;
  const otherToken = (await (await login("/auth/native/login")).json()).data.token;
  const newPassword = randomBytes(16).toString("hex");
  assert.equal((await authenticated("/auth/change-password", "POST", { currentPassword: password, newPassword })).status, 200);
  assert.equal((await authenticated("/auth/me")).status, 401);
  assert.equal((await authenticated("/auth/me", "GET", undefined, otherToken)).status, 401);
  assert.equal((await login("/auth/native/login", password)).status, 401);
  const fresh = await login("/auth/native/login", newPassword);
  assert.equal(fresh.status, 200);
  const freshToken = (await fresh.json()).data.token;
  sessions.get(verifyAccessToken(freshToken).jti).expiresAt = new Date(0);
  assert.equal((await authenticated("/auth/me", "GET", undefined, freshToken)).status, 401);
  const expired = signAccessToken({ sub: record.id, jti: "missing-session", role: record.role, email: record.email, displayName: record.displayName });
  assert.equal((await authenticated("/auth/me", "GET", undefined, expired)).status, 401);
});
