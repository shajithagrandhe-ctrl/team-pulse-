import { Router } from "express";
import { z } from "zod";
import { createCustomerRecordHandler, deleteCustomerRecordHandler, getCustomerRecords, updateCustomerRecordHandler } from "../controllers/customers.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const customerStatusSchema = z.enum([
  "HOT_LEAD",
  "FOLLOWING_UP",
  "CONFIRMED_NOT_PAID",
  "PAID_ADVANCE",
  "BOOKED"
]);

const customerRecordSchema = z.object({
  contactName: z.string().min(2),
  contactNumber: z.string().min(6),
  location: z.string().min(2),
  budget: z.string().min(1),
  interested: z.boolean().optional(),
  status: customerStatusSchema.optional(),
  recordOwner: z.string().min(2),
  leadName: z.string().min(2).optional(),
  notes: z.string().optional()
});

router.get("/total-data", requireAuth, asyncHandler(getCustomerRecords));
router.post("/total-data", requireAuth, requireRole("ADMIN", "EMPLOYEE"), validate({ body: customerRecordSchema }), asyncHandler(createCustomerRecordHandler));
router.put("/total-data/:id", requireAuth, requireRole("ADMIN", "EMPLOYEE"), validate({ body: customerRecordSchema }), asyncHandler(updateCustomerRecordHandler));
router.delete("/total-data/:id", requireAuth, requireRole("ADMIN", "EMPLOYEE"), asyncHandler(deleteCustomerRecordHandler));

export default router;
