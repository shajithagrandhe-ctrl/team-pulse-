import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = randomBytes(32).toString("hex");
process.env.DATABASE_URL = "mysql://unused@127.0.0.1:3306/unused";
process.env.LOG_LEVEL = "silent";
const { prisma } = await import("../dist/config/prisma.js");
const { addFavorite, listFavorites } = await import("../dist/services/favorite.service.js");
const { validatedUploadName } = await import("../dist/utils/upload.js");
const { getPagination } = await import("../dist/utils/pagination.js");

test("favorites cannot reveal or add a plot outside customer access", async (t) => {
  const originalFind = prisma.plot.findFirst;
  const originalList = prisma.favorite.findMany;
  const originalCreate = prisma.favorite.create;
  t.after(() => {
    prisma.plot.findFirst = originalFind;
    prisma.favorite.findMany = originalList;
    prisma.favorite.create = originalCreate;
  });
  const requester = { userId: "fixture", role: "CUSTOMER", email: "fixture@example.test" };
  prisma.plot.findFirst = async ({ where }) => {
    assert.deepEqual(where.AND[1], { leads: { some: { email: requester.email } } });
    return null;
  };
  prisma.favorite.create = () => assert.fail("Unauthorized favorite write");
  await assert.rejects(() => addFavorite(requester.userId, "foreign", requester), (error) => error.statusCode === 404);
  prisma.favorite.findMany = async ({ where }) => {
    assert.deepEqual(where, { userId: requester.userId, plot: { leads: { some: { email: requester.email } } } });
    return [];
  };
  assert.deepEqual(await listFavorites(requester.userId, requester), []);
});

test("uploads reject misleading extensions and use random canonical names", () => {
  assert.match(validatedUploadName({ mimetype: "image/jpeg", originalname: "Photo.JPEG" }, "photo"), /^photo-[\da-f-]+\.jpg$/);
  assert.notEqual(validatedUploadName({ mimetype: "image/png", originalname: "layout.png" }, "layout"),
    validatedUploadName({ mimetype: "image/png", originalname: "layout.png" }, "layout"));
  for (const file of [
    { mimetype: "image/png", originalname: "payload.html" },
    { mimetype: "text/html", originalname: "layout.png" },
    { mimetype: "image/svg+xml", originalname: "photo.svg" }
  ]) assert.throws(() => validatedUploadName(file, "photo"), (error) => error.statusCode === 400);
});

test("pagination always supplies bounded finite integer values", () => {
  for (const value of [NaN, Infinity, -Infinity, undefined]) {
    assert.deepEqual(getPagination(value, value), { page: 1, pageSize: 20, skip: 0, take: 20 });
  }
  assert.deepEqual(getPagination(2.7, 1000), { page: 2, pageSize: 100, skip: 100, take: 100 });
  assert.deepEqual(getPagination(-4, -8), { page: 1, pageSize: 1, skip: 0, take: 1 });
});
