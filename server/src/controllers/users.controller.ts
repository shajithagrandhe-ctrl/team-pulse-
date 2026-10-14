import type { Request, Response } from "express";
import * as PrismaClient from "@prisma/client";
import { getUsersByRole } from "../services/user.service.js";

export const listEmployees = async (_req: Request, res: Response) => {
  const employees = await getUsersByRole(PrismaClient.UserRole.EMPLOYEE);
  return res.json({
    success: true,
    data: employees,
    message: `Found ${employees.length} employees`
  });
};

export const listAdmins = async (_req: Request, res: Response) => {
  const admins = await getUsersByRole(PrismaClient.UserRole.ADMIN);
  return res.json({
    success: true,
    data: admins,
    message: `Found ${admins.length} admins`
  });
};

export const listCustomers = async (_req: Request, res: Response) => {
  const customers = await getUsersByRole(PrismaClient.UserRole.CUSTOMER);
  return res.json({
    success: true,
    data: customers,
    message: `Found ${customers.length} customers`
  });
};
