import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import hpp from "hpp";
import path from "node:path";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import type { Request, Response } from "express";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import routes from "./routes/index.js";
import { csrfProtection } from "./utils/csrf.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");

  const allowedOrigins = new Set(env.corsOrigin.filter(Boolean));
  const isPrivateLanHostname = (hostname: string) => {
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    const match = hostname.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
    if (!match) return false;
    const secondOctet = Number(match[1]);
    return secondOctet >= 16 && secondOctet <= 31;
  };

  const isAllowedOrigin = (origin: string) => {
    if (allowedOrigins.has(origin)) return true;
    if (env.nodeEnv !== "development") return false;

    try {
      const url = new URL(origin);
      if (url.protocol !== "http:" && url.protocol !== "https:") return false;
      const hostname = url.hostname.toLowerCase();
      return hostname === "localhost" || hostname === "127.0.0.1" || isPrivateLanHostname(hostname);
    } catch {
      return false;
    }
  };

  app.use(
    pinoHttp({
      logger: logger as any,
      customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`
    })
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow non-browser requests (no Origin header).
        if (!origin) return callback(null, true);
        return callback(null, isAllowedOrigin(origin));
      },
      credentials: true,
      allowedHeaders: ["Content-Type", "X-CSRF-Token", "Authorization"]
    })
  );

  app.use(
    compression({
      filter: (req: Request, res: Response) => {
        const accept = req.headers.accept ?? "";
        if (accept.includes("text/event-stream")) {
          return false;
        }
        return compression.filter(req, res);
      }
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(hpp());

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 200,
      standardHeaders: "draft-7",
      legacyHeaders: false
    })
  );

  const uploadsDir = path.resolve(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsDir, {
    setHeaders: (res) => {
      res.setHeader("Content-Security-Policy", "sandbox; default-src 'none'; style-src 'unsafe-inline'");
      res.setHeader("X-Content-Type-Options", "nosniff");
    }
  }));

  if (env.nodeEnv === "production") {
    app.use(csrfProtection);
  }
  app.use("/api", routes);

  app.use(errorHandler);

  return app;
};
