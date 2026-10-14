import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import type { AccessTokenPayload } from "../utils/tokens.js";
import { signAccessToken, verifyAccessToken } from "../utils/tokens.js";
import { randomUUID } from "node:crypto";

export const createAccessSession = async (payload: AccessTokenPayload) => {
  const jti = randomUUID();
  const token = signAccessToken({ ...payload, jti });
  const verified = verifyAccessToken(token);
  await prisma.authSession.create({ data: { id: jti, userId: payload.sub, expiresAt: new Date(verified.exp! * 1000) } });
  return token;
};

export const revokeAccessSession = async (payload: AccessTokenPayload) => {
  if (!payload.jti) return;
  await prisma.authSession.updateMany({ where: { id: payload.jti, userId: payload.sub, revokedAt: null }, data: { revokedAt: new Date() } });
};

export const assertActiveAccount = async (payload: AccessTokenPayload) => {
  if (!payload.jti) throw new HttpError(401, "Session expired. Please sign in again.");
  if (payload.jti) {
    const session = await prisma.authSession.findUnique({ where: { id: payload.jti } });
    if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt <= new Date()) {
      throw new HttpError(401, "Session expired. Please sign in again.");
    }
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { role: true, email: true, displayName: true, employeeProfile: { select: { status: true, dateOfRelieving: true } } }
  });
  if (!user || user.role !== payload.role || user.email !== payload.email) {
    throw new HttpError(401, "Session expired. Please sign in again.");
  }
  const profile = user.employeeProfile;
  if (user.role === "EMPLOYEE" && (profile?.status === "FROZEN" || (profile?.dateOfRelieving && profile.dateOfRelieving <= new Date()))) {
    throw new HttpError(403, "Employee account is frozen");
  }
  return { ...payload, displayName: user.displayName };
};
