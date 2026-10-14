import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AccessTokenPayload {
  sub: string;
  role: string;
  email: string;
  displayName: string;
  exp?: number;
  jti?: string;
}

export const signAccessToken = (payload: AccessTokenPayload) => {
  return jwt.sign(payload, env.jwtSecret as any, { expiresIn: env.jwtExpiresIn as any });
};

export const verifyAccessToken = (token: string) => {
  const payload = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
  if (typeof payload === "string" || typeof payload.sub !== "string" ||
      !["ADMIN", "EMPLOYEE", "AGENT", "CUSTOMER"].includes(payload.role) ||
      typeof payload.email !== "string" || typeof payload.displayName !== "string" || typeof payload.exp !== "number" ||
      typeof payload.jti !== "string" || !payload.jti) {
    throw new Error("Invalid session token");
  }
  return payload as AccessTokenPayload;
};
