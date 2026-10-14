import { prisma } from "../config/prisma.js";

export const listAgents = async () => {
  return prisma.user.findMany({
    where: { role: { in: ["AGENT", "EMPLOYEE"] } },
    select: {
      id: true,
      displayName: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      department: true,
      position: true,
      agentProfile: true
    },
    orderBy: { displayName: "asc" }
  });
};

export const getAgentById = async (id: string) => {
  return prisma.user.findFirst({
    where: { id, role: { in: ["AGENT", "EMPLOYEE"] } },
    select: {
      id: true,
      displayName: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      department: true,
      position: true,
      agentProfile: true
    }
  });
};