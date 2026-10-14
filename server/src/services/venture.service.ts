import { prisma } from "../config/prisma.js";
import { getEmployeeAssignment } from "./employeeAssignment.service.js";
import { leadAccessWhere } from "./access.service.js";

export const listVentures = async (locationId?: string, requester?: { userId?: string; role?: string; email?: string }) => {
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
    return prisma.venture.findMany({
      where: {
        ...(locationId ? { locationId } : {}),
        plots: { some: { leads: { some: { email } } } }
      },
      orderBy: { name: "asc" },
      include: {
        location: true,
        plots: {
          where: { leads: { some: { email } } },
          include: {
            leads: {
              where: { email }
            }
          }
        }
      }
    });
  }

  const where: any = {
    ...(locationId ? { locationId } : {})
  };
  if (requester?.role === "EMPLOYEE") {
    where.OR = [];
    if (assignedLocationIds.length) where.OR.push({ locationId: { in: assignedLocationIds } });
    if (assignedVentureIds.length) where.OR.push({ id: { in: assignedVentureIds } });
  }

  return prisma.venture.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      location: true,
      plots: true
    }
  });
};

export const getVentureById = async (id: string, requester?: { userId?: string; role?: string; email?: string }) => {
  if (requester?.role === "EMPLOYEE" && requester.userId) {
    const profile = await prisma.employeeProfile.findUnique({ where: { userId: requester.userId }, select: { status: true } });
    if (profile?.status === "FROZEN") return null;
    const assignment = await getEmployeeAssignment(requester.userId);

    const venture = await prisma.venture.findUnique({
      where: { id },
      select: { id: true, locationId: true }
    });
    if (!venture) return null;

    const canAccess =
      assignment.assignedVentureIds.includes(id) || assignment.assignedLocationIds.includes(venture.locationId);
    if (!canAccess) return null;
  }
  if (requester?.role === "CUSTOMER") {
    const email = requester.email;
    if (!email) return null;
    return prisma.venture.findFirst({
      where: {
        id,
        plots: { some: { leads: { some: { email } } } }
      },
      include: {
        location: true,
        plots: {
          where: { leads: { some: { email } } },
          include: { leads: { where: { email } } }
        }
      }
    });
  }

  return prisma.venture.findUnique({
    where: { id },
    include: {
      location: true,
      plots: {
        include: { leads: { where: await leadAccessWhere(requester) } }
      }
    }
  });
};

export const updateVentureLayout = async (id: string, layoutImage: string) => {
  return prisma.venture.update({
    where: { id },
    data: { layoutImage }
  });
};

export const updateVentureRegions = async (id: string, layoutRegions: any) => {
  return prisma.venture.update({
    where: { id },
    data: { layoutRegions }
  });
};

export const updateVenturePhoto = async (id: string, photoUrl: string) => {
  return prisma.venture.update({
    where: { id },
    data: { layoutImage: photoUrl }
  });
};

export const createVentureWithPlots = async (input: {
  name: string;
  locationName: string;
  plotCount: number;
  plotNumberPrefix?: string;
  startingPlotNumber?: number;
  defaultArea: number;
  defaultPricePerSqYard: number;
}) => {
  const prefix = input.plotNumberPrefix ?? "Plot ";
  const start = input.startingPlotNumber ?? 1;
  const normalizedLocationName = input.locationName.trim();
  const location = await prisma.location.upsert({
    where: { name: normalizedLocationName },
    update: {},
    create: { name: normalizedLocationName }
  });

  return prisma.venture.create({
    data: {
      name: input.name,
      locationId: location.id,
      plots: {
        create: Array.from({ length: input.plotCount }).map((_, index) => ({
          plotNumber: `${prefix}${start + index}`,
          status: "AVAILABLE",
          area: input.defaultArea,
          pricePerSqYard: input.defaultPricePerSqYard
        }))
      }
    },
    include: {
      location: true,
      plots: true
    }
  });
};
