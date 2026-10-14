import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = randomBytes(32).toString("hex");
process.env.DATABASE_URL = "mysql://unused@127.0.0.1:3306/unused";
process.env.LOG_LEVEL = "silent";
const { prisma } = await import("../dist/config/prisma.js");
const { plotAccessWhere, leadAccessWhere } = await import("../dist/services/access.service.js");
const { getPlotById, updatePlot } = await import("../dist/services/plot.service.js");
const { getVentureById } = await import("../dist/services/venture.service.js");
const { createLead, updateLead, deleteLead } = await import("../dist/services/lead.service.js");

const mockMethod = (t, target, name, implementation) => {
  const original = target[name];
  const mock = t.mock.fn(implementation);
  target[name] = mock;
  t.after(() => { target[name] = original; });
  return mock;
};

test("employee scope includes only assigned ventures or locations and denies inactive accounts", async (t) => {
  const requester = { userId: "employee-fixture", role: "EMPLOYEE" };
  const profile = mockMethod(t, prisma.employeeProfile, "findUnique", async () => ({ status: "ACTIVE", dateOfRelieving: null }));
  const assignments = mockMethod(t, prisma, "$queryRawUnsafe", async () => [{
    assignedLocationIds: ["location-fixture"], assignedVentureIds: ["venture-fixture"]
  }]);
  const expected = { OR: [
    { ventureId: { in: ["venture-fixture"] } },
    { venture: { locationId: { in: ["location-fixture"] } } }
  ] };
  assert.deepEqual(await plotAccessWhere(requester), expected);
  assert.deepEqual(await leadAccessWhere(requester), { plot: expected });
  assignments.mock.mockImplementation(async () => []);
  assert.deepEqual(await plotAccessWhere(requester), { OR: [
    { ventureId: { in: [] } }, { venture: { locationId: { in: [] } } }
  ] });
  for (const account of [{ status: "FROZEN" }, { status: "ACTIVE", dateOfRelieving: new Date(0) }]) {
    profile.mock.mockImplementation(async () => account);
    assert.deepEqual(await plotAccessWhere(requester), { id: { in: [] } });
  }
  assert.deepEqual(await plotAccessWhere({ role: "EMPLOYEE" }), { id: { in: [] } });
  assert.deepEqual(await plotAccessWhere(), { id: { in: [] } });
});

test("customer details filter nested leads, and agents receive only their own leads", async (t) => {
  let query;
  mockMethod(t, prisma.plot, "findFirst", async (args) => { query = args; return null; });
  const customer = { role: "CUSTOMER", email: "owner@example.test" };
  await getPlotById("plot-fixture", customer);
  assert.deepEqual(query.include.leads, { where: { email: customer.email } });
  assert.deepEqual(query.where.AND, [{ leads: { some: { email: customer.email } } }]);
  await getPlotById("plot-fixture", { role: "AGENT", userId: "agent-fixture" });
  assert.deepEqual(query.include.leads, { where: { agentId: "agent-fixture" } });
  mockMethod(t, prisma.venture, "findUnique", async (args) => { query = args; return null; });
  await getVentureById("venture-fixture", { role: "AGENT", userId: "agent-fixture" });
  assert.deepEqual(query.include.plots.include.leads, { where: { agentId: "agent-fixture" } });
  assert.deepEqual(await leadAccessWhere({ role: "AGENT", userId: "agent-fixture" }), { agentId: "agent-fixture" });
  assert.deepEqual(await leadAccessWhere({ role: "AGENT" }), { id: { in: [] } });
  assert.deepEqual(await plotAccessWhere({ role: "CUSTOMER" }), { id: { in: [] } });
  assert.deepEqual(await leadAccessWhere({ role: "ADMIN" }), {});
});

test("unassigned employee mutations stop before any database write", async (t) => {
  const requester = { role: "EMPLOYEE", userId: "employee-fixture" };
  mockMethod(t, prisma.employeeProfile, "findUnique", async () => ({ status: "ACTIVE" }));
  mockMethod(t, prisma, "$queryRawUnsafe", async () => []);
  const deny = async ({ where }) => {
    const scope = where.AND[1];
    assert.deepEqual(scope.plot ?? scope, { OR: [
      { ventureId: { in: [] } }, { venture: { locationId: { in: [] } } }
    ] });
    return null;
  };
  mockMethod(t, prisma.plot, "findFirst", deny);
  mockMethod(t, prisma.lead, "findFirst", deny);
  const writes = [
    mockMethod(t, prisma.plot, "update", () => assert.fail("Unauthorized plot write")),
    mockMethod(t, prisma.lead, "update", () => assert.fail("Unauthorized lead write")),
    mockMethod(t, prisma.lead, "delete", () => assert.fail("Unauthorized lead delete")),
    mockMethod(t, prisma, "$transaction", () => assert.fail("Unauthorized transaction"))
  ];
  for (const action of [
    () => updatePlot("plot-fixture", { status: "SOLD" }, requester),
    () => createLead({ plotId: "plot-fixture" }, requester),
    () => updateLead("lead-fixture", { notes: "attempt" }, requester),
    () => deleteLead("lead-fixture", requester)
  ]) {
    await assert.rejects(action, (error) => error.statusCode === 404);
  }
  for (const write of writes) assert.equal(write.mock.callCount(), 0);
});
