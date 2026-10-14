import { prisma } from "../config/prisma.js";
import { assertPlotAccess, plotAccessWhere, type Requester } from "./access.service.js";

export const listFavorites = async (userId: string, requester?: Requester) => {
  return prisma.favorite.findMany({
    where: { userId, plot: await plotAccessWhere(requester) },
    include: {
      plot: {
        include: {
          venture: { include: { location: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
};

export const addFavorite = async (userId: string, plotId: string, requester?: Requester) => {
  await assertPlotAccess(plotId, requester);
  return prisma.favorite.create({
    data: {
      userId,
      plotId
    }
  });
};

export const removeFavorite = async (userId: string, plotId: string) => {
  return prisma.favorite.delete({
    where: {
      userId_plotId: {
        userId,
        plotId
      }
    }
  });
};
