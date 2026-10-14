import { prisma } from "../config/prisma.js";

export const createInquiry = async (input: {
  plotId?: string;
  agentId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  message: string;
}) => {
  return prisma.inquiry.create({
    data: {
      plotId: input.plotId,
      agentId: input.agentId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      message: input.message
    }
  });
};