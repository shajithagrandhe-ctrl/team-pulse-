import assert from "node:assert/strict";
import { test } from "node:test";
import { createApiClient, validateApiUrl } from "../../shared/api-client.ts";

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const client = (fetch, extras = {}) => createApiClient({
  baseUrl: "https://fixture.example/api", getToken: async () => "fixture-token",
  onUnauthorized: () => assert.fail("Unexpected signout"), fetch, ...extras
});

test("API configuration restricts HTTP to private development networks and rejects credentials", () => {
  assert.equal(validateApiUrl("http://192.168.1.10:4000/api", true), "http://192.168.1.10:4000/api");
  for (const url of ["http://example.com/api", "https://user:pass@example.com/api", "https://api.example.invalid/api", "https://example.com/api?secret=x"]) {
    assert.throws(() => validateApiUrl(url, true));
  }
  assert.throws(() => validateApiUrl("http://192.168.1.10:4000/api"));
  assert.throws(() => validateApiUrl(undefined));
});

test("typed requests use explicit bearer auth, omit cookies and encode query parameters", async () => {
  const api = client(async (url, options) => {
    assert.equal(url, "https://fixture.example/api/plots?search=a+%26+b&page=2");
    assert.equal(options.credentials, "omit");
    assert.equal(options.headers.Authorization, "Bearer fixture-token");
    return json(200, { success: true, data: [], message: "Plots" });
  });
  assert.deepEqual((await api.request("/plots", { query: { search: "a & b", page: 2, ignored: undefined } })).data, []);
  for (const path of ["https://other.example/plots", "//other.example/plots", "/../secret", "/%2E%2E/secret"]) {
    await assert.rejects(api.request(path), (error) => error.kind === "protocol");
  }
});

test("credential requests do not carry a previous account token", async () => {
  const api = client(async (_url, options) => {
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.equal(options.body, '{"email":"fixture@example.test"}');
    return json(401, { success: false, message: "Invalid email or password" });
  });
  await assert.rejects(api.request("/auth/native/login", { method: "POST", authenticated: false, body: { email: "fixture@example.test" } }),
    (error) => error.status === 401 && error.message === "Invalid email or password");
});

test("expired current sessions sign out, but a stale previous session response does not", async () => {
  let token = "first";
  let signouts = 0;
  let changeToken = false;
  const api = client(async () => {
    if (changeToken) token = "second";
    return json(401, { success: false, message: "Expired" });
  }, { getToken: async () => token, onUnauthorized: () => { signouts++; } });
  await assert.rejects(api.request("/auth/me"));
  assert.equal(signouts, 1);
  changeToken = true;
  await assert.rejects(api.request("/auth/me"));
  assert.equal(signouts, 1);
});

test("network, malformed responses and internal details are normalized", async () => {
  await assert.rejects(client(async () => { throw new Error("private details"); }).request("/plots"),
    (error) => error.kind === "network" && !error.message.includes("private"));
  await assert.rejects(client(async () => new Response("not JSON")).request("/plots"), (error) => error.kind === "protocol");
  await assert.rejects(client(async () => json(500, { success: false, message: "private SQL" })).request("/plots"),
    (error) => error.status === 500 && !error.message.includes("SQL"));
});

test("timeouts and external cancellation propagate to fetch", async () => {
  const pending = async (_url, { signal }) => new Promise((_resolve, reject) => {
    if (signal.aborted) reject(new Error("aborted"));
    else signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
  });
  await assert.rejects(client(pending, { timeoutMs: 5 }).request("/plots"), (error) => error.kind === "timeout");
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(client(pending).request("/plots", { signal: controller.signal }), (error) => error.kind === "cancelled");
});

test("multipart requests leave the boundary to fetch and missing sessions never reach the network", async () => {
  const body = new FormData();
  body.append("photo", new Blob(["image"], { type: "image/png" }), "image.png");
  await client(async (_url, options) => {
    assert.equal(options.headers["Content-Type"], undefined);
    assert.equal(options.body, body);
    return json(200, { success: true, data: {}, message: "Uploaded" });
  }).request("/ventures/fixture/photo", { method: "POST", body });
  await assert.rejects(client(() => assert.fail("No session"), { getToken: async () => null }).request("/plots"), (error) => error.status === 401);
});

test("frozen active accounts sign out but ordinary permission denials do not", async () => {
  let message = "Access denied";
  let signouts = 0;
  const api = client(async () => json(403, { success: false, message }), { onUnauthorized: () => { signouts++; } });
  await assert.rejects(api.request("/employees"));
  assert.equal(signouts, 0);
  message = "Employee account is frozen";
  await assert.rejects(api.request("/auth/me"));
  assert.equal(signouts, 1);
});

test("invalid pagination cannot drive loops or incorrect record totals", async () => {
  for (const pagination of [null, {}, { total: -1, page: 1, pageSize: 30, pageCount: 1 },
    { total: 1, page: 1, pageSize: 0, pageCount: 1 }, { total: 1, page: 1.1, pageSize: 30, pageCount: 1 }]) {
    await assert.rejects(client(async () => json(200, { success: true, data: [], pagination })).request("/leads"), error => error.kind === "protocol");
  }
});
