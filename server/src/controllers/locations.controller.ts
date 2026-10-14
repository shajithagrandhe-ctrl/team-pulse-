import type { Request, Response } from "express";
import { getLocationById, listLocations } from "../services/location.service.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

export const getLocations = async (req: AuthenticatedRequest, res: Response) => {
  const locations = await listLocations({ userId: req.user?.sub, role: req.user?.role, email: req.user?.email });
  return res.json({
    success: true,
    data: locations,
    message: `Found ${locations.length} locations`
  });
};

export const getLocation = async (req: AuthenticatedRequest, res: Response) => {
  const location = await getLocationById(req.params.id, { userId: req.user?.sub, role: req.user?.role, email: req.user?.email });
  if (!location) {
    return res.status(404).json({
      success: false,
      message: "Location not found"
    });
  }

  return res.json({
    success: true,
    data: location,
    message: "Location details"
  });
};
