import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { cache } from "../config/redis";
import logger from "../config/logger";
import { emailService } from "./email.service";
import { ApiError } from "../utils/errors";
import { validateTimezone, getTimezoneOffset } from "../utils/timezone";
import { User, UserCreateInput } from "../types/user";
import { AuthTokens, JwtPayload, RefreshTokenPayload } from "../types/api";
import { AuthProvider } from "@prisma/client";

const SALT_ROUNDS = 12;

export class AuthService {
  async register(
    input: UserCreateInput,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ApiError(409, "User already exists", "USER_EXISTS");
    }

    const passwordHash = input.password
      ? await bcrypt.hash(input.password, SALT_ROUNDS)
      : null;

    const dbUser = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        authProvider: (input.authProvider?.toUpperCase() as AuthProvider) || AuthProvider.EMAIL,
        providerId: input.providerId,
        displayName: input.displayName,
        gender: input.gender,
        birthDate: input.birthDate,
        birthTime: input.birthTime,
        birthTimeUnknown: input.birthTimeUnknown || false,
        birthLocationName: input.birthLocationName,
        birthLatitude: input.birthLatitude,
        birthLongitude: input.birthLongitude,
        birthTimezone: validateTimezone(input.birthLatitude, input.birthLongitude, input.birthTimezone),
        birthUtcOffset: getTimezoneOffset(input.birthTimezone, input.birthDate),
        profileCompleted: true,
      },
    });

    const user = this.mapDbUserToUser(dbUser);
    const tokens = await this.generateTokens(user.id, user.email);

    return { user, tokens };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const dbUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!dbUser || !dbUser.passwordHash) {
      throw new ApiError(401, "Invalid credentials", "INVALID_CREDENTIALS");
    }

    const isValid = await bcrypt.compare(password, dbUser.passwordHash);

    if (!isValid) {
      throw new ApiError(401, "Invalid credentials", "INVALID_CREDENTIALS");
    }

    const user = this.mapDbUserToUser(dbUser);
    const tokens = await this.generateTokens(user.id, user.email);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { user, tokens };
  }

  async socialLogin(
    provider: "google" | "apple",
    providerId: string,
    email: string,
    profile: { displayName?: string; avatarUrl?: string },
  ): Promise<{ user: User; tokens: AuthTokens; isNewUser: boolean }> {
    const authProvider = provider.toUpperCase() as AuthProvider;
    let dbUser = await prisma.user.findFirst({
      where: { authProvider, providerId },
    });

    let isNewUser = false;

    if (!dbUser) {
      // Check for existing user with same email
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingByEmail) {
        // Link social account to existing user
        dbUser = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            authProvider,
            providerId,
          },
        });
      } else {
        // Create new user
        isNewUser = true;
        dbUser = await prisma.user.create({
          data: {
            email,
            authProvider,
            providerId,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            birthDate: new Date(), // Placeholder - should require this on signup
            birthTimezone: "UTC",
            profileCompleted: false,
          },
        });
      }
    }

    const user = this.mapDbUserToUser(dbUser);
    const tokens = await this.generateTokens(user.id, user.email);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { user, tokens, isNewUser };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(
        refreshToken,
        env.JWT_REFRESH_SECRET,
      ) as RefreshTokenPayload;

      // Check if token is revoked
      const isRevoked = await cache.get<boolean>(`revoked:${payload.tokenId}`);
      if (isRevoked) {
        throw new ApiError(401, "Token revoked", "TOKEN_REVOKED");
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.isActive) {
        throw new ApiError(401, "User not found or inactive", "USER_INVALID");
      }

      return this.generateTokens(user.id, user.email);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(401, "Invalid refresh token", "INVALID_TOKEN");
    }
  }

  async revokeToken(refreshToken: string): Promise<void> {
    try {
      const payload = jwt.verify(
        refreshToken,
        env.JWT_REFRESH_SECRET,
      ) as RefreshTokenPayload;
      await cache.set(`revoked:${payload.tokenId}`, true, 7 * 24 * 60 * 60); // 7 days
    } catch (error) {
      logger.warn("Failed to revoke token", { error });
    }
  }

  async logout(userId: string): Promise<void> {
    await cache.delete(`push_tokens:${userId}`);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ApiError(
        401,
        "Current password is incorrect",
        "INVALID_PASSWORD",
      );
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Revoke all refresh tokens
    await this.revokeAllUserTokens(userId);
  }

  async setPassword(userId: string, password: string): Promise<void> {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash },
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      logger.info("Password reset requested for non-existent email", { email });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    await cache.set(`password_reset:${token}`, user.id, 3600); // 1 hour

    await emailService.sendPasswordResetEmail(email, token);
    logger.info("Password reset requested", { email, userId: user.id });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await cache.get<string>(`password_reset:${token}`);

    if (!userId) {
      throw new ApiError(400, "Invalid or expired token", "INVALID_TOKEN");
    }

    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash },
    });

    await cache.delete(`password_reset:${token}`);
    await this.revokeAllUserTokens(userId);
  }

  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<AuthTokens> {
    const tokenId = crypto.randomUUID();

    const accessPayload: JwtPayload = {
      userId,
      email,
      iat: Date.now(),
      exp: Date.now() + this.parseDuration(env.JWT_EXPIRES_IN),
    };

    const refreshPayload: RefreshTokenPayload = {
      userId,
      tokenId,
      iat: Date.now(),
      exp: Date.now() + this.parseDuration(env.JWT_REFRESH_EXPIRES_IN),
    };

    const accessToken = jwt.sign(accessPayload, env.JWT_SECRET);
    const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseDuration(env.JWT_EXPIRES_IN) / 1000,
    };
  }

  private async revokeAllUserTokens(userId: string): Promise<void> {
    // In a production app, you'd want to track active refresh tokens in Redis
    // and revoke them all here
    logger.info("Revoking all tokens for user", { userId });
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000; // Default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * (multipliers[unit] || 1000);
  }

  private mapDbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      emailVerified: dbUser.emailVerified,
      authProvider: dbUser.authProvider,
      displayName: dbUser.displayName || undefined,
      gender: dbUser.gender || undefined,
      bio: dbUser.bio || undefined,
      avatarUrl: dbUser.avatarUrl || undefined,
      profileCompleted: dbUser.profileCompleted || false,
      birthDate: dbUser.birthDate,
      birthTime: dbUser.birthTime || undefined,
      birthTimeUnknown: dbUser.birthTimeUnknown || false,
      birthLocationName: dbUser.birthLocationName || undefined,
      birthLatitude: dbUser.birthLatitude || undefined,
      birthLongitude: dbUser.birthLongitude || undefined,
      birthTimezone: dbUser.birthTimezone,
      birthUtcOffset: dbUser.birthUtcOffset || undefined,
      notificationSettings: dbUser.notificationSettings as any,
      privacySettings: dbUser.privacySettings as any,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
      lastActiveAt: dbUser.lastActiveAt,
    };
  }
}

export const authService = new AuthService();
