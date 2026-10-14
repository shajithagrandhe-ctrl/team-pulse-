import fs from "node:fs";
import path from "node:path";

const source = path.resolve(process.cwd(), "..", "node_modules", ".prisma", "client");
const target = path.resolve(process.cwd(), "node_modules", ".prisma", "client");

if (!fs.existsSync(source)) {
  console.warn(`[prisma-sync] Source client not found: ${source}`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(target), { recursive: true });
try {
  fs.cpSync(source, target, { recursive: true, force: true });
  console.log(`[prisma-sync] Synced Prisma client to ${target}`);
} catch (error) {
  if (error && ["EPIPE", "EBUSY", "EPERM"].includes(error.code)) {
    console.warn(
      `[prisma-sync] Skipping sync because Prisma client files are locked: ${target}`,
    );
    process.exit(0);
  }

  throw error;
}
