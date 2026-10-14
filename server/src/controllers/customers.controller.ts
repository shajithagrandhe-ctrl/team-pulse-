import type { Response } from "express";
import { createCustomerRecord, deleteCustomerRecord, listCustomerRecords, updateCustomerRecord } from "../services/customer.service.js";
import { publishEvent } from "../realtime/events.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

export const getCustomerRecords = async (req: AuthenticatedRequest, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : undefined;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;
  const result = await listCustomerRecords({
    page,
    pageSize,
    requester: { userId: req.user?.sub, role: req.user?.role, email: req.user?.email, displayName: req.user?.displayName }
  });

  return res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    message: `Found ${result.data.length} records`
  });
};

export const createCustomerRecordHandler = async (req: AuthenticatedRequest, res: Response) => {
  const record = await createCustomerRecord(req.body, {
    userId: req.user?.sub,
    role: req.user?.role,
    email: req.user?.email,
    displayName: req.user?.displayName
  });
  publishEvent("customer.created", { record });

  return res.status(201).json({
    success: true,
    data: record,
    message: "Customer record created successfully"
  });
};

export const updateCustomerRecordHandler = async (req: AuthenticatedRequest, res: Response) => {
  const record = await updateCustomerRecord(req.params.id, req.body, {
    userId: req.user?.sub,
    role: req.user?.role,
    email: req.user?.email,
    displayName: req.user?.displayName
  });
  publishEvent("customer.updated", { record });

  return res.json({
    success: true,
    data: record,
    message: "Customer record updated successfully"
  });
};

export const deleteCustomerRecordHandler = async (req: AuthenticatedRequest, res: Response) => {
  const record = await deleteCustomerRecord(req.params.id, {
    userId: req.user?.sub, role: req.user?.role, email: req.user?.email, displayName: req.user?.displayName
  });
  publishEvent("customer.deleted", { recordId: record.id });

  return res.json({
    success: true,
    message: "Customer record deleted successfully"
  });
};
