// =============================================================================
// User Repository — Database access for user-related operations
// =============================================================================

import { prisma } from "../config/database";
import { Prisma } from "../../lib/generated/prisma/client";

export class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: Date;
    address?: string;
  }) {
    return prisma.user.create({
      data,
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      }),
      prisma.user.count(),
    ]);
    return { users, total };
  }

  async assignRole(userId: string, roleName: string) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw new Error(`Role ${roleName} not found`);

    return prisma.userRole.upsert({
      where: {
        userId_roleId: { userId, roleId: role.id },
      },
      update: {},
      create: { userId, roleId: role.id },
    });
  }

  async removeRole(userId: string, roleName: string) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw new Error(`Role ${roleName} not found`);

    return prisma.userRole.deleteMany({
      where: { userId, roleId: role.id },
    });
  }

  async incrementFailedAttempts(id: string) {
    return prisma.user.update({
      where: { id },
      data: { failedAttempts: { increment: 1 } },
    });
  }

  async resetFailedAttempts(id: string) {
    return prisma.user.update({
      where: { id },
      data: { failedAttempts: 0, lockedUntil: null },
    });
  }

  async lockAccount(id: string, until: Date) {
    return prisma.user.update({
      where: { id },
      data: { lockedUntil: until },
    });
  }

  async getStats() {
    const [totalUsers, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
    ]);
    return { totalUsers, activeUsers };
  }
}

export const userRepository = new UserRepository();
