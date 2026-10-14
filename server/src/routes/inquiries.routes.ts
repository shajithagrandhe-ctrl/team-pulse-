import { Router } from "express";
import { z } from "zod";
import { createInquiryHandler } from "../controllers/inquiries.controller.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const inquirySchema = z.object({
  plotId: z.string().optional(),
  agentId: z.string().optional(),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  message: z.string().min(10)
});

router.post("/inquiries", validate({ body: inquirySchema }), asyncHandler(createInquiryHandler));

export default router;
