import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createEmployeeAccount,
  listEmployeeAccounts,
  requestEmployeeOtp,
  setEmployeeStatus,
  updateEmployeeAccount,
  verifyEmployeeOtp
} from "../controllers/employeeAccess.controller.js";

const router = Router();

const employeeBaseSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  displayName: z.string().min(2).optional(),
  fullName: z.string().min(2).optional(),
  employeeId: z.string().trim().min(1).optional().nullable(),
  phoneNumber: z.string().trim().min(6).optional().nullable(),
  department: z.string().trim().min(1).optional().nullable(),
  position: z.string().trim().min(1).optional().nullable(),
  address: z.string().trim().optional().nullable(),

  firstName: z.string().trim().min(1).optional().nullable(),
  lastName: z.string().trim().min(1).optional().nullable(),
  emailVerified: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
  dateOfBirth: z.string().optional().nullable(),

  yearsOfExperience: z.number().int().min(0).max(80).optional().nullable(),
  currentCompany: z.string().trim().optional().nullable(),
  previousCompanies: z.array(z.string().trim()).optional().nullable(),
  currentPosition: z.string().trim().optional().nullable(),
  roleGiven: z.string().trim().optional().nullable(),
  assignedLocationIds: z.array(z.string().trim().min(1)).optional().nullable(),
  assignedVentureIds: z.array(z.string().trim().min(1)).optional().nullable(),
  dateOfJoining: z.string().optional().nullable(),
  dateOfRelieving: z.string().optional().nullable(),
  achievements: z.array(z.string().trim()).optional().nullable(),
  status: z.enum(["ACTIVE", "FROZEN"]).optional()
});

const createEmployeeSchema = employeeBaseSchema.extend({
  password: z.string().min(6)
});

const updateEmployeeSchema = employeeBaseSchema.partial();

const paramsSchema = z.object({
  id: z.string().min(1)
});

const otpRequestSchema = z.object({
  type: z.enum(["email", "phone"]),
  target: z.string().trim().min(3)
});

const otpVerifySchema = z.object({
  requestId: z.string().uuid(),
  otp: z.string().trim().min(4).max(10)
});

const statusSchema = z.object({
  status: z.enum(["ACTIVE", "FROZEN"])
});

router.get("/employee-access/employees", requireAuth, requireRole("ADMIN"), asyncHandler(listEmployeeAccounts));

router.post(
  "/employee-access/employees",
  requireAuth,
  requireRole("ADMIN"),
  validate({ body: createEmployeeSchema }),
  asyncHandler(createEmployeeAccount)
);

router.put(
  "/employee-access/employees/:id",
  requireAuth,
  requireRole("ADMIN"),
  validate({ params: paramsSchema, body: updateEmployeeSchema }),
  asyncHandler(updateEmployeeAccount)
);

router.post(
  "/employee-access/employees/:id/status",
  requireAuth,
  requireRole("ADMIN"),
  validate({ params: paramsSchema, body: statusSchema }),
  asyncHandler(setEmployeeStatus)
);

router.post(
  "/employee-access/otp/request",
  requireAuth,
  requireRole("ADMIN"),
  validate({ body: otpRequestSchema }),
  asyncHandler(requestEmployeeOtp)
);

router.post(
  "/employee-access/otp/verify",
  requireAuth,
  requireRole("ADMIN"),
  validate({ body: otpVerifySchema }),
  asyncHandler(verifyEmployeeOtp)
);

export default router;
