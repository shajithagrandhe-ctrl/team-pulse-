import { Router } from "express";
import { z } from "zod";
import { createLeadHandler, deleteLeadHandler, getLeads, updateLeadHandler } from "../controllers/leads.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const createLeadSchema = z.object({
  plotId: z.string().min(1),
  plotNumber: z.string().optional(),
  customerName: z.string().min(2),
  email: z.string().email(),
  contactNumber: z.string().min(6),
  location: z.string().min(2),
  uniqueId: z.string().min(3),
  pricePerSqYard: z.number().int().positive(),
  notes: z.string().optional(),
  photoUrl: z.string().url().optional(),
  agentId: z.string().optional()
});

const updateLeadSchema = z.object({
  notes: z.string().optional(),
  status: z.enum(["NEW", "FOLLOW_UP", "QUALIFIED", "WON", "LOST"]).optional(),
  pricePerSqYard: z.number().int().positive().optional(),
  contactNumber: z.string().optional(),
  location: z.string().optional(),
  uniqueId: z.string().optional()
});

router.get("/leads", requireAuth, asyncHandler(getLeads));
router.post("/leads", requireAuth, requireRole("ADMIN", "EMPLOYEE"), validate({ body: createLeadSchema }), asyncHandler(createLeadHandler));
router.put("/leads/:leadId", requireAuth, requireRole("ADMIN", "EMPLOYEE"), validate({ body: updateLeadSchema }), asyncHandler(updateLeadHandler));
router.delete("/leads/:leadId", requireAuth, requireRole("ADMIN", "EMPLOYEE"), asyncHandler(deleteLeadHandler));

export default router;
