import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { verifyAccessToken } from "./tokens.js";
import { assertActiveAccount } from "../services/session.service.js";

const cookieOptions = {
  httpOnly: false,
  sameSite: env.cookieSameSite,
  secure: env.nodeEnv === "production",
  path: "/",
  ...(env.cookieDomain ? { domain: env.cookieDomain } : {})
};

export const issueCsrfToken = (res: Response) => {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(env.csrfCookieName, token, cookieOptions);
  return token;
};

export const csrfProtection = async (req: Request, res: Response, next: NextFunction) => {
  const method = req.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return next();
  }

  // This credential-only route never reads or sets a cookie session.
  if (method === "POST" && req.path === "/api/auth/native/login") return next();
  const authorization = req.header("authorization");
  if (authorization?.startsWith("Bearer ")) {
    let payload;
    try { payload = verifyAccessToken(authorization.slice(7).trim()); }
    catch { return res.status(401).json({ success: false, message: "Invalid or expired token" }); }
    try {
      if (!payload.jti) return res.status(401).json({ success: false, message: "Sign in again to use native authentication" });
      await assertActiveAccount(payload);
      return next();
    } catch (error) { return next(error); }
  }

  const headerToken = req.header("x-csrf-token");
  const cookieToken = req.cookies?.[env.csrfCookieName];

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return res.status(403).json({
      success: false,
      message: "Invalid CSRF token"
    });
  }

  return next();
};
