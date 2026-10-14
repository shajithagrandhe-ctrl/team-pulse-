import { prisma } from "../config/prisma.js";
import type { UserRole } from "@prisma/client";

const userSelect = {
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
  employeeProfile: {
    select: {
      status: true,
      emailVerified: true,
      phoneVerified: true,
      dateOfJoining: true,
      dateOfRelieving: true
    }
  }
};

export const getUsersByRole = async (role: UserRole) => {
  return prisma.user.findMany({
    where: { role },
    orderBy: [{ department: "asc" }, { position: "asc" }, { displayName: "asc" }],
    select: userSelect
  });
};

export const getUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email }
  });
};

export const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: userSelect
  });
};

export const createUser = async (data: {
  email: string;
  passwordHash: string;
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
  return prisma.user.create({
    data,
    select: userSelect
  });
};

export const updateLastLogin = async (id: string) => {
  return prisma.user.update({
    where: { id },
    data: { lastLogin: new Date() }
  });
};
