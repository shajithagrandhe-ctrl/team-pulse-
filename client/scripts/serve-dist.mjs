import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = new Set(process.argv.slice(2));
const getArgValue = (name, fallback) => {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  const v = process.argv[idx + 1];
  return v ?? fallback;
};

const port = Number(getArgValue("--port", process.env.PORT || "8081"));
const root = path.resolve(__dirname, "..", "dist");

const contentTypeByExt = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2"
};

const send = (res, statusCode, body, headers = {}) => {
  res.statusCode = statusCode;
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(body);
};

const safeJoin = (base, urlPath) => {
  const normalized = urlPath.replaceAll("\\", "/");
  const joined = path.join(base, normalized);
  const resolved = path.resolve(joined);
  if (!resolved.startsWith(base)) return null;
  return resolved;
};

const readFile = (p) =>
  new Promise((resolve, reject) => {
    fs.readFile(p, (err, buf) => (err ? reject(err) : resolve(buf)));
  });

const server = http.createServer(async (req, res) => {
  try {
    const rawUrl = req.url || "/";
    const pathname = rawUrl.split("?")[0] || "/";

    const requestPath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
    const resolved = safeJoin(root, requestPath);

    if (!resolved) return send(res, 403, "Forbidden");

    try {
      const data = await readFile(resolved);
      const ext = path.extname(resolved).toLowerCase();
      return send(res, 200, data, { "Content-Type": contentTypeByExt[ext] || "application/octet-stream" });
    } catch {
      // SPA fallback
      const indexHtml = await readFile(path.join(root, "index.html"));
      return send(res, 200, indexHtml, { "Content-Type": contentTypeByExt[".html"] });
    }
  } catch (err) {
    return send(res, 500, `Internal Server Error\n${err?.message || String(err)}`);
  }
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Serving ${root}`);
  // eslint-disable-next-line no-console
  console.log(`Open http://localhost:${port}`);
  if (args.has("--help")) {
    // eslint-disable-next-line no-console
    console.log("Args: --port <number>");
  }
});

