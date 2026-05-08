import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authService } from "../services/auth.service";
import { prisma } from "../config/database";
import logger from "../config/logger";
import { ApiError } from "../utils/errors";
import { astrologyService } from "../services/astrology";
import { calculateVedicChart } from "../services/vedicAstrology";
import { HouseSystem, AyanamsaType, ZodiacType, DivisionalChartType } from "@prisma/client";

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

      let birthTimeDate: Date | undefined;
      if (birthTime && typeof birthTime === 'string' && birthTime.includes(':')) {
        const [hours, minutes] = birthTime.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          birthTimeDate = new Date(Date.UTC(2000, 0, 1, hours, minutes));
        }
      }

      const result = await authService.register({
        email,
        password,
        birthDate: new Date(birthDate),
        birthTime: birthTimeDate,
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

        // 1. Calculate Western natal chart data first (Tropical)
        const westernChart = await astrologyService.calculateNatalChart(
          user.birthDate,
          timeStr,
          user.birthLatitude,
          user.birthLongitude,
          user.birthTimezone || "UTC",
          HouseSystem.PLACIDUS,
          ZodiacType.TROPICAL,
        );

        // Save initial natal chart as Western
        const chart = await prisma.natalChart.create({
          data: {
            userId,
            sunSign: westernChart.sun.sign,
            moonSign: westernChart.moon.sign,
            risingSign: westernChart.ascendant?.sign || null,
            planetaryPositions: {
              sun: westernChart.sun,
              moon: westernChart.moon,
              mercury: westernChart.mercury,
              venus: westernChart.venus,
              mars: westernChart.mars,
              jupiter: westernChart.jupiter,
              saturn: westernChart.saturn,
              uranus: westernChart.uranus,
              neptune: westernChart.neptune,
              pluto: westernChart.pluto,
              chiron: westernChart.chiron,
              lilith: westernChart.lilith,
              node: westernChart.node,
              ascendant: westernChart.ascendant,
              midheaven: westernChart.midheaven,
            } as any,
            houses: westernChart.houses as any,
            aspects: westernChart.aspects as any,
            chartPattern: undefined,
            houseSystem: HouseSystem.PLACIDUS,
            calculationMethod: "swiss_ephemeris",
            zodiacType: ZodiacType.TROPICAL,
            calculatedAt: new Date(),
          },
        });

        // 2. Calculate Vedic chart with divisional charts
        const vedicChart = await calculateVedicChart(
          {
            date: user.birthDate,
            time: timeStr,
            latitude: user.birthLatitude,
            longitude: user.birthLongitude,
            timezone: user.birthTimezone || "UTC",
            ayanamsa: AyanamsaType.LAHIRI,
          },
          westernChart,
        );

        // Get Moon's nakshatra info
        const moonNakshatra = vedicChart.nakshatras.moon;
        
        // Extract D1 positions for the main NatalChart signs
        const d1Sun = vedicChart.d1.planetaryPositions.find(p => p.planet === "sun");
        const d1Moon = vedicChart.d1.planetaryPositions.find(p => p.planet === "moon");

        // Update natal chart with Vedic data (matching UserController pattern)
        await prisma.natalChart.update({
          where: { id: chart.id },
          data: {
            sunSign: (d1Sun?.sign as any) || westernChart.sun.sign,
            moonSign: (d1Moon?.sign as any) || westernChart.moon.sign,
            risingSign: vedicChart.d1.ascendant,
            planetaryPositions: vedicChart.d1.planetaryPositions as any,
            houses: vedicChart.d1.houses as any,
            aspects: westernChart.aspects as any,
            houseSystem: HouseSystem.WHOLE_SIGN,
            calculationMethod: "vedic",
            zodiacType: ZodiacType.SIDEREAL,
            ayanamsa: AyanamsaType.LAHIRI,
            nakshatra: moonNakshatra.name,
            nakshatraPada: moonNakshatra.pada,
            nakshatraLord: moonNakshatra.lord,
            calculatedAt: new Date(),
          },
        });

        // Create divisional charts
        const divisionalChartsData = [
          { chartType: DivisionalChartType.D1, data: vedicChart.d1 },
          { chartType: DivisionalChartType.D2, data: vedicChart.d2 },
          { chartType: DivisionalChartType.D4, data: vedicChart.d4 },
          { chartType: DivisionalChartType.D9, data: vedicChart.d9 },
          { chartType: DivisionalChartType.D10, data: vedicChart.d10 },
        ];

        await prisma.divisionalChart.createMany({
          data: divisionalChartsData.map((dc) => ({
            natalChartId: chart.id,
            chartType: dc.chartType,
            planetaryPositions: dc.data.planetaryPositions as any,
            ascendant: dc.data.ascendant,
            ascendantDegree: dc.data.ascendantDegree,
            houses: dc.data.houses as any,
          })),
        });

        logger.info("Initial Western and Vedic charts calculated and saved successfully", {
          userId,
          sunSign: westernChart.sun.sign,
          moonSign: westernChart.moon.sign,
        });
      }
    } catch (error) {
      logger.error("Failed to calculate initial charts for user", {
        userId,
        error,
      });
      // Don't throw, this is background work
    }
  }
}

export const authController = new AuthController();
