import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import { test } from "node:test";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = randomBytes(32).toString("hex");
process.env.DATABASE_URL = "mysql://unused@127.0.0.1:3306/unused";
process.env.LOG_LEVEL = "silent";
const { prisma } = await import("../dist/config/prisma.js");
const { createApp } = await import("../dist/app.js");
const { signAccessToken } = await import("../dist/utils/tokens.js");
test("batch coordinates use the batch route, enforce ADMIN and validate region bounds", async t => {
  const id = randomUUID(), userId = randomUUID(), sessionId = randomUUID();
  let role = "ADMIN", writes = 0, regionWrites = 0;
  const replace = (target, key, fn) => { const original = target[key]; target[key] = fn; t.after(() => { target[key] = original; }); };
  replace(prisma.authSession, "findUnique", async () => ({ id: sessionId, userId, revokedAt: null, expiresAt: new Date(Date.now() + 60000) }));
  replace(prisma.user, "findUnique", async () => ({ role, email: "fixture@example.test", employeeProfile: null }));
  replace(prisma.plot, "findMany", async ({ where }) => { assert.deepEqual(where.id.in, [id]); return [{ id }]; });
  replace(prisma.plot, "update", ({ where, data }) => { writes++; assert.equal(where.id, id); assert.equal(data.x, 0.1); return Promise.resolve({ id, ...data }); });
  replace(prisma, "$transaction", async values => Promise.all(values));
  replace(prisma.venture, "update", async ({ data }) => { regionWrites++; return { id, ...data }; });
  const server = createServer(createApp()); server.listen(0, "127.0.0.1"); await once(server, "listening");
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const token = () => signAccessToken({ sub: userId, email: "fixture@example.test", role, jti: sessionId });
  const put = (path, body) => fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
    method: "PUT", headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" }, body: JSON.stringify(body)
  });
  const body = { plots: [{ id, x: 0.1, y: 0.2, width: 0.3, height: 0.4 }] };
  const response = await put("/plots/coords", body);
  assert.equal(response.status, 200); assert.equal((await response.json()).data[0].id, id); assert.equal(writes, 1);
  role = "EMPLOYEE"; assert.equal((await put("/plots/coords", body)).status, 403); assert.equal(writes, 1);
  role = "ADMIN";
  assert.equal((await put(`/ventures/${id}/regions`, { regions: { roads: [{ points: [{ x: 1.5, y: 0 }] }], parks: [] } })).status, 400);
  assert.equal(regionWrites, 0);
  assert.equal((await put(`/ventures/${id}/regions`, { regions: { roads: [{ points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }] }], parks: [] } })).status, 200);
  assert.equal(regionWrites, 1);
});
