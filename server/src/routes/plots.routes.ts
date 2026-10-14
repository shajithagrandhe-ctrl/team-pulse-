import { Router } from "express";
import { z } from "zod";
import { getPlot, getPlots, updatePlotHandler, updatePlotCoordsHandler, updatePlotCoordsBatchHandler } from "../controllers/plots.controller.js";
import { getLeadsByPlot } from "../controllers/leads.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const updatePlotSchema = z.object({
  status: z.enum(["AVAILABLE", "ADVANCE", "SOLD"]).optional(),
  area: z.number().int().positive().optional(),
  pricePerSqYard: z.number().int().positive().optional(),
  plotNumber: z.string().min(1).optional()
});

const normalizedUnit = z.number().min(0).max(1);
const polygonShapeSchema = z.object({
  type: z.literal("polygon"),
  points: z.array(z.object({ x: normalizedUnit, y: normalizedUnit })).min(3)
});

const plotCoordsSchema = z.object({
  x: normalizedUnit.optional(),
  y: normalizedUnit.optional(),
  width: normalizedUnit.optional(),
  height: normalizedUnit.optional(),
  shapeData: polygonShapeSchema.optional()
}).refine((value) => value.x != null || value.y != null || value.width != null || value.height != null || value.shapeData != null, {
  message: "At least one coordinate field or shapeData is required"
});

const plotCoordsBatchSchema = z.object({
  plots: z.array(
    z.object({
      id: z.string().min(1),
      x: normalizedUnit.optional(),
      y: normalizedUnit.optional(),
      width: normalizedUnit.optional(),
      height: normalizedUnit.optional(),
      shapeData: polygonShapeSchema.optional()
    }).refine((value) => value.x != null || value.y != null || value.width != null || value.height != null || value.shapeData != null, {
      message: "Each plot entry must include coordinates or shapeData"
    })
  )
});

router.get("/plots", requireAuth, asyncHandler(getPlots));
router.get("/plots/:id", requireAuth, asyncHandler(getPlot));
router.get("/plots/:plotId/leads", requireAuth, asyncHandler(getLeadsByPlot));
router.put("/plots/coords", requireAuth, requireRole("ADMIN"), validate({ body: plotCoordsBatchSchema }), asyncHandler(updatePlotCoordsBatchHandler));
router.put("/plots/:id", requireAuth, requireRole("ADMIN", "EMPLOYEE"), validate({ body: updatePlotSchema }), asyncHandler(updatePlotHandler));
router.put("/plots/:id/coords", requireAuth, requireRole("ADMIN"), validate({ body: plotCoordsSchema }), asyncHandler(updatePlotCoordsHandler));

export default router;
