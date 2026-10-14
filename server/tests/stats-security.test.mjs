import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = randomBytes(32).toString("hex");
process.env.DATABASE_URL = "mysql://unused@127.0.0.1:3306/unused";
process.env.LOG_LEVEL = "silent";
const { prisma } = await import("../dist/config/prisma.js");
const { getDashboardStats } = await import("../dist/services/stats.service.js");
test("customer dashboard counts only associated plots, own leads and exact-email records", async t => {
  const mock = (target, name, fn) => { const original = target[name]; target[name] = fn; t.after(() => { target[name] = original; }); };
  const email = "owner@example.test";
  const scope = { leads: { some: { email } } };
  mock(prisma.plot, "count", async ({ where }) => {
    if (where.AND) assert.deepEqual(where.AND[0], scope); else assert.deepEqual(where, scope);
    return 2;
  });
  mock(prisma.lead, "count", async ({ where }) => { assert.deepEqual(where, { email }); return 1; });
  mock(prisma.customerRecord, "findMany", async ({ where }) => {
    assert.deepEqual(where, { notes: { contains: email } });
    return [{ notes: `Email: ${email}` }, { notes: `other-${email}` }];
  });
  mock(prisma.user, "count", () => assert.fail("Global employee count leaked"));
  mock(prisma.location, "count", () => assert.fail("Global location count leaked"));
  const stats = await getDashboardStats({ role: "CUSTOMER", userId: "fixture", email });
  assert.equal(stats.customers, 1); assert.equal(stats.leads, 1); assert.equal(stats.employees, 0);
});
test("missing role never falls through to global counts", async () => {
  assert.equal((await getDashboardStats()).plots, 0);
});
