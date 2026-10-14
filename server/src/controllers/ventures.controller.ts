import type { Request, Response } from "express";
import { createVentureWithPlots, getVentureById, listVentures, updateVentureLayout, updateVenturePhoto, updateVentureRegions } from "../services/venture.service.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

export const getVentures = async (req: AuthenticatedRequest, res: Response) => {
  const locationId = req.query.locationId as string | undefined;
  const ventures = await listVentures(locationId, { userId: req.user?.sub, role: req.user?.role, email: req.user?.email });
  return res.json({
    success: true,
    data: ventures,
    message: `Found ${ventures.length} ventures`
  });
};

export const getVenture = async (req: AuthenticatedRequest, res: Response) => {
  const venture = await getVentureById(req.params.id, { userId: req.user?.sub, role: req.user?.role, email: req.user?.email });
  if (!venture) {
    return res.status(404).json({
      success: false,
      message: "Venture not found"
    });
  }

  return res.json({
    success: true,
    data: venture,
    message: "Venture details"
  });
};

export const uploadVentureLayout = async (req: Request, res: Response) => {
  const ventureId = req.params.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: "Layout file is required"
    });
  }

  const layoutImage = `/uploads/ventures/${ventureId}/${file.filename}`;
  const updated = await updateVentureLayout(ventureId, layoutImage);

  return res.json({
    success: true,
    data: updated,
    message: "Layout uploaded"
  });
};

export const uploadVenturePhoto = async (req: Request, res: Response) => {
  const ventureId = req.params.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: "Photo file is required"
    });
  }

  const photoUrl = `/uploads/ventures/${ventureId}/${file.filename}`;
  const updated = await updateVenturePhoto(ventureId, photoUrl);

  return res.json({
    success: true,
    data: updated,
    message: "Venture photo uploaded"
  });
};

export const updateRegions = async (req: Request, res: Response) => {
  const ventureId = req.params.id;
  const regions = req.body.regions;
  const updated = await updateVentureRegions(ventureId, regions);

  return res.json({
    success: true,
    data: updated,
    message: "Layout regions updated"
  });
};

export const createVenture = async (req: Request, res: Response) => {
  const venture = await createVentureWithPlots(req.body);
  return res.status(201).json({
    success: true,
    data: venture,
    message: "Venture created"
  });
};
