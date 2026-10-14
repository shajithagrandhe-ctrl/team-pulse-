import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import { test } from "node:test";
import { WebSocket } from "ws";
import { sessionFixture } from "./helpers/session-fixture.mjs";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = randomBytes(32).toString("hex");
process.env.DATABASE_URL = "mysql://unused@127.0.0.1:3306/unused";
process.env.REALTIME_REDIS_URL = "";
process.env.LOG_LEVEL = "silent";

const { createApp } = await import("../dist/app.js");
const { attachWebSocketServer } = await import("../dist/realtime/ws.js");
const { publishEvent } = await import("../dist/realtime/events.js");
const { signAccessToken } = await import("../dist/utils/tokens.js");
const { eventForRole } = await import("../dist/realtime/audience.js");
const { prisma } = await import("../dist/config/prisma.js");

const privateEvent = {
  id: "test-event", type: "tracking.updated", createdAt: new Date().toISOString(),
  origin: "private-instance",
  payload: { tracking: { customerId: "other-customer", latitude: 17.1, longitude: 83.1 } }
};

test("non-admin notifications never carry records or internal origin", () => {
  for (const role of ["CUSTOMER", "EMPLOYEE", "AGENT", "unknown"]) {
    const event = eventForRole(privateEvent, role);
    assert.deepEqual(event.payload, {});
    assert.equal(event.origin, undefined);
    assert.equal(event.type, privateEvent.type);
    assert.equal(event.id, privateEvent.id);
  }
  assert.deepEqual(eventForRole(privateEvent, "ADMIN"), privateEvent);
});

test("SSE and WebSocket enforce payload protection for every role", async (t) => {
  sessionFixture(t, prisma);
  const originalFind = prisma.user.findUnique;
  prisma.user.findUnique = async ({ where }) => ({
    role: where.id.split(":")[1], email: "fixture@example.test", displayName: "Fixture", employeeProfile: null
  });
  t.after(() => { prisma.user.findUnique = originalFind; });
  const server = createServer(createApp());
  const wss = attachWebSocketServer(server);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    for (const socket of wss.clients) socket.terminate();
    await new Promise((resolve) => wss.close(resolve));
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  assert.equal((await fetch(`${base}/api/stream`)).status, 401);
  assert.equal((await fetch(`${base}/api/stream`, {
    headers: { Authorization: "Bearer invalid" }
  })).status, 401);

  for (const role of ["CUSTOMER", "EMPLOYEE", "AGENT", "ADMIN"]) {
    const token = signAccessToken({ sub: `test-user:${role}`, jti: `test-user:${role}`, role, email: "fixture@example.test", displayName: "Fixture" });
    const headers = { Authorization: `Bearer ${token}` };
    const response = await fetch(`${base}/api/stream`, { headers });
    assert.equal(response.status, 200);
    const reader = response.body.getReader();
    await reader.read();
    const ws = new WebSocket(`${base.replace("http", "ws")}/api/ws`, { headers });
    await once(ws, "message");
    const messagePromise = once(ws, "message");
    publishEvent(privateEvent.type, privateEvent.payload);
    let text = "";
    while (!text.includes("event: tracking.updated")) {
      const chunk = await reader.read();
      assert.equal(chunk.done, false);
      text += new TextDecoder().decode(chunk.value);
    }
    const block = text.split("\n\n").find((value) => value.includes("event: tracking.updated"));
    const sseEvent = JSON.parse(block.split("\n").find((line) => line.startsWith("data: ")).slice(6));
    const [message] = await messagePromise;
    const wsEvent = JSON.parse(message.toString());
    for (const event of [sseEvent, wsEvent]) {
      assert.equal(event.type, privateEvent.type);
      assert.deepEqual(event.payload, role === "ADMIN" ? privateEvent.payload : {});
    }
    await reader.cancel();
    ws.close();
    await once(ws, "close");
  }
});
