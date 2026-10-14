import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import express from "express";
import multer from "multer";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = randomBytes(32).toString("hex");
process.env.DATABASE_URL = "mysql://unused@127.0.0.1:3306/unused";
process.env.LOG_LEVEL = "silent";
const { errorHandler } = await import("../dist/middleware/errorHandler.js");
const { validatedUploadName } = await import("../dist/utils/upload.js");

test("real multipart parser rejects oversize and unexpected files with safe client errors", async (t) => {
  const app = express();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 64, files: 1 },
    fileFilter: (_req, file, callback) => {
      try { validatedUploadName(file, "photo"); callback(null, true); }
      catch (error) { callback(error); }
    }
  });
  app.post("/upload", upload.single("photo"), (req, res) => res.json({ bytes: req.file.size }));
  app.use(errorHandler);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/upload`;
  const send = (field, filename, size) => {
    const form = new FormData();
    form.append(field, new Blob([new Uint8Array(size)], { type: "image/png" }), filename);
    return fetch(url, { method: "POST", body: form });
  };
  const valid = await send("photo", "image.png", 32);
  assert.equal(valid.status, 200);
  assert.deepEqual(await valid.json(), { bytes: 32 });
  const large = await send("photo", "image.png", 65);
  assert.equal(large.status, 413);
  assert.deepEqual(await large.json(), { success: false, message: "File exceeds upload size limit" });
  assert.equal((await send("other", "image.png", 32)).status, 400);
  assert.equal((await send("photo", "payload.html", 32)).status, 400);
});
