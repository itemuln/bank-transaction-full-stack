// =============================================================================
// Database Seed — Creates default roles, permissions, and admin user
// =============================================================================

import "dotenv/config";
import bcryptjs from "bcryptjs";
import { PrismaClient } from "../lib/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ROLES = ["CUSTOMER", "TELLER", "MANAGER", "ADMIN"];

const PERMISSIONS = [
  // Accounts
  { resource: "accounts", action: "create", description: "Create new accounts" },
  { resource: "accounts", action: "read", description: "View account details" },
  { resource: "accounts", action: "update", description: "Update account info" },
  { resource: "accounts", action: "freeze", description: "Freeze accounts" },
  { resource: "accounts", action: "close", description: "Close accounts" },

  // Transactions
  { resource: "transactions", action: "deposit", description: "Make deposits" },
  { resource: "transactions", action: "withdraw", description: "Make withdrawals" },
  { resource: "transactions", action: "transfer", description: "Transfer funds" },
  { resource: "transactions", action: "read", description: "View transactions" },
  { resource: "transactions", action: "approve", description: "Approve large transactions" },

  // Users
  { resource: "users", action: "read", description: "View user profiles" },
  { resource: "users", action: "create", description: "Create users" },
  { resource: "users", action: "update", description: "Update users" },
  { resource: "users", action: "delete", description: "Delete users" },
  { resource: "users", action: "assign_role", description: "Assign roles" },

  // Admin
  { resource: "audit_logs", action: "read", description: "View audit logs" },
  { resource: "system", action: "configure", description: "System configuration" },
];

const ROLE_PERMISSIONS: Record<string, { resource: string; action: string }[]> = {
  CUSTOMER: [
    { resource: "accounts", action: "read" },
    { resource: "transactions", action: "transfer" },
    { resource: "transactions", action: "read" },
    { resource: "users", action: "read" },
  ],
  TELLER: [
    { resource: "accounts", action: "create" },
    { resource: "accounts", action: "read" },
    { resource: "transactions", action: "deposit" },
    { resource: "transactions", action: "withdraw" },
    { resource: "transactions", action: "read" },
    { resource: "users", action: "read" },
    { resource: "users", action: "create" },
  ],
  MANAGER: [
    { resource: "accounts", action: "read" },
    { resource: "accounts", action: "update" },
    { resource: "accounts", action: "freeze" },
    { resource: "transactions", action: "read" },
    { resource: "transactions", action: "approve" },
    { resource: "users", action: "read" },
    { resource: "audit_logs", action: "read" },
  ],
  ADMIN: PERMISSIONS.map((p) => ({ resource: p.resource, action: p.action })),
};

async function seed() {
  console.log("🌱 Seeding database...\n");

  // Create roles
  console.log("Creating roles...");
  for (const name of ROLES) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} role` },
    });
  }

  // Create permissions
  console.log("Creating permissions...");
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { resource_action: { resource: perm.resource, action: perm.action } },
      update: {},
      create: perm,
    });
  }

  // Assign permissions to roles
  console.log("Assigning permissions to roles...");
  for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;

    for (const perm of perms) {
      const permission = await prisma.permission.findUnique({
        where: { resource_action: { resource: perm.resource, action: perm.action } },
      });
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  // Create default admin user
  console.log("Creating default admin user...");
  const adminPassword = await bcryptjs.hash("Admin@12345", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@bankingsystem.com" },
    update: {},
    create: {
      email: "admin@bankingsystem.com",
      passwordHash: adminPassword,
      firstName: "System",
      lastName: "Admin",
      emailVerified: true,
      isActive: true,
    },
  });

  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  if (adminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
      update: {},
      create: { userId: admin.id, roleId: adminRole.id },
    });
  }

  // Create demo customer
  console.log("Creating demo customer...");
  const customerPassword = await bcryptjs.hash("Customer@123", 12);
  const customer = await prisma.user.upsert({
    where: { email: "customer@bankingsystem.com" },
    update: {},
    create: {
      email: "customer@bankingsystem.com",
      passwordHash: customerPassword,
      firstName: "Temuulen",
      lastName: "Demo",
      emailVerified: true,
      isActive: true,
    },
  });

  const customerRole = await prisma.role.findUnique({ where: { name: "CUSTOMER" } });
  if (customerRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: customer.id, roleId: customerRole.id } },
      update: {},
      create: { userId: customer.id, roleId: customerRole.id },
    });
  }

  // Create demo accounts for customer
  console.log("Creating demo accounts...");
  await prisma.account.upsert({
    where: { accountNumber: "1000000001" },
    update: {},
    create: {
      accountNumber: "1000000001",
      userId: customer.id,
      type: "CHECKING",
      status: "ACTIVE",
      balance: 5250.75,
      dailyLimit: 10000,
    },
  });

  await prisma.account.upsert({
    where: { accountNumber: "1000000002" },
    update: {},
    create: {
      accountNumber: "1000000002",
      userId: customer.id,
      type: "SAVINGS",
      status: "ACTIVE",
      balance: 12500.00,
      dailyLimit: 5000,
    },
  });

  // Create demo teller
  const tellerPassword = await bcryptjs.hash("Teller@123", 12);
  const teller = await prisma.user.upsert({
    where: { email: "teller@bankingsystem.com" },
    update: {},
    create: {
      email: "teller@bankingsystem.com",
      passwordHash: tellerPassword,
      firstName: "Jane",
      lastName: "Teller",
      emailVerified: true,
      isActive: true,
    },
  });

  const tellerRole = await prisma.role.findUnique({ where: { name: "TELLER" } });
  if (tellerRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: teller.id, roleId: tellerRole.id } },
      update: {},
      create: { userId: teller.id, roleId: tellerRole.id },
    });
  }

  // Create demo manager
  const managerPassword = await bcryptjs.hash("Manager@123", 12);
  const manager = await prisma.user.upsert({
    where: { email: "manager@bankingsystem.com" },
    update: {},
    create: {
      email: "manager@bankingsystem.com",
      passwordHash: managerPassword,
      firstName: "Mike",
      lastName: "Manager",
      emailVerified: true,
      isActive: true,
    },
  });

  const managerRole = await prisma.role.findUnique({ where: { name: "MANAGER" } });
  if (managerRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: manager.id, roleId: managerRole.id } },
      update: {},
      create: { userId: manager.id, roleId: managerRole.id },
    });
  }

  console.log("\n✅ Seed complete!");
  console.log("\nDemo Accounts:");
  console.log("  Admin:    admin@bankingsystem.com    / Admin@12345");
  console.log("  Customer: customer@bankingsystem.com / Customer@123");
  console.log("  Teller:   teller@bankingsystem.com   / Teller@123");
  console.log("  Manager:  manager@bankingsystem.com  / Manager@123");
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
