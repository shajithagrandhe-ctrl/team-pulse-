import { prisma } from "../config/prisma.js";
import type { TrackingStatus } from "@prisma/client";
import { assertCustomerRecordAccess, customerRecordAccessWhere, customerRecordMatchesEmail, type Requester } from "./access.service.js";

export interface TrackingUpdateInput {
  customerId: string;
  latitude: number;
  longitude: number;
  status?: TrackingStatus;
  address?: string;
  updatedBy?: string;
}

export const listTrackingUpdates = async (requester?: Requester) => {
  const updates = await prisma.trackingUpdate.findMany({
    where: { customer: await customerRecordAccessWhere(requester) },
    orderBy: { updatedAt: "desc" },
    include: { customer: { select: { notes: true } } }
  });
  return updates.filter((update) => requester?.role !== "CUSTOMER" || customerRecordMatchesEmail(update.customer.notes, requester.email))
    .map(({ customer: _customer, ...update }) => update);
};

export const upsertTrackingUpdate = async (update: TrackingUpdateInput, requester?: Requester) => {
  await assertCustomerRecordAccess(update.customerId, requester);
  return prisma.trackingUpdate.upsert({
    where: { customerId: update.customerId },
    create: {
      customerId: update.customerId,
      latitude: update.latitude,
      longitude: update.longitude,
      status: update.status,
      address: update.address,
      updatedBy: update.updatedBy
    },
    update: {
      latitude: update.latitude,
      longitude: update.longitude,
      status: update.status,
      address: update.address,
      updatedBy: update.updatedBy
    }
  });
};
