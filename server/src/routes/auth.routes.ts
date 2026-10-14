import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { changePassword, createCustomerAccount, getCsrfToken, login, nativeLogin, logout, me, register } from "../controllers/auth.controller.js";
import rateLimit from "express-rate-limit";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use((_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  adminCode: z.string().optional()
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
  fullName: z.string().min(2),
  role: z.enum(["EMPLOYEE"]),
  department: z.string().optional(),
  position: z.string().optional(),
  employeeId: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional()
});

router.get("/csrf", asyncHandler(getCsrfToken));
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Try again later." } });
router.post("/login", loginLimit, validate({ body: loginSchema }), asyncHandler(login));
router.post("/native/login", loginLimit, validate({ body: loginSchema }), asyncHandler(nativeLogin));
router.post("/register", requireAuth, requireRole("ADMIN"), validate({ body: registerSchema }), asyncHandler(register));
router.post("/logout", asyncHandler(logout));
router.get("/me", requireAuth, asyncHandler(me));

const customerProvisionSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
  fullName: z.string().min(2),
  phoneNumber: z.string().optional(),
  address: z.string().optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8)
});

router.post(
  "/customers",
  requireAuth,
  requireRole("ADMIN", "EMPLOYEE"),
  validate({ body: customerProvisionSchema }),
  asyncHandler(createCustomerAccount)
);
router.post("/change-password", requireAuth, validate({ body: changePasswordSchema }), asyncHandler(changePassword));

export default router;
