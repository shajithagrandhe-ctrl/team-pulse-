import { Router } from "express";
import { getStats } from "../controllers/stats.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/stats", requireAuth, asyncHandler(getStats));

export default router;
