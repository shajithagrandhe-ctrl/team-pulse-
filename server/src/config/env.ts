import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("4000"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("1d"),
  CORS_ORIGIN: z.string().default("http://localhost:8081,http://localhost:8082"),
  REALTIME_TRANSPORT: z.enum(["sse", "ws"]).default("sse"),
  REALTIME_REDIS_URL: z
    .preprocess((value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    }, z.string().optional()),
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
  COOKIE_DOMAIN: z
    .preprocess((value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    }, z.string().optional()),
  CSRF_COOKIE_NAME: z.string().default("estatehub_csrf"),
  ACCESS_TOKEN_COOKIE_NAME: z.string().default("estatehub_access"),
  LOG_LEVEL: z.string().default("info")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  port: Number(parsed.data.PORT),
  databaseUrl: parsed.data.DATABASE_URL,
  jwtSecret: parsed.data.JWT_SECRET,
  jwtExpiresIn: parsed.data.JWT_EXPIRES_IN,
  corsOrigin: parsed.data.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
  realtimeTransport: parsed.data.REALTIME_TRANSPORT,
  realtimeRedisUrl: parsed.data.REALTIME_REDIS_URL,
  cookieSameSite: parsed.data.COOKIE_SAMESITE,
  cookieDomain: parsed.data.COOKIE_DOMAIN,
  csrfCookieName: parsed.data.CSRF_COOKIE_NAME,
  accessTokenCookieName: parsed.data.ACCESS_TOKEN_COOKIE_NAME,
  logLevel: parsed.data.LOG_LEVEL
};
