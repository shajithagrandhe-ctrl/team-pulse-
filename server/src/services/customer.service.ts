import { prisma } from "../config/prisma.js";
import { getPagination } from "../utils/pagination.js";
import { assertCustomerRecordAccess, customerRecordAccessWhere, customerRecordMatchesEmail } from "./access.service.js";

type CustomerStatus = "HOT_LEAD" | "FOLLOWING_UP" | "CONFIRMED_NOT_PAID" | "PAID_ADVANCE" | "BOOKED";

const deriveInterestedFromStatus = (status?: CustomerStatus) => {
  if (!status) return undefined;
  return status !== "FOLLOWING_UP";
};

export const listCustomerRecords = async (filters: {
  page?: number;
  pageSize?: number;
  requester?: { userId?: string; role?: string; email?: string; displayName?: string };
}) => {
  const { skip, take, page, pageSize } = getPagination(filters.page, filters.pageSize);
  const finalWhere = await customerRecordAccessWhere(filters.requester);

  // Legacy ownership lives in notes; filter exact email matches before pagination.
  if (filters.requester?.role === "CUSTOMER") {
    const candidates = await prisma.customerRecord.findMany({
      where: finalWhere, orderBy: [{ interested: "desc" }, { createdAt: "desc" }]
    });
    const records = candidates.filter((record) => customerRecordMatchesEmail(record.notes, filters.requester?.email));
    return {
      data: records.slice(skip, skip + take),
      pagination: { total: records.length, page, pageSize, pageCount: Math.ceil(records.length / pageSize) }
    };
  }

  const [total, records] = await Promise.all([
    prisma.customerRecord.count({ where: finalWhere }),
    prisma.customerRecord.findMany({
      where: finalWhere,
      skip,
      take,
      orderBy: [{ interested: "desc" }, { createdAt: "desc" }]
    })
  ]);

  return {
    data: records,
    pagination: {
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize)
    }
  };
};

export const createCustomerRecord = async (input: {
  contactName: string;
  contactNumber: string;
  location: string;
  budget: string;
  interested?: boolean;
  status?: CustomerStatus;
  recordOwner: string;
  leadName?: string;
  notes?: string;
}, requester?: { userId?: string; role?: string; email?: string; displayName?: string }) => {
  const ownerOverride =
    requester?.role === "EMPLOYEE"
      ? await prisma.user.findUnique({
          where: { id: requester.userId ?? "" },
          select: { fullName: true, displayName: true, email: true }
        })
      : null;

  const employeeOwner =
    ownerOverride?.fullName?.trim() ||
    ownerOverride?.displayName?.trim() ||
    ownerOverride?.email?.trim() ||
    requester?.displayName?.trim() ||
    requester?.email?.trim();

  const effectiveOwner = (employeeOwner || input.recordOwner || "Unknown").trim();
  const effectiveLeadName = (employeeOwner || input.leadName || input.recordOwner || "Unknown").trim();

  const interested = input.interested ?? deriveInterestedFromStatus(input.status) ?? false;

  return prisma.customerRecord.create({
    data: {
      contactName: input.contactName,
      contactNumber: input.contactNumber,
      location: input.location,
      budget: input.budget,
      interested,
      status: input.status ?? "FOLLOWING_UP",
      recordOwner: effectiveOwner,
      leadName: effectiveLeadName,
      notes: input.notes
    }
  });
};

export const updateCustomerRecord = async (id: string, update: {
  contactName: string;
  contactNumber: string;
  location: string;
  budget: string;
  interested?: boolean;
  status?: CustomerStatus;
  recordOwner: string;
  leadName?: string;
  notes?: string;
}, requester?: { userId?: string; role?: string; email?: string; displayName?: string }) => {
  await assertCustomerRecordAccess(id, requester);
  const ownerOverride =
    requester?.role === "EMPLOYEE"
      ? await prisma.user.findUnique({
          where: { id: requester.userId ?? "" },
          select: { fullName: true, displayName: true, email: true }
        })
      : null;

  const employeeOwner =
    ownerOverride?.fullName?.trim() ||
    ownerOverride?.displayName?.trim() ||
    ownerOverride?.email?.trim() ||
    requester?.displayName?.trim() ||
    requester?.email?.trim();

  const effectiveOwner = (employeeOwner || update.recordOwner || "Unknown").trim();
  const effectiveLeadName = (employeeOwner || update.leadName || update.recordOwner || "Unknown").trim();

  const interested = update.interested ?? deriveInterestedFromStatus(update.status);

  return prisma.customerRecord.update({
    where: { id },
    data: {
      contactName: update.contactName,
      contactNumber: update.contactNumber,
      location: update.location,
      budget: update.budget,
      ...(typeof interested === "boolean" ? { interested } : {}),
      ...(update.status ? { status: update.status } : {}),
      recordOwner: effectiveOwner,
      leadName: effectiveLeadName,
      notes: update.notes
    }
  });
};

export const deleteCustomerRecord = async (id: string, requester?: { userId?: string; role?: string; email?: string; displayName?: string }) => {
  await assertCustomerRecordAccess(id, requester);
  return prisma.customerRecord.delete({
    where: { id }
  });
};
