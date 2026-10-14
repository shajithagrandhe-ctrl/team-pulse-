import { prisma } from "../config/prisma.js";
import { getEmployeeAssignment } from "./employeeAssignment.service.js";
import { plotAccessWhere, leadAccessWhere, customerRecordAccessWhere, customerRecordMatchesEmail, type Requester } from "./access.service.js";

export const getDashboardStats = async (requester?: Requester) => {
  if (requester?.role === "CUSTOMER" || requester?.role === "AGENT") {
    const plotScope = await plotAccessWhere(requester);
    const recordScope = await customerRecordAccessWhere(requester);
    const [plots, leads, available, advance, sold, customers] = await Promise.all([
      prisma.plot.count({ where: plotScope }),
      prisma.lead.count({ where: await leadAccessWhere(requester) }),
      prisma.plot.count({ where: { AND: [plotScope, { status: "AVAILABLE" }] } }),
      prisma.plot.count({ where: { AND: [plotScope, { status: "ADVANCE" }] } }),
      prisma.plot.count({ where: { AND: [plotScope, { status: "SOLD" }] } }),
      requester.role === "CUSTOMER"
        ? prisma.customerRecord.findMany({ where: recordScope, select: { notes: true } })
          .then(records => records.filter(record => customerRecordMatchesEmail(record.notes, requester.email)).length)
        : prisma.customerRecord.count({ where: recordScope })
    ]);
    return { locations: 0, plots, employees: 0, customers, leads, plotsByStatus: { available, advance, sold } };
  }
  if (requester?.role !== "ADMIN" && requester?.role !== "EMPLOYEE") {
    return { locations: 0, plots: 0, employees: 0, customers: 0, leads: 0, plotsByStatus: { available: 0, advance: 0, sold: 0 } };
  }
  if (requester?.role === "EMPLOYEE" && requester.userId) {
    const me = await prisma.user.findUnique({
      where: { id: requester.userId },
      select: { fullName: true, displayName: true, email: true, employeeId: true }
    });
    const profile = await prisma.employeeProfile.findUnique({
      where: { userId: requester.userId },
      select: { status: true }
    });
    if (profile?.status === "FROZEN") {
      return {
        locations: 0,
        plots: 0,
        employees: 0,
        customers: 0,
        leads: 0,
        plotsByStatus: { available: 0, advance: 0, sold: 0 }
      };
    }

    const assignment = await getEmployeeAssignment(requester.userId);
    if (!assignment.assignedLocationIds.length && !assignment.assignedVentureIds.length) {
      return {
        locations: 0,
        plots: 0,
        employees: 0,
        customers: 0,
        leads: 0,
        plotsByStatus: { available: 0, advance: 0, sold: 0 }
      };
    }

    const venturesFromLocations = assignment.assignedLocationIds.length
      ? await prisma.venture.findMany({
          where: { locationId: { in: assignment.assignedLocationIds } },
          select: { id: true, locationId: true }
        })
      : [];
    const ventureIds = Array.from(new Set([...assignment.assignedVentureIds, ...venturesFromLocations.map((v) => v.id)]));
    const locationIds = Array.from(new Set([...assignment.assignedLocationIds, ...venturesFromLocations.map((v) => v.locationId)]));
    if (!ventureIds.length) {
      return {
        locations: locationIds.length,
        plots: 0,
        employees: 0,
        customers: 0,
        leads: 0,
        plotsByStatus: { available: 0, advance: 0, sold: 0 }
      };
    }

    const ownerAliases = Array.from(
      new Set(
        [me?.fullName, me?.displayName, me?.email, me?.employeeId]
          .map((value) => value?.trim())
          .filter((value): value is string => Boolean(value))
      )
    );

    const [plots, customers, leads, available, advance, sold] = await Promise.all([
      prisma.plot.count({ where: { ventureId: { in: ventureIds } } }),
      ownerAliases.length
        ? prisma.customerRecord.count({
            where: {
              OR: [{ leadName: { in: ownerAliases } }, { recordOwner: { in: ownerAliases } }]
            }
          })
        : Promise.resolve(0),
      prisma.lead.count({ where: { plot: { ventureId: { in: ventureIds } } } }),
      prisma.plot.count({ where: { ventureId: { in: ventureIds }, status: "AVAILABLE" } }),
      prisma.plot.count({ where: { ventureId: { in: ventureIds }, status: "ADVANCE" } }),
      prisma.plot.count({ where: { ventureId: { in: ventureIds }, status: "SOLD" } })
    ]);

    return {
      locations: locationIds.length,
      plots,
      employees: 0,
      customers,
      leads,
      plotsByStatus: { available, advance, sold }
    };
  }

  const [locations, plots, employees, customers, leads, available, advance, sold] = await Promise.all([
    prisma.location.count(),
    prisma.plot.count(),
    prisma.user.count({ where: { role: "EMPLOYEE" } }),
    prisma.customerRecord.count(),
    prisma.lead.count(),
    prisma.plot.count({ where: { status: "AVAILABLE" } }),
    prisma.plot.count({ where: { status: "ADVANCE" } }),
    prisma.plot.count({ where: { status: "SOLD" } })
  ]);

  return {
    locations,
    plots,
    employees,
    customers,
    leads,
    plotsByStatus: {
      available,
      advance,
      sold
    }
  };
};
