import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { addFavorite, listFavorites, removeFavorite } from "../services/favorite.service.js";
import { publishEvent } from "../realtime/events.js";

export const getFavorites = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.sub as string;
  const favorites = await listFavorites(userId, { userId, role: req.user?.role, email: req.user?.email });

  return res.json({
    success: true,
    data: favorites,
    message: `Found ${favorites.length} favorites`
  });
};

export const createFavorite = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.sub as string;
  const { plotId } = req.body;
  const favorite = await addFavorite(userId, plotId, { userId, role: req.user?.role, email: req.user?.email });
  publishEvent("favorite.created", { favorite, userId, plotId });

  return res.status(201).json({
    success: true,
    data: favorite,
    message: "Favorite added"
  });
};

export const deleteFavorite = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.sub as string;
  const plotId = req.params.plotId;
  const favorite = await removeFavorite(userId, plotId);
  publishEvent("favorite.deleted", { favoriteId: favorite.id, userId, plotId });

  return res.json({
    success: true,
    message: "Favorite removed"
  });
};
