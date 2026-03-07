// =============================================================================
// Session Repository — Database access for refresh token sessions
// =============================================================================

import { prisma } from "../config/database";

export class SessionRepository {
  async create(data: {
    userId: string;
    refreshToken: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt: Date;
  }) {
    return prisma.session.create({ data });
  }

  async findByRefreshToken(refreshToken: string) {
    return prisma.session.findUnique({
      where: { refreshToken },
      include: {
        user: {
          include: {
            userRoles: {
              include: { role: true },
            },
          },
        },
      },
    });
  }

  async deleteByRefreshToken(refreshToken: string) {
    return prisma.session.deleteMany({
      where: { refreshToken },
    });
  }

  async deleteAllForUser(userId: string) {
    return prisma.session.deleteMany({
      where: { userId },
    });
  }

  async deleteExpired() {
    return prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}

export const sessionRepository = new SessionRepository();
