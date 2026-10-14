import * as PrismaClient from "@prisma/client";
import type { UserRole } from "@prisma/client";
import { createUser, getUserByEmail, updateLastLogin } from "./user.service.js";
import { prisma } from "../config/prisma.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { createAccessSession } from "./session.service.js";

export const registerUser = async (input: {
  email: string;
  password: string;
  displayName: string;
  fullName: string;
  role: UserRole;
  department?: string | null;
  position?: string | null;
  adminCode?: string | null;
  employeeId?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
}) => {
  const existing = await getUserByEmail(input.email);
  if (existing) {
    throw new Error("Email is already in use");
  }

  if (input.role === PrismaClient.UserRole.ADMIN) {
    throw new Error("Admin accounts must be provisioned by an administrator");
  }
  if (input.role === PrismaClient.UserRole.CUSTOMER) {
    throw new Error("Customer accounts must be provisioned by an employee or administrator");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await createUser({
    email: input.email,
    passwordHash,
    displayName: input.displayName,
    fullName: input.fullName,
    role: input.role,
    department: input.department ?? null,
    position: input.position ?? null,
    adminCode: input.adminCode ?? null,
    employeeId: input.employeeId ?? null,
    phoneNumber: input.phoneNumber ?? null,
    address: input.address ?? null
  });

  return { user };
};

export const createCustomerCredentials = async (input: {
  email: string;
  password: string;
  displayName: string;
  fullName: string;
  phoneNumber?: string | null;
  address?: string | null;
}) => {
  const existing = await getUserByEmail(input.email);
  if (existing) {
    throw new Error("Email is already in use");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    email: input.email,
    passwordHash,
    displayName: input.displayName,
    fullName: input.fullName,
    role: PrismaClient.UserRole.CUSTOMER,
    phoneNumber: input.phoneNumber ?? null,
    address: input.address ?? null
  });

  return user;
};

export const changeOwnPassword = async (input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) => {
  const user = await prisma.user.findUnique({
    where: { id: input.userId }
  });
  if (!user) {
    throw new Error("User not found");
  }

  const currentPasswordValid = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!currentPasswordValid) {
    throw new Error("Current password is incorrect");
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.$transaction([prisma.user.update({
    where: { id: input.userId },
    data: { passwordHash }
  }), prisma.authSession.updateMany({ where: { userId: input.userId, revokedAt: null }, data: { revokedAt: new Date() } })]);
};

export const loginUser = async (email: string, password: string, adminCode?: string) => {
  const userRecord = await getUserByEmail(email);
  if (!userRecord) {
    throw new Error("Invalid email or password");
  }

  const isValid = await verifyPassword(password, userRecord.passwordHash);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  if (userRecord.role === PrismaClient.UserRole.ADMIN && adminCode) {
    if (userRecord.adminCode !== adminCode) {
      throw new Error("Invalid admin code");
    }
  }

  if (userRecord.role === PrismaClient.UserRole.EMPLOYEE) {
    const profile = await prisma.employeeProfile.findUnique({
      where: { userId: userRecord.id },
      select: { status: true, dateOfRelieving: true }
    });

    if (profile?.status === PrismaClient.EmployeeAccountStatus.FROZEN) {
      throw new Error("Employee account is frozen");
    }

    const now = new Date();
    if (profile?.dateOfRelieving && profile.dateOfRelieving <= now) {
      await prisma.employeeProfile.update({
        where: { userId: userRecord.id },
        data: { status: PrismaClient.EmployeeAccountStatus.FROZEN }
      });
      throw new Error("Employee account is frozen");
    }
  }

  await updateLastLogin(userRecord.id);

  const token = await createAccessSession({
    sub: userRecord.id,
    role: userRecord.role,
    email: userRecord.email,
    displayName: userRecord.displayName
  });

  return {
    token,
    user: {
      id: userRecord.id,
      email: userRecord.email,
      displayName: userRecord.displayName,
      fullName: userRecord.fullName,
      role: userRecord.role,
      department: userRecord.department,
      position: userRecord.position,
      employeeId: userRecord.employeeId,
      phoneNumber: userRecord.phoneNumber,
      address: userRecord.address,
      createdAt: userRecord.createdAt,
      lastLogin: userRecord.lastLogin
    }
  };
};
