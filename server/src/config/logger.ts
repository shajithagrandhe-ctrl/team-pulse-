import pino from "pino";
import { env } from "./env.js";

export const logger = pino({
  level: env.logLevel,
  redact: ["req.headers.authorization", "req.headers.cookie", 'res.headers["set-cookie"]'],
  base: {
    service: "estatehub-api"
  }
});
