import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import { test } from "node:test";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = randomBytes(32).toString("hex");
process.env.DATABASE_URL = "mysql://unused@127.0.0.1:3306/unused";
process.env.LOG_LEVEL = "silent";
const { prisma } = await import("../dist/config/prisma.js");
const { customerRecordMatchesEmail, customerRecordAccessWhere } = await import("../dist/services/access.service.js");
const { listCustomerRecords, updateCustomerRecord, deleteCustomerRecord } = await import("../dist/services/customer.service.js");
const { listTrackingUpdates, upsertTrackingUpdate } = await import("../dist/services/tracking.service.js");
const { createApp } = await import("../dist/app.js");
const { signAccessToken } = await import("../dist/utils/tokens.js");

const mockMethod = (t, target, name, implementation) => {
  const original = target[name];
  const mock = t.mock.fn(implementation);
  target[name] = mock;
  t.after(() => { target[name] = original; });
  return mock;
};

test("legacy notes identify complete customer emails rather than substrings", () => {
  const email = "owner@example.test";
  for (const notes of [`Email: ${email}`, `Email:${email}`, `Contact <${email}>`, `EMAIL: OWNER@EXAMPLE.TEST`]) {
    assert.equal(customerRecordMatchesEmail(notes, email), true);
  }
  for (const notes of [`Email: other-${email}`, `Email: ${email}.other`, null, "No contact"]) {
    assert.equal(customerRecordMatchesEmail(notes, email), false);
  }
  assert.equal(customerRecordMatchesEmail(email, undefined), false);
});

test("customer pagination and totals omit foreign substring matches", async (t) => {
  mockMethod(t, prisma.customerRecord, "findMany", async () => [
    { id: "foreign", notes: "Email: other-owner@example.test" },
    { id: "own-1", notes: "Email: owner@example.test" },
    { id: "own-2", notes: "owner@example.test" }
  ]);
  const result = await listCustomerRecords({
    page: 2, pageSize: 1, requester: { role: "CUSTOMER", email: "owner@example.test" }
  });
  assert.deepEqual(result.data.map((record) => record.id), ["own-2"]);
  assert.deepEqual(result.pagination, { total: 2, page: 2, pageSize: 1, pageCount: 2 });
  assert.deepEqual(await customerRecordAccessWhere({ role: "CUSTOMER" }), { id: { in: [] } });
});

test("staff scope uses persisted aliases and blocks foreign record and tracking writes", async (t) => {
  mockMethod(t, prisma.user, "findUnique", async () => ({
    fullName: "Fixture Owner", displayName: "Owner", email: "owner@example.test", employeeId: "EMP-FIXTURE"
  }));
  const aliases = ["Fixture Owner", "Owner", "owner@example.test", "EMP-FIXTURE"];
  const scope = { OR: [{ leadName: { in: aliases } }, { recordOwner: { in: aliases } }] };
  for (const role of ["EMPLOYEE", "AGENT"]) {
    const requester = { role, userId: "owner", displayName: "Spoofed Name", email: "spoofed@example.test" };
    assert.deepEqual(await customerRecordAccessWhere(requester), scope);
    mockMethod(t, prisma.customerRecord, "findFirst", async ({ where }) => {
      assert.deepEqual(where.AND[1], scope);
      return null;
    });
    await assert.rejects(() => updateCustomerRecord("foreign", {}, requester), (error) => error.statusCode === 404);
    await assert.rejects(() => deleteCustomerRecord("foreign", requester), (error) => error.statusCode === 404);
    await assert.rejects(() => upsertTrackingUpdate({ customerId: "foreign" }, requester), (error) => error.statusCode === 404);
  }
});

test("tracking responses discard foreign notes matches and never return ownership notes", async (t) => {
  mockMethod(t, prisma.trackingUpdate, "findMany", async ({ where }) => {
    assert.deepEqual(where, { customer: { notes: { contains: "owner@example.test" } } });
    return [
      { customerId: "foreign", latitude: 1, customer: { notes: "other-owner@example.test" } },
      { customerId: "own", latitude: 2, customer: { notes: "Email: owner@example.test" } }
    ];
  });
  const result = await listTrackingUpdates({ role: "CUSTOMER", email: "owner@example.test" });
  assert.deepEqual(result, [{ customerId: "own", latitude: 2 }]);
});

test("privileged employee signup rejects anonymous and non-admin callers", async (t) => {
  const originalSession = prisma.authSession.findUnique;
  prisma.authSession.findUnique = async ({ where }) => ({ userId: where.id, expiresAt: new Date(Date.now() + 60_000), revokedAt: null });
  t.after(() => { prisma.authSession.findUnique = originalSession; });
  mockMethod(t, prisma.user, "findUnique", async ({ where }) => ({
    role: where.id.split(":")[1], email: "fixture@example.test", displayName: "Fixture", employeeProfile: null
  }));
  const server = createServer(createApp());
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const url = `http://127.0.0.1:${server.address().port}/api/auth/register`;
  assert.equal((await fetch(url, { method: "POST" })).status, 401);
  for (const role of ["EMPLOYEE", "AGENT", "CUSTOMER"]) {
    const token = signAccessToken({ sub: `fixture:${role}`, jti: `fixture:${role}`, role, email: "fixture@example.test", displayName: "Fixture" });
    const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    assert.equal(response.status, 403);
  }
  const token = signAccessToken({ sub: "fixture:ADMIN", jti: "fixture:ADMIN", role: "ADMIN", email: "fixture@example.test", displayName: "Fixture" });
  const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  assert.equal(response.status, 400);
  assert.equal(response.headers.get("set-cookie"), null);
});
