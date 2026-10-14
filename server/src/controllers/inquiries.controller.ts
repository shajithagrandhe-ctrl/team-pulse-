import type { Request, Response } from "express";
import { createInquiry } from "../services/inquiry.service.js";
import { publishEvent } from "../realtime/events.js";

export const createInquiryHandler = async (req: Request, res: Response) => {
  const inquiry = await createInquiry(req.body);
  publishEvent("inquiry.created", { inquiry });

  return res.status(201).json({
    success: true,
    data: inquiry,
    message: "Inquiry created"
  });
};
