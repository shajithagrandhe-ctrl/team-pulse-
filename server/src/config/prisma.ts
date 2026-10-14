import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";
import { logger } from "./logger.js";

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.databaseUrl
    }
  },
  log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"]
});

process.on("beforeExit", async () => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    logger.error({ error }, "Failed to disconnect Prisma");
  }
});