import { Router } from "express";
import { z } from "zod";
import { listTracking, upsertTracking } from "../controllers/tracking.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const statusSchema = z
  .enum(["active", "inactive", "moving", "ACTIVE", "INACTIVE", "MOVING"])
  .transform((value) => value.toUpperCase());

const trackingSchema = z.object({
  customerId: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  status: statusSchema.optional(),
  address: z.string().optional()
});

router.get("/tracking", requireAuth, asyncHandler(listTracking));
router.post(
  "/tracking",
  requireAuth,
  requireRole("ADMIN", "EMPLOYEE", "AGENT"),
  validate({ body: trackingSchema }),
  asyncHandler(upsertTracking)
);

export default router;
