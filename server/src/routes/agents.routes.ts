import { Router } from "express";
import { getAgent, getAgents } from "../controllers/agents.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/agents", requireAuth, asyncHandler(getAgents));
router.get("/agents/:id", requireAuth, asyncHandler(getAgent));

export default router;
