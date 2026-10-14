import type { Response } from "express";
import type { PlotStatus } from "@prisma/client";
import { getPlotById, listPlots, updatePlot, updatePlotCoords, updatePlotCoordsBatch } from "../services/plot.service.js";
import { publishEvent } from "../realtime/events.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

export const getPlots = async (req: AuthenticatedRequest, res: Response) => {
  const ventureId = req.query.ventureId as string | undefined;
  const status = req.query.status as PlotStatus | undefined;
  const page = req.query.page ? Number(req.query.page) : undefined;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;

  const result = await listPlots({
    ventureId,
    status,
    page,
    pageSize,
    requester: { userId: req.user?.sub, role: req.user?.role, email: req.user?.email }
  });

  return res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    message: "Plots fetched"
  });
};

export const getPlot = async (req: AuthenticatedRequest, res: Response) => {
  const plot = await getPlotById(req.params.id, { userId: req.user?.sub, role: req.user?.role, email: req.user?.email });
  if (!plot) {
    return res.status(404).json({
      success: false,
      message: "Plot not found"
    });
  }

  return res.json({
    success: true,
    data: plot,
    message: "Plot details"
  });
};

export const updatePlotHandler = async (req: AuthenticatedRequest, res: Response) => {
  const plot = await updatePlot(req.params.id, req.body, { userId: req.user?.sub, role: req.user?.role, email: req.user?.email });
  publishEvent("plot.updated", { plot });

  return res.json({
    success: true,
    data: plot,
    message: "Plot updated"
  });
};

export const updatePlotCoordsHandler = async (req: AuthenticatedRequest, res: Response) => {
  const plot = await updatePlotCoords(req.params.id, req.body);
  publishEvent("plot.updated", { plotId: plot.id });

  return res.json({
    success: true,
    data: plot,
    message: "Plot coordinates updated"
  });
};

export const updatePlotCoordsBatchHandler = async (req: AuthenticatedRequest, res: Response) => {
  const plots = await updatePlotCoordsBatch(req.body.plots);
  plots.forEach((plot) => publishEvent("plot.updated", { plotId: plot.id }));

  return res.json({
    success: true,
    data: plots,
    message: "Plot coordinates updated"
  });
};
