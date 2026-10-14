import type { Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { env } from "../config/env.js";
import { issueCsrfToken } from "../utils/csrf.js";
import { changeOwnPassword, createCustomerCredentials, loginUser, registerUser } from "../services/auth.service.js";
import { getUserById } from "../services/user.service.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { publishEvent } from "../realtime/events.js";
import { logger } from "../config/logger.js";
import { extractToken } from "../middleware/auth.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { revokeAccessSession } from "../services/session.service.js";

const authFailure = (res: Response, error: unknown, expected: Record<string, number>, fallback: string) => {
  const message = error instanceof Error ? error.message : "";
  if (expected[message]) return res.status(expected[message]).json({ success: false, message });
  logger.error({ err: error }, fallback);
  return res.status(500).json({ success: false, message: fallback });
};

const accessCookieOptions = {
  httpOnly: true,
  sameSite: env.cookieSameSite,
  secure: env.nodeEnv === "production",
  path: "/",
  ...(env.cookieDomain ? { domain: env.cookieDomain } : {})
};

export const getCsrfToken = (_req: Request, res: Response) => {
  const token = issueCsrfToken(res);
  return res.json({
    success: true,
    data: { token },
    message: "CSRF token issued"
  });
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, adminCode } = req.body;
    const { user, token } = await loginUser(email, password, adminCode);

    res.cookie(env.accessTokenCookieName, token, accessCookieOptions);
    issueCsrfToken(res);

    return res.json({
      success: true,
      data: { user },
      message: "Login successful"
    });
  } catch (error) {
    return authFailure(res, error, {
      "Invalid email or password": 401, "Invalid admin code": 401, "Employee account is frozen": 403
    }, "Unable to sign in. Please try again later.");
  }
};

export const nativeLogin = async (req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const { email, password, adminCode } = req.body;
    const { user, token } = await loginUser(email, password, adminCode);
    return res.json({ success: true, data: { user, token }, message: "Login successful" });
  } catch (error) {
    return authFailure(res, error, {
      "Invalid email or password": 401, "Invalid admin code": 401, "Employee account is frozen": 403
    }, "Unable to sign in. Please try again later.");
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, fullName, role, department, position, employeeId, phoneNumber, address } = req.body;

    const { user } = await registerUser({
      email,
      password,
      displayName,
      fullName,
      role: role as UserRole,
      department,
      position,
      employeeId,
      phoneNumber,
      address
    });

    publishEvent("user.registered", { user });

    return res.status(201).json({
      success: true,
      data: { user },
      message: "Registration successful"
    });
  } catch (error) {
    return authFailure(res, error, { "Email is already in use": 409 }, "Unable to create the account. Please try again later.");
  }
};

export const logout = async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (token) {
    let payload;
    try { payload = verifyAccessToken(token); } catch { /* Invalid tokens still clear local cookies. */ }
    if (payload) await revokeAccessSession(payload);
  }
  const options = { path: "/", ...(env.cookieDomain ? { domain: env.cookieDomain } : {}) };
  res.clearCookie(env.accessTokenCookieName, options);
  res.clearCookie(env.csrfCookieName, options);

  return res.json({
    success: true,
    message: "Logged out"
  });
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }

  const user = await getUserById(userId);

  return res.json({
    success: true,
    data: { user },
    message: "User profile"
  });
};

export const createCustomerAccount = async (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user;
  if (!actor) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }

  try {
    const { email, password, displayName, fullName, phoneNumber, address } = req.body;
    const user = await createCustomerCredentials({
      email,
      password,
      displayName,
      fullName,
      phoneNumber,
      address
    });

    publishEvent("user.registered", { user, createdBy: actor.sub });

    return res.status(201).json({
      success: true,
      data: { user },
      message: "Customer credentials created successfully"
    });
  } catch (error) {
    return authFailure(res, error, { "Email is already in use": 409 }, "Unable to create customer credentials. Please try again later.");
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }

  try {
    await changeOwnPassword({
      userId,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword
    });

    return res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    return authFailure(res, error, { "Current password is incorrect": 400, "User not found": 400 }, "Unable to change the password. Please try again later.");
  }
};
