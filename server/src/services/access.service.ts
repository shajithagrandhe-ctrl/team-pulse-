import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { getEmployeeAssignment } from "./employeeAssignment.service.js";
import { HttpError } from "../utils/httpError.js";

export type Requester = { userId?: string; role?: string; email?: string; displayName?: string };

export const plotAccessWhere = async (requester?: Requester): Promise<Prisma.PlotWhereInput> => {
  if (requester?.role === "ADMIN" || requester?.role === "AGENT") return {};
  if (requester?.role === "CUSTOMER") {
    return requester.email ? { leads: { some: { email: requester.email } } } : { id: { in: [] } };
  }
  if (requester?.role !== "EMPLOYEE" || !requester.userId) return { id: { in: [] } };

  const profile = await prisma.employeeProfile.findUnique({
    where: { userId: requester.userId }, select: { status: true, dateOfRelieving: true }
  });
  if (profile?.status === "FROZEN" || (profile?.dateOfRelieving && profile.dateOfRelieving <= new Date())) {
    return { id: { in: [] } };
  }
  const assignment = await getEmployeeAssignment(requester.userId);
  return { OR: [
    { ventureId: { in: assignment.assignedVentureIds } },
    { venture: { locationId: { in: assignment.assignedLocationIds } } }
  ] };
};

export const assertPlotAccess = async (id: string, requester?: Requester) => {
  const plot = await prisma.plot.findFirst({
    where: { AND: [{ id }, await plotAccessWhere(requester)] }, select: { id: true }
  });
  if (!plot) throw new HttpError(404, "Plot not found");
};

export const leadAccessWhere = async (requester?: Requester): Promise<Prisma.LeadWhereInput> => {
  if (requester?.role === "ADMIN") return {};
  if (requester?.role === "CUSTOMER") {
    return requester.email ? { email: requester.email } : { id: { in: [] } };
  }
  if (requester?.role === "AGENT") {
    return requester.userId ? { agentId: requester.userId } : { id: { in: [] } };
  }
  return { plot: await plotAccessWhere(requester) };
};

export const assertLeadAccess = async (id: string, requester?: Requester) => {
  const lead = await prisma.lead.findFirst({
    where: { AND: [{ id }, await leadAccessWhere(requester)] }, select: { id: true }
  });
  if (!lead) throw new HttpError(404, "Lead not found");
};

export const customerRecordAccessWhere = async (requester?: Requester): Promise<Prisma.CustomerRecordWhereInput> => {
  if (requester?.role === "ADMIN") return {};
  if (requester?.role === "CUSTOMER") {
    return requester.email ? { notes: { contains: requester.email } } : { id: { in: [] } };
  }
  if (!["EMPLOYEE", "AGENT"].includes(requester?.role ?? "") || !requester?.userId) {
    return { id: { in: [] } };
  }
  const user = await prisma.user.findUnique({
    where: { id: requester.userId },
    select: { fullName: true, displayName: true, email: true, employeeId: true }
  });
  if (!user) return { id: { in: [] } };
  const aliases = Array.from(new Set(
    [user.fullName, user.displayName, user.email, user.employeeId]
      .map((value) => value?.trim()).filter((value): value is string => Boolean(value))
  ));
  return { OR: [{ leadName: { in: aliases } }, { recordOwner: { in: aliases } }] };
};

export const customerRecordMatchesEmail = (notes: string | null | undefined, email: string | undefined) => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (notes ?? "").split(/[\s<>(),;]+/).some((token) =>
    token.replace(/^email:/i, "").toLowerCase() === normalized
  );
};

export const assertCustomerRecordAccess = async (id: string, requester?: Requester) => {
  const record = await prisma.customerRecord.findFirst({
    where: { AND: [{ id }, await customerRecordAccessWhere(requester)] }
  });
  if (!record || (requester?.role === "CUSTOMER" && !customerRecordMatchesEmail(record.notes, requester.email))) {
    throw new HttpError(404, "Customer record not found");
  }
  return record;
};
