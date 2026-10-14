import { prisma } from "../config/prisma.js";

const parseJsonArray = (value: unknown) => {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const getEmployeeAssignment = async (userId: string) => {
  let rows: Array<{ userId: string; assignedLocationIds: unknown; assignedVentureIds: unknown }> = [];
  try {
    rows = await prisma.$queryRawUnsafe<
      Array<{ userId: string; assignedLocationIds: unknown; assignedVentureIds: unknown }>
    >(
      "SELECT userId, assignedLocationIds, assignedVentureIds FROM EmployeeAssignment WHERE userId = ? LIMIT 1",
      userId
    );
  } catch {
    return { assignedLocationIds: [] as string[], assignedVentureIds: [] as string[] };
  }

  const row = rows[0];
  if (!row) return { assignedLocationIds: [] as string[], assignedVentureIds: [] as string[] };
  return {
    assignedLocationIds: parseJsonArray(row.assignedLocationIds),
    assignedVentureIds: parseJsonArray(row.assignedVentureIds)
  };
};

export const getEmployeeAssignmentMap = async (userIds: string[]) => {
  if (!userIds.length) return new Map<string, { assignedLocationIds: string[]; assignedVentureIds: string[] }>();

  const placeholders = userIds.map(() => "?").join(",");
  let rows: Array<{ userId: string; assignedLocationIds: unknown; assignedVentureIds: unknown }> = [];
  try {
    rows = await prisma.$queryRawUnsafe<
      Array<{ userId: string; assignedLocationIds: unknown; assignedVentureIds: unknown }>
    >(
      `SELECT userId, assignedLocationIds, assignedVentureIds FROM EmployeeAssignment WHERE userId IN (${placeholders})`,
      ...userIds
    );
  } catch {
    return new Map<string, { assignedLocationIds: string[]; assignedVentureIds: string[] }>();
  }

  const map = new Map<string, { assignedLocationIds: string[]; assignedVentureIds: string[] }>();
  rows.forEach((row) => {
    map.set(row.userId, {
      assignedLocationIds: parseJsonArray(row.assignedLocationIds),
      assignedVentureIds: parseJsonArray(row.assignedVentureIds)
    });
  });
  return map;
};

export const upsertEmployeeAssignment = async (userId: string, assignedLocationIds: string[], assignedVentureIds: string[]) => {
  const now = new Date();
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO EmployeeAssignment (userId, assignedLocationIds, assignedVentureIds, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE assignedLocationIds = VALUES(assignedLocationIds), assignedVentureIds = VALUES(assignedVentureIds), updatedAt = VALUES(updatedAt)`,
      userId,
      JSON.stringify(assignedLocationIds),
      JSON.stringify(assignedVentureIds),
      now,
      now
    );
  } catch {
    // If migration has not yet been applied, keep core employee flows working.
  }
};
