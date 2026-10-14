import assert from "node:assert/strict";
import { test } from "node:test";
import { agentSchema, assetUrl, batchSchema, createSchema, filterSchema, geometryBatch, idSchema, inquirySchema, normalize, plotEditSchema, polygonSchema, rectangle, regionsSchema } from "../src/features/inventory/contracts.ts";

const id = "d9428888-122b-4e7d-9ab7-a2b6edbb1234";
const points = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }];
test("route IDs and plot filters reject unsafe paths, arrays and unknown statuses", () => {
  for (const value of ["../plots", "coords", [id], undefined]) assert.equal(idSchema.safeParse(value).success, false);
  assert.deepEqual(filterSchema.parse({ ventureId: id, status: "ADVANCE" }), { ventureId: id, status: "ADVANCE" });
  assert.equal(filterSchema.safeParse({ ventureId: id, status: "BOOKED" }).success, false);
});
test("touch normalization handles bounds and reverse rectangle corners", () => {
  assert.deepEqual(normalize(200, 50, 400, 100), { x: 0.5, y: 0.5 });
  assert.deepEqual(normalize(-10, 200, 100, 100), { x: 0, y: 1 });
  assert.throws(() => normalize(1, 1, 0, 200));
  assert.deepEqual(rectangle({ x: 0.8, y: 0.6 }, { x: 0.2, y: 0.1 }), { x: 0.2, y: 0.1, width: 0.6000000000000001, height: 0.5 });
});
test("geometry batches send only edited plots and preserve polygon server shape", () => {
  const rows = [{ id, shapeData: { type: "polygon", points }, x: 0.2, y: 0.2 }, { id: "d9428888-122b-4e7d-9ab7-a2b6edbb1235", width: 0.1 }];
  assert.deepEqual(geometryBatch(rows, [id]), { plots: [{ id, shapeData: { type: "polygon", points } }] });
  assert.equal(batchSchema.safeParse({ plots: [{ id }] }).success, false);
  assert.equal(polygonSchema.safeParse({ type: "polygon", points: points.slice(0,2) }).success, false);
  assert.equal(polygonSchema.safeParse({ type: "polygon", points: [...points, { x: 1.1, y: 0 }] }).success, false);
});
test("road and park inputs enforce normalized backend collection limits", () => {
  assert.deepEqual(regionsSchema.parse({ roads: [{ points }], parks: [] }), { roads: [{ points }], parks: [] });
  assert.equal(regionsSchema.safeParse({ roads: Array.from({ length: 201 }, () => ({ points })), parks: [] }).success, false);
  assert.equal(regionsSchema.safeParse({ roads: [{ points: Array.from({ length: 501 }, () => points[0]) }], parks: [] }).success, false);
  assert.equal(regionsSchema.safeParse({ roads: [{ points: [{ x: -0.1, y: 0 }, ...points] }], parks: [] }).success, false);
});
test("inventory forms retain exact writable fields and reject invalid numbers", () => {
  assert.deepEqual(plotEditSchema.parse({ plotNumber: " P1 ", status: "SOLD", area: "100", pricePerSqYard: "2000", role: "ADMIN" }), { plotNumber: "P1", status: "SOLD", area: 100, pricePerSqYard: 2000 });
  for (const area of ["", "0", "1.2", "abc"]) assert.equal(plotEditSchema.safeParse({ plotNumber: "P1", status: "AVAILABLE", area, pricePerSqYard: "1" }).success, false);
  const form = { name: "Venture", locationName: "Location", plotCount: "200", plotNumberPrefix: "P-", startingPlotNumber: "1", defaultArea: "100", defaultPricePerSqYard: "500" };
  assert.equal(createSchema.parse(form).plotCount, 200);
  assert.equal(createSchema.safeParse({ ...form, plotCount: 201 }).success, false);
});
test("inquiry validation accepts optional references and validates contact/message", () => {
  const form = { customerName: "Test Reader", customerEmail: "reader@example.test", customerPhone: "", message: "Please contact me about this plot." };
  assert.equal(inquirySchema.parse({ ...form, plotId: id }).plotId, id);
  assert.equal(inquirySchema.safeParse({ ...form, agentId: "../agents" }).success, false);
  assert.equal(inquirySchema.safeParse({ ...form, message: "short" }).success, false);
  assert.equal(inquirySchema.safeParse({ ...form, customerEmail: "invalid" }).success, false);
});
test("agent profile uses phone separately from user phoneNumber", () => {
  const result = agentSchema.parse({ id, displayName: "Agent", fullName: "Test Agent", email: "agent@example.test", phoneNumber: null, department: null, position: null, agentProfile: { bio: null, phone: "12345", licenseNumber: null, photoUrl: null } });
  assert.equal(result.agentProfile.phone, "12345");
});
test("asset URLs allow HTTPS and only configured private HTTP previews", () => {
  const base = process.env.EXPO_PUBLIC_API_URL; const channel = process.env.EXPO_PUBLIC_BUILD_CHANNEL;
  try {
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.test/api"; delete process.env.EXPO_PUBLIC_BUILD_CHANNEL;
    assert.equal(assetUrl("/uploads/layout.png"), "https://api.example.test/uploads/layout.png");
    for (const source of ["javascript:alert(1)", "file:///secret", "data:image/png;base64,a", "http://public.example.test/layout.png", "https://user:pass@example.test/x"]) assert.equal(assetUrl(source), undefined);
    process.env.EXPO_PUBLIC_API_URL = "http://192.168.1.20:4000/api";
    assert.equal(assetUrl("/uploads/layout.png"), undefined);
    process.env.EXPO_PUBLIC_BUILD_CHANNEL = "local-preview";
    assert.equal(assetUrl("/uploads/layout.png"), "http://192.168.1.20:4000/uploads/layout.png");
    assert.equal(assetUrl("http://192.168.1.21:4000/layout.png"), undefined);
    assert.equal(assetUrl("http://public.example.test/layout.png"), undefined);
  } finally {
    if (base === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = base;
    if (channel === undefined) delete process.env.EXPO_PUBLIC_BUILD_CHANNEL; else process.env.EXPO_PUBLIC_BUILD_CHANNEL = channel;
  }
});
