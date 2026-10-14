import type { Response } from "express";
import { getDashboardStats } from "../services/stats.service.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

export const getStats = async (req: AuthenticatedRequest, res: Response) => {
  const stats = await getDashboardStats({ userId: req.user?.sub, role: req.user?.role, email: req.user?.email });

  return res.json({
    success: true,
    data: stats,
    message: "Stats fetched"
  });
};
