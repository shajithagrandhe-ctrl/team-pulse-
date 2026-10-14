import type { Request, Response } from "express";
import * as PrismaClient from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { hashPassword } from "../utils/password.js";
import { requestOtp, verifyOtp } from "../services/otp.service.js";
import { getEmployeeAssignment, getEmployeeAssignmentMap, upsertEmployeeAssignment } from "../services/employeeAssignment.service.js";

const employeeAccountSelect = {
  id: true,
  email: true,
  displayName: true,
  fullName: true,
  role: true,
  department: true,
  position: true,
  employeeId: true,
  phoneNumber: true,
  address: true,
  createdAt: true,
  lastLogin: true,
  employeeProfile: true
};

export const listEmployeeAccounts = async (_req: Request, res: Response) => {
  const employees = await prisma.user.findMany({
    where: { role: PrismaClient.UserRole.EMPLOYEE },
    orderBy: [{ createdAt: "desc" }],
    select: employeeAccountSelect
  });
  const assignmentMap = await getEmployeeAssignmentMap(employees.map((employee) => employee.id));
  const data = employees.map((employee) => {
    const assignment = assignmentMap.get(employee.id);
    return {
      ...employee,
      employeeProfile: employee.employeeProfile
        ? {
            ...employee.employeeProfile,
            assignedLocationIds: assignment?.assignedLocationIds ?? [],
            assignedVentureIds: assignment?.assignedVentureIds ?? []
          }
        : employee.employeeProfile
    };
  });

  return res.json({
    success: true,
    data,
    message: `Found ${data.length} employees`
  });
};

export const createEmployeeAccount = async (req: Request, res: Response) => {
  const body = req.body as any;

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    throw new Error("Email is already in use");
  }

  const passwordHash = await hashPassword(body.password);

  const firstName = body.firstName?.trim() || null;
  const lastName = body.lastName?.trim() || null;
  const inferredName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const fullName = (body.fullName?.trim() || inferredName || body.displayName?.trim() || body.email).trim();
  const displayName = (body.displayName?.trim() || fullName).trim();

  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      displayName,
      fullName,
      role: PrismaClient.UserRole.EMPLOYEE,
      department: body.department ?? null,
      position: body.position ?? null,
      employeeId: body.employeeId ?? null,
      phoneNumber: body.phoneNumber ?? null,
      address: body.address ?? null,
      employeeProfile: {
        create: {
          firstName,
          lastName,
          emailVerified: Boolean(body.emailVerified),
          phoneVerified: Boolean(body.phoneVerified),
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
          yearsOfExperience: body.yearsOfExperience ?? null,
          currentCompany: body.currentCompany ?? null,
          previousCompanies: body.previousCompanies ?? null,
          currentPosition: body.currentPosition ?? null,
          roleGiven: body.roleGiven ?? null,
          dateOfJoining: body.dateOfJoining ? new Date(body.dateOfJoining) : null,
          dateOfRelieving: body.dateOfRelieving ? new Date(body.dateOfRelieving) : null,
          achievements: body.achievements ?? null,
          status: body.status ?? PrismaClient.EmployeeAccountStatus.ACTIVE
        }
      }
    },
    select: employeeAccountSelect
  });
  await upsertEmployeeAssignment(
    user.id,
    Array.isArray(body.assignedLocationIds) ? body.assignedLocationIds : [],
    Array.isArray(body.assignedVentureIds) ? body.assignedVentureIds : []
  );
  const assignment = await getEmployeeAssignment(user.id);

  return res.status(201).json({
    success: true,
    data: {
      ...user,
      employeeProfile: user.employeeProfile
        ? {
            ...user.employeeProfile,
            assignedLocationIds: assignment.assignedLocationIds,
            assignedVentureIds: assignment.assignedVentureIds
          }
        : user.employeeProfile
    },
    message: "Employee created"
  });
};

