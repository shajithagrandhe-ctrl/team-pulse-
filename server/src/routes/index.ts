import { Router } from "express";
import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";
import locationsRoutes from "./locations.routes.js";
import venturesRoutes from "./ventures.routes.js";
import plotsRoutes from "./plots.routes.js";
import leadsRoutes from "./leads.routes.js";
import customersRoutes from "./customers.routes.js";
import statsRoutes from "./stats.routes.js";
import favoritesRoutes from "./favorites.routes.js";
import agentsRoutes from "./agents.routes.js";
import inquiriesRoutes from "./inquiries.routes.js";
import realtimeRoutes from "./realtime.routes.js";
import trackingRoutes from "./tracking.routes.js";
import employeeAccessRoutes from "./employeeAccess.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "OK" });
});

router.use("/auth", authRoutes);
router.use(usersRoutes);
router.use(locationsRoutes);
router.use(venturesRoutes);
router.use(plotsRoutes);
router.use(leadsRoutes);
router.use(customersRoutes);
router.use(statsRoutes);
router.use(favoritesRoutes);
router.use(agentsRoutes);
router.use(inquiriesRoutes);
router.use(realtimeRoutes);
router.use(trackingRoutes);
router.use(employeeAccessRoutes);

export default router;
