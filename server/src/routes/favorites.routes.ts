import { Router } from "express";
import { z } from "zod";
import { createFavorite, deleteFavorite, getFavorites } from "../controllers/favorites.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const favoriteSchema = z.object({
  plotId: z.string().min(1)
});

router.get("/favorites", requireAuth, asyncHandler(getFavorites));
router.post("/favorites", requireAuth, validate({ body: favoriteSchema }), asyncHandler(createFavorite));
router.delete("/favorites/:plotId", requireAuth, asyncHandler(deleteFavorite));

export default router;
