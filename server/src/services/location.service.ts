import { prisma } from "../config/prisma.js";
import { getEmployeeAssignment } from "./employeeAssignment.service.js";

export const listLocations = async (requester?: { userId?: string; role?: string; email?: string }) => {
  let assignedLocationIds: string[] = [];
  let assignedVentureIds: string[] = [];
  if (requester?.role === "EMPLOYEE" && requester.userId) {
    const profile = await prisma.employeeProfile.findUnique({ where: { userId: requester.userId }, select: { status: true } });
    if (profile?.status === "FROZEN") return [];
    const assignment = await getEmployeeAssignment(requester.userId);
    assignedLocationIds = assignment.assignedLocationIds;
    assignedVentureIds = assignment.assignedVentureIds;
    if (!assignedLocationIds.length && !assignedVentureIds.length) return [];
  }
  if (requester?.role === "CUSTOMER") {
    const email = requester.email;
    if (!email) return [];

    const locations = await prisma.location.findMany({
      where: {
        ventures: {
          some: {
            plots: {
              some: {
                leads: { some: { email } }
              }
            }
          }
        }
      },
      orderBy: { name: "asc" },
      include: {
        ventures: {
          where: {
            plots: {
              some: {
                leads: { some: { email } }
              }
            }
          }
        }
      }
    });

    const grouped = await prisma.plot.groupBy({
      by: ["ventureId", "status"],
      where: { leads: { some: { email } } },
      _count: { _all: true }
    });

    const statsByVenture = new Map<string, { total: number; available: number; sold: number }>();
    grouped.forEach((group) => {
      const current = statsByVenture.get(group.ventureId) ?? { total: 0, available: 0, sold: 0 };
      const count = group._count._all;
      current.total += count;
      if (group.status === "AVAILABLE") current.available += count;
      if (group.status === "SOLD") current.sold += count;
      statsByVenture.set(group.ventureId, current);
    });

    return locations.map((location) => ({
      id: location.id,
      name: location.name,
      availablePlots: location.ventures.reduce((sum, venture) => sum + (statsByVenture.get(venture.id)?.available ?? 0), 0),
      ventures: location.ventures.map((venture) => ({
        id: venture.id,
        name: venture.name,
        photoUrl: venture.layoutImage,
        plotCount: statsByVenture.get(venture.id)?.total ?? 0,
        availablePlots: statsByVenture.get(venture.id)?.available ?? 0,
        soldPlots: statsByVenture.get(venture.id)?.sold ?? 0
      }))
    }));
  }

  const locationWhere =
    requester?.role === "EMPLOYEE"
      ? {
          OR: [
            assignedLocationIds.length ? { id: { in: assignedLocationIds } } : undefined,
            assignedVentureIds.length ? { ventures: { some: { id: { in: assignedVentureIds } } } } : undefined
          ].filter(Boolean)
        }
      : undefined;

  const locations = await prisma.location.findMany({
    where: locationWhere as any,
    orderBy: { name: "asc" },
    include: {
      ventures:
        requester?.role === "EMPLOYEE" && assignedVentureIds.length
          ? { where: { id: { in: assignedVentureIds } } }
          : true
    }
  });

  const grouped = await prisma.plot.groupBy({
    by: ["ventureId", "status"],
    _count: { _all: true }
  });

  const statsByVenture = new Map<string, { total: number; available: number; sold: number }>();
  grouped.forEach((group) => {
    const current = statsByVenture.get(group.ventureId) ?? { total: 0, available: 0, sold: 0 };
    const count = group._count._all;
    current.total += count;
    if (group.status === "AVAILABLE") current.available += count;
    if (group.status === "SOLD") current.sold += count;
    statsByVenture.set(group.ventureId, current);
  });

  return locations.map((location) => ({
    id: location.id,
    name: location.name,
    availablePlots: location.ventures.reduce((sum, venture) => sum + (statsByVenture.get(venture.id)?.available ?? 0), 0),
    ventures: location.ventures.map((venture) => ({
      id: venture.id,
      name: venture.name,
      photoUrl: venture.layoutImage,
      plotCount: statsByVenture.get(venture.id)?.total ?? 0,
      availablePlots: statsByVenture.get(venture.id)?.available ?? 0,
      soldPlots: statsByVenture.get(venture.id)?.sold ?? 0
    }))
  }));
};

export const getLocationById = async (id: string, requester?: { userId?: string; role?: string; email?: string }) => {
  let assignedLocationIds: string[] = [];
  let assignedVentureIds: string[] = [];
  if (requester?.role === "EMPLOYEE" && requester.userId) {
    const profile = await prisma.employeeProfile.findUnique({ where: { userId: requester.userId }, select: { status: true } });
    if (profile?.status === "FROZEN") return null;
    const assignment = await getEmployeeAssignment(requester.userId);
    assignedLocationIds = assignment.assignedLocationIds;
    assignedVentureIds = assignment.assignedVentureIds;

    const canAccessByLocation = assignedLocationIds.includes(id);
    const canAccessByVenture = await prisma.venture.count({
      where: { id: { in: assignedVentureIds }, locationId: id }
    });
    if (!canAccessByLocation && canAccessByVenture === 0) return null;
  }
  if (requester?.role === "CUSTOMER") {
    const email = requester.email;
    if (!email) return null;

    return prisma.location.findFirst({
      where: {
        id,
        ventures: {
          some: {
            plots: {
              some: {
                leads: { some: { email } }
              }
            }
          }
        }
      },
      include: {
        ventures: {
          where: {
            plots: {
              some: {
                leads: { some: { email } }
              }
            }
          },
          include: {
            plots: {
              where: { leads: { some: { email } } },
              include: { leads: { where: { email } } }
            }
          }
        }
      }
    });
  }

  return prisma.location.findUnique({
    where: { id },
    include: {
      ventures: {
        where: requester?.role === "EMPLOYEE" && assignedVentureIds.length ? { id: { in: assignedVentureIds } } : undefined,
        include: {
          plots: true
        }
      }
    }
  });
};
