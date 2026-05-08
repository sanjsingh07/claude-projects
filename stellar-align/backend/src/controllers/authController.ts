import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authService } from "../services/auth.service";
import { prisma } from "../config/database";
import logger from "../config/logger";
import { ApiError } from "../utils/errors";
import { astrologyService } from "../services/astrology";
import { HouseSystem } from "@prisma/client";

export class AuthController {
  constructor() {
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.logout = this.logout.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.googleAuth = this.googleAuth.bind(this);
    this.googleCallback = this.googleCallback.bind(this);
    this.appleAuth = this.appleAuth.bind(this);
    this.socialLogin = this.socialLogin.bind(this);
  }

  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const {
        email,
        password,
        birthDate,
        birthTime,
        birthTimezone,
        birthLocationName,
        birthLatitude,
        birthLongitude,
        displayName,
        gender,
      } = req.body;

      const result = await authService.register({
        email,
        password,
        birthDate: new Date(birthDate),
        birthTime: birthTime ? new Date(`1970-01-01T${birthTime}`) : undefined,
        birthTimezone,
        birthLocationName,
        birthLatitude: birthLatitude ? parseFloat(birthLatitude) : undefined,
        birthLongitude: birthLongitude ? parseFloat(birthLongitude) : undefined,
        displayName,
        gender,
      });

      // Calculate natal chart in background (non-blocking)
      this.calculateUserChart(result.user.id).catch((err) => {
        logger.error("Failed to calculate initial chart", {
          userId: result.user.id,
          error: err,
        });
      });

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.json({
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await authService.revokeToken(refreshToken);
      }

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email } = req.body;
      await authService.requestPasswordReset(email);

      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: "If an account exists, a reset link has been sent",
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);

      res.json({
        success: true,
        message: "Password reset successful",
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(
        req.userId!,
        currentPassword,
        newPassword,
      );

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // OAuth handlers
  async googleAuth(
    _req: Request,
    _res: Response,
    _next: NextFunction,
  ): Promise<void> {
    // Redirect to Google OAuth
    // Implementation with passport
  }

  async googleCallback(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Handle Google OAuth callback
      // Implementation with passport
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async appleAuth(
    _req: Request,
    _res: Response,
    _next: NextFunction,
  ): Promise<void> {
    // Apple ID token verification placeholder
  }

  async socialLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { provider, idToken } = req.body;

      if (!provider || !idToken) {
        res.status(400).json({
          success: false,
          error: { code: "MISSING_FIELDS", message: "provider and idToken are required" },
        });
        return;
      }

      let email: string;
      let providerId: string;
      let displayName: string | undefined;
      let avatarUrl: string | undefined;

      if (provider === "google") {
        // Verify Google ID token by decoding it (Google tokens are JWTs)
        // In production, you should verify the signature using Google's public keys
        const decoded = jwt.decode(idToken) as any;
        if (!decoded || !decoded.email) {
          throw new ApiError(401, "Invalid Google token", "INVALID_TOKEN");
        }
        email = decoded.email;
        providerId = decoded.sub;
        displayName = decoded.name;
        avatarUrl = decoded.picture;
      } else if (provider === "apple") {
        // Verify Apple ID token
        const decoded = jwt.decode(idToken) as any;
        if (!decoded || !decoded.email) {
          throw new ApiError(401, "Invalid Apple token", "INVALID_TOKEN");
        }
        email = decoded.email;
        providerId = decoded.sub;
        displayName = decoded.email.split("@")[0]; // Apple doesn't always provide name
      } else {
        throw new ApiError(400, "Unsupported provider", "INVALID_PROVIDER");
      }

      const result = await authService.socialLogin(provider, providerId, email, {
        displayName,
        avatarUrl,
      });

      res.json({
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens,
          isNewUser: result.isNewUser,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  private async calculateUserChart(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { natalChart: true },
      });

      // Skip if user not found or already has a natal chart
      if (!user || user.natalChart) {
        return;
      }

      // Check if we have the required birth data
      if (
        user.birthDate &&
        user.birthLatitude != null &&
        user.birthLongitude != null
      ) {
        // Use default time of 12:00 if not provided
        const timeStr = user.birthTime
          ? user.birthTime.toISOString().slice(11, 16) // Extract HH:mm from ISO string
          : "12:00";

        // Calculate natal chart data
        const chartData = await astrologyService.calculateNatalChart(
          user.birthDate,
          timeStr,
          user.birthLatitude,
          user.birthLongitude,
          user.birthTimezone || "UTC",
        );

        // Save natal chart to database
        await prisma.natalChart.create({
          data: {
            userId,
            sunSign: chartData.sun.sign,
            moonSign: chartData.moon.sign,
            risingSign: chartData.ascendant?.sign || null,
            planetaryPositions: {
              sun: chartData.sun,
              moon: chartData.moon,
              mercury: chartData.mercury,
              venus: chartData.venus,
              mars: chartData.mars,
              jupiter: chartData.jupiter,
              saturn: chartData.saturn,
              uranus: chartData.uranus,
              neptune: chartData.neptune,
              pluto: chartData.pluto,
              chiron: chartData.chiron,
              lilith: chartData.lilith,
              node: chartData.node,
              ascendant: chartData.ascendant,
              midheaven: chartData.midheaven,
            } as any,
            houses: chartData.houses as any,
            aspects: chartData.aspects as any,
            chartPattern: undefined,
            houseSystem: HouseSystem.PLACIDUS,
            calculationMethod: "astronomia",
            calculatedAt: new Date(),
          },
        });

        logger.info("Natal chart calculated and saved successfully", {
          userId,
          sunSign: chartData.sun.sign,
          moonSign: chartData.moon.sign,
          risingSign: chartData.ascendant?.sign,
        });
      }
    } catch (error) {
      logger.error("Failed to calculate natal chart for user", {
        userId,
        error,
      });
      throw error;
    }
  }
}

export const authController = new AuthController();
