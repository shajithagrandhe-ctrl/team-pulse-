import { randomInt, randomUUID } from "crypto";
import { LRUCache } from "lru-cache";

export type OtpType = "email" | "phone";

type OtpRecord = {
  type: OtpType;
  target: string;
  otp: string;
  expiresAt: number;
  verifiedAt?: number;
};

const OTP_TTL_MS = 5 * 60 * 1000;

const otpCache = new LRUCache<string, OtpRecord>({
  max: 5000,
  ttl: OTP_TTL_MS
});

const normalizeTarget = (type: OtpType, target: string) => {
  const trimmed = target.trim();
  return type === "email" ? trimmed.toLowerCase() : trimmed;
};

export const requestOtp = (input: { type: OtpType; target: string }) => {
  const target = normalizeTarget(input.type, input.target);
  if (!target) {
    throw new Error("Target is required");
  }

  const otp = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const requestId = randomUUID();
  const expiresAt = Date.now() + OTP_TTL_MS;

  otpCache.set(requestId, {
    type: input.type,
    target,
    otp,
    expiresAt
  });

  return { requestId, otp, expiresAt };
};

export const verifyOtp = (input: { requestId: string; otp: string }) => {
  const record = otpCache.get(input.requestId);
  if (!record) {
    throw new Error("OTP request expired or not found");
  }

  if (Date.now() > record.expiresAt) {
    otpCache.delete(input.requestId);
    throw new Error("OTP request expired");
  }

  if (record.otp !== input.otp.trim()) {
    throw new Error("Invalid OTP");
  }

  otpCache.set(input.requestId, { ...record, verifiedAt: Date.now() });
  return { type: record.type, target: record.target, verifiedAt: Date.now() };
};

