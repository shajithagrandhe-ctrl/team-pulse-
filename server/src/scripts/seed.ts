import { prisma } from "../config/prisma.js";
import { hashPassword } from "../utils/password.js";
import * as PrismaClient from "@prisma/client";

const randomStatus = () => {
  const rand = Math.random();
  if (rand < 0.5) return PrismaClient.PlotStatus.AVAILABLE;
  if (rand < 0.8) return PrismaClient.PlotStatus.ADVANCE;
  return PrismaClient.PlotStatus.SOLD;
};

const seed = async () => {
  await prisma.inquiry.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.plot.deleteMany();
  await prisma.venture.deleteMany();
  await prisma.location.deleteMany();
  await prisma.customerRecord.deleteMany();
  await prisma.agentProfile.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await hashPassword("Admin123!");
  const employeePassword = await hashPassword("Emp123!");
  const customerPassword = await hashPassword("Cust123!");

  const admins = await prisma.user.createMany({
    data: [
      {
        email: "admin@estatehub.com",
        passwordHash: adminPassword,
        displayName: "Super Admin",
        fullName: "Super Administrator",
        role: PrismaClient.UserRole.ADMIN,
        department: "Administration",
        position: "Super Administrator",
        adminCode: "ADMIN2026"
      },
      {
        email: "manager@estatehub.com",
        passwordHash: adminPassword,
        displayName: "Operations Manager",
        fullName: "Operations Manager",
        role: PrismaClient.UserRole.ADMIN,
        department: "Operations",
        position: "Operations Manager",
        adminCode: "ADMIN2027"
      }
    ]
  });

  await prisma.user.createMany({
    data: [
      {
        email: "john.employee@estatehub.com",
        passwordHash: employeePassword,
        displayName: "John Employee",
        fullName: "John Employee",
        role: PrismaClient.UserRole.EMPLOYEE,
        department: "Sales",
        position: "Executive",
        employeeId: "EMP001",
        phoneNumber: "+91 9876543210"
      },
      {
        email: "lisa.agent@estatehub.com",
        passwordHash: employeePassword,
        displayName: "Lisa Anderson",
        fullName: "Lisa Anderson",
        role: PrismaClient.UserRole.AGENT,
        department: "Sales",
        position: "Senior Agent",
        employeeId: "EMP002",
        phoneNumber: "+91 9876543211"
      }
    ]
  });

  await prisma.user.createMany({
    data: [
      {
        email: "customer1@estatehub.com",
        passwordHash: customerPassword,
        displayName: "Rajesh Kumar",
        fullName: "Rajesh Kumar",
        role: PrismaClient.UserRole.CUSTOMER,
        phoneNumber: "+91 9876543220",
        address: "Bhogapuram"
      },
      {
        email: "customer2@estatehub.com",
        passwordHash: customerPassword,
        displayName: "Sunita Devi",
        fullName: "Sunita Devi",
        role: PrismaClient.UserRole.CUSTOMER,
        phoneNumber: "+91 9876543221",
        address: "Gajuwaka"
      }
    ]
  });

  const locations = await prisma.location.createMany({
    data: [
      { name: "Bhogapuram" },
      { name: "Gajuwaka" },
      { name: "Aganampudi" }
    ]
  });

  const locationRecords = await prisma.location.findMany();

  for (const location of locationRecords) {
    for (let v = 1; v <= 2; v += 1) {
      const venture = await prisma.venture.create({
        data: {
          name: `Venture ${v}`,
          locationId: location.id
        }
      });

      const plots = Array.from({ length: 24 }).map((_, index) => ({
        plotNumber: `${index + 1}`,
        status: randomStatus(),
        area: 120 + Math.floor(Math.random() * 200),
        pricePerSqYard: 5000 + Math.floor(Math.random() * 10000),
        ventureId: venture.id
      }));

      await prisma.plot.createMany({ data: plots });
    }
  }

  const plots = await prisma.plot.findMany({ take: 5 });

  for (const plot of plots) {
    await prisma.lead.create({
      data: {
        plotId: plot.id,
        customerName: "Sample Lead",
        email: "lead@example.com",
        contactNumber: "+91 9876543999",
        location: "Bhogapuram",
        uniqueId: `CUST-${Date.now()}-${plot.id.slice(0, 4)}`,
        pricePerSqYard: plot.pricePerSqYard,
        notes: "Interested in premium plots"
      }
    });
  }

  await prisma.customerRecord.createMany({
    data: [
      {
        contactName: "Rajesh Kumar",
        contactNumber: "+91 9876543210",
        location: "Bhogapuram",
        budget: "INR 15,00,000",
        interested: true,
        recordOwner: "Sarat Kumar",
        notes: "Requested site visit"
      },
      {
        contactName: "Sunita Devi",
        contactNumber: "+91 9876543211",
        location: "Gajuwaka",
        budget: "INR 20,00,000",
        interested: false,
        recordOwner: "Ravi Teja",
        notes: "Follow up next month"
      }
    ]
  });

  // Attach agent profile for the agent user
  const agent = await prisma.user.findFirst({ where: { role: PrismaClient.UserRole.AGENT } });
  if (agent) {
    await prisma.agentProfile.create({
      data: {
        userId: agent.id,
        bio: "Specializes in premium residential plots.",
        phone: agent.phoneNumber ?? undefined,
        licenseNumber: "LIC-EST-2026",
        photoUrl: ""
      }
    });
  }

  // eslint-disable-next-line no-console
  console.log("Seed data created");
};

seed()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