export const updateEmployeeAccount = async (req: Request, res: Response) => {
  const { id } = req.params as any;
  const body = req.body as any;

  const updates: any = {};
  if (body.displayName !== undefined) updates.displayName = body.displayName;
  if (body.fullName !== undefined) updates.fullName = body.fullName;
  if (body.department !== undefined) updates.department = body.department;
  if (body.position !== undefined) updates.position = body.position;
  if (body.employeeId !== undefined) updates.employeeId = body.employeeId;
  if (body.phoneNumber !== undefined) updates.phoneNumber = body.phoneNumber;
  if (body.address !== undefined) updates.address = body.address;

  if (body.password) {
    updates.passwordHash = await hashPassword(body.password);
  }

  const profileUpdate: any = {};
  if (body.firstName !== undefined) profileUpdate.firstName = body.firstName;
  if (body.lastName !== undefined) profileUpdate.lastName = body.lastName;
  if (body.emailVerified !== undefined) profileUpdate.emailVerified = body.emailVerified;
  if (body.phoneVerified !== undefined) profileUpdate.phoneVerified = body.phoneVerified;
  if (body.dateOfBirth !== undefined) profileUpdate.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  if (body.yearsOfExperience !== undefined) profileUpdate.yearsOfExperience = body.yearsOfExperience;
  if (body.currentCompany !== undefined) profileUpdate.currentCompany = body.currentCompany;
  if (body.previousCompanies !== undefined) profileUpdate.previousCompanies = body.previousCompanies;
  if (body.currentPosition !== undefined) profileUpdate.currentPosition = body.currentPosition;
  if (body.roleGiven !== undefined) profileUpdate.roleGiven = body.roleGiven;
  if (body.dateOfJoining !== undefined) profileUpdate.dateOfJoining = body.dateOfJoining ? new Date(body.dateOfJoining) : null;
  if (body.dateOfRelieving !== undefined) profileUpdate.dateOfRelieving = body.dateOfRelieving ? new Date(body.dateOfRelieving) : null;
  if (body.achievements !== undefined) profileUpdate.achievements = body.achievements;
  if (body.status !== undefined) profileUpdate.status = body.status;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...updates,
      employeeProfile: {
        upsert: {
          create: {
            firstName: body.firstName ?? null,
            lastName: body.lastName ?? null,
            emailVerified: Boolean(body.emailVerified),
            phoneVerified: Boolean(body.phoneVerified),
            dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
            yearsOfExperience: body.yearsOfExperience ?? null,
            currentCompany: body.currentCompany ?? null,
            previousCompanies: body.previousCompanies ?? null,
            currentPosition: body.currentPosition ?? null,
            roleGiven: body.roleGiven ?? null,
            dateOfJoining: body.dateOfJoining ? new Date(body.dateOfJoining) : null,
            dateOfRelieving: body.dateOfRelieving ? new Date(body.dateOfRelieving) : null,
            achievements: body.achievements ?? null,
            status: body.status ?? PrismaClient.EmployeeAccountStatus.ACTIVE
          },
          update: profileUpdate
        }
      }
    },
    select: employeeAccountSelect
  });
  if (body.assignedLocationIds !== undefined || body.assignedVentureIds !== undefined) {
    const existingAssignment = await getEmployeeAssignment(id);
    await upsertEmployeeAssignment(
      id,
      body.assignedLocationIds !== undefined ? body.assignedLocationIds ?? [] : existingAssignment.assignedLocationIds,
      body.assignedVentureIds !== undefined ? body.assignedVentureIds ?? [] : existingAssignment.assignedVentureIds
    );
  }
  const assignment = await getEmployeeAssignment(id);

  return res.json({
    success: true,
    data: {
      ...user,
      employeeProfile: user.employeeProfile
        ? {
            ...user.employeeProfile,
            assignedLocationIds: assignment.assignedLocationIds,
            assignedVentureIds: assignment.assignedVentureIds
          }
        : user.employeeProfile
    },
    message: "Employee updated"
  });
};

export const setEmployeeStatus = async (req: Request, res: Response) => {
  const { id } = req.params as any;
  const { status } = req.body as any;

  const profile = await prisma.employeeProfile.upsert({
    where: { userId: id },
    create: {
      userId: id,
      status
    },
    update: {
      status
    }
  });

  return res.json({
    success: true,
    data: profile,
    message: `Employee status set to ${status}`
  });
};

export const requestEmployeeOtp = async (req: Request, res: Response) => {
  const { type, target } = req.body as any;
  const result = requestOtp({ type, target });

  return res.json({
    success: true,
    data: result,
    message: "OTP generated (development mode)"
  });
};

export const verifyEmployeeOtp = async (req: Request, res: Response) => {
  const { requestId, otp } = req.body as any;
  const result = verifyOtp({ requestId, otp });

  return res.json({
    success: true,
    data: result,
    message: "OTP verified"
  });
};
