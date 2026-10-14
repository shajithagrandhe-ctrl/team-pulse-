import type { PlotStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { getPagination } from "../utils/pagination.js";
import { HttpError } from "../utils/httpError.js";
import { assertPlotAccess, plotAccessWhere, leadAccessWhere, type Requester } from "./access.service.js";

export const listPlots = async (filters: {
  ventureId?: string;
  status?: PlotStatus;
  page?: number;
  pageSize?: number;
  requester?: Requester;
}) => {
  const { skip, take, page, pageSize } = getPagination(filters.page, filters.pageSize);

  const where: any = {
    ventureId: filters.ventureId,
    status: filters.status
  };
  where.AND = [await plotAccessWhere(filters.requester)];

  const [total, plots] = await Promise.all([
    prisma.plot.count({ where }),
    prisma.plot.findMany({
      where,
      skip,
      take,
      orderBy: { plotNumber: "asc" },
      include: {
        venture: {
          include: { location: true }
        }
      }
    })
  ]);

  return {
    data: plots,
    pagination: {
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize)
    }
  };
};

export const getPlotById = async (id: string, requester?: Requester) => {
  return prisma.plot.findFirst({
    where: {
      id,
      AND: [await plotAccessWhere(requester)]
    },
    include: {
      venture: {
        include: { location: true }
      },
      leads: { where: await leadAccessWhere(requester) }
    }
  });
};

export const updatePlot = async (id: string, update: {
  status?: PlotStatus;
  area?: number;
  pricePerSqYard?: number;
  plotNumber?: string;
}, requester?: Requester) => {
  await assertPlotAccess(id, requester);
  return prisma.plot.update({
    where: { id },
    data: {
      status: update.status,
      area: update.area,
      pricePerSqYard: update.pricePerSqYard,
      plotNumber: update.plotNumber
    },
    include: {
      venture: {
        include: { location: true }
      },
      leads: true
    }
  });
};

export const updatePlotCoords = async (id: string, update: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  shapeData?: any;
}) => {
  return prisma.plot.update({
    where: { id },
    data: {
      x: update.x,
      y: update.y,
      width: update.width,
      height: update.height,
      shapeData: update.shapeData ? update.shapeData : undefined
    }
  });
};

export const updatePlotCoordsBatch = async (plots: Array<{ id: string; x?: number; y?: number; width?: number; height?: number; shapeData?: any }>) => {
  const ids = plots.map((p) => p.id).filter(Boolean);
  const uniqueIds = Array.from(new Set(ids));

  const existing = await prisma.plot.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true }
  });
  const existingSet = new Set(existing.map((p) => p.id));
  const missing = uniqueIds.filter((id) => !existingSet.has(id));
  if (missing.length) {
    const preview = missing.slice(0, 5).join(", ");
    throw new HttpError(
      404,
      `Some plots no longer exist (missing ${missing.length}). Refresh the page and try again. Missing: ${preview}`,
      { missingIds: missing }
    );
  }

  const chunkSize = 50;
  const chunks: Array<typeof plots> = [];
  for (let i = 0; i < plots.length; i += chunkSize) {
    chunks.push(plots.slice(i, i + chunkSize));
  }

  const results = await Promise.all(
    chunks.map((chunk) =>
      prisma.$transaction(
        chunk.map((plot) =>
          prisma.plot.update({
            where: { id: plot.id },
            data: {
              x: plot.x,
              y: plot.y,
              width: plot.width,
              height: plot.height,
              shapeData: plot.shapeData ? plot.shapeData : undefined
            }
          })
        )
      )
    )
  );

  return results.flat();
};
