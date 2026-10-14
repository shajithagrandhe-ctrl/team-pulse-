import { Router } from "express";
import { listAdmins, listCustomers, listEmployees } from "../controllers/users.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/employees", requireAuth, requireRole("ADMIN", "EMPLOYEE"), asyncHandler(listEmployees));
router.get("/admins", requireAuth, requireRole("ADMIN"), asyncHandler(listAdmins));
router.get("/customers", requireAuth, requireRole("ADMIN", "EMPLOYEE"), asyncHandler(listCustomers));

export default router;
