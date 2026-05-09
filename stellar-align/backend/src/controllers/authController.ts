import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import appleSignin from "apple-signin-auth";
import { authService } from "../services/auth.service";
import { prisma } from "../config/database";
import { env } from "../config/env";
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
        const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
        try {
          const ticket = await client.verifyIdToken({
            idToken,
            audience: [
              env.GOOGLE_CLIENT_ID || "",
              // Add other client IDs if necessary (e.g., for different platforms)
            ].filter(Boolean),
          });
          const payload = ticket.getPayload();
          if (!payload || !payload.email) {
            throw new ApiError(401, "Invalid Google token payload", "INVALID_TOKEN");
          }
          email = payload.email;
          providerId = payload.sub;
          displayName = payload.name;
          avatarUrl = payload.picture;
        } catch (error: any) {
          logger.error("Google token verification failed", { error: error.message });
          throw new ApiError(401, `Google token verification failed: ${error.message}`, "INVALID_TOKEN");
        }
      } else if (provider === "apple") {
        try {
          const { sub, email: appleEmail } = await appleSignin.verifyIdToken(idToken, {
            audience: env.APPLE_CLIENT_ID,
            // ignoreExpiration: false, // default is false
          });
          
          if (!appleEmail) {
            throw new ApiError(401, "Apple token missing email", "INVALID_TOKEN");
          }
          
          email = appleEmail;
          providerId = sub;
          displayName = email.split("@")[0]; // Apple doesn't provide name in ID token reliably
        } catch (error: any) {
          logger.error("Apple token verification failed", { error: error.message });
          throw new ApiError(401, `Apple token verification failed: ${error.message}`, "INVALID_TOKEN");
        }
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
            chartPattern: undefined,
            houseSystem: HouseSystem.PLACIDUS,
            calculationMethod: "swiss_ephemeris",
            zodiacType: ZodiacType.TROPICAL,
            calculatedAt: new Date(),
            planetaryPositions: {
              create: Object.entries(westernChart).filter(([k]) => planetsToCalc.includes(k.toUpperCase() as any) || k === "ascendant" || k === "midheaven").map(([k, v]: [string, any]) => ({
                planet: k.toUpperCase(),
                sign: v.sign,
                longitude: v.longitude,
                latitude: v.latitude,
                distance: v.distance,
                speed: v.speed || 0,
                degree: v.degree,
                minute: v.minute,
                house: v.house,
                retrograde: v.retrograde || false,
              })),
            },
            houses: {
              create: westernChart.houses.map((h, i) => ({
                house: i + 1,
                sign: h.sign,
                longitude: h.longitude,
                degree: h.degree,
                minute: h.minute,
              })),
            },
            aspects: {
              create: westernChart.aspects.map(a => ({
                planet1: a.planet1,
                planet2: a.planet2,
                type: a.type,
                angle: a.angle,
                orb: a.orb,
                applying: a.applying,
              })),
            },
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
        await prisma.$transaction([
          prisma.natalPlanetPosition.deleteMany({ where: { natalChartId: chart.id } }),
          prisma.natalHouseCusp.deleteMany({ where: { natalChartId: chart.id } }),
          prisma.divisionalChart.deleteMany({ where: { natalChartId: chart.id } }),
          prisma.natalChart.update({
            where: { id: chart.id },
            data: {
              sunSign: (d1Sun?.sign as any) || westernChart.sun.sign,
              moonSign: (d1Moon?.sign as any) || westernChart.moon.sign,
              risingSign: vedicChart.d1.ascendant,
              houseSystem: HouseSystem.WHOLE_SIGN,
              calculationMethod: "vedic",
              zodiacType: ZodiacType.SIDEREAL,
              ayanamsa: AyanamsaType.LAHIRI,
              nakshatra: moonNakshatra.name,
              nakshatraPada: moonNakshatra.pada,
              nakshatraLord: moonNakshatra.lord,
              calculatedAt: new Date(),
              planetaryPositions: {
                create: vedicChart.d1.planetaryPositions.map(p => ({
                  planet: p.planet.toUpperCase(),
                  sign: p.sign,
                  longitude: 0, // Should be calculated or passed if needed
                  latitude: 0,
                  distance: 0,
                  speed: 0,
                  degree: Math.floor(p.degree),
                  minute: Math.round((p.degree % 1) * 60),
                  house: p.house,
                  retrograde: p.retrograde || false,
                })),
              },
              houses: {
                create: vedicChart.d1.houses.map(h => ({
                  house: h.house,
                  sign: h.sign,
                  longitude: 0,
                  degree: 0,
                  minute: 0,
                })),
              },
            },
          }),
        ]);

        // Create divisional charts
        const divisionalChartsData = [
          { chartType: DivisionalChartType.D1, data: vedicChart.d1 },
          { chartType: DivisionalChartType.D2, data: vedicChart.d2 },
          { chartType: DivisionalChartType.D4, data: vedicChart.d4 },
          { chartType: DivisionalChartType.D9, data: vedicChart.d9 },
          { chartType: DivisionalChartType.D10, data: vedicChart.d10 },
        ];

        for (const dc of divisionalChartsData) {
          await prisma.divisionalChart.create({
            data: {
              natalChartId: chart.id,
              chartType: dc.chartType,
              ascendant: dc.data.ascendant,
              ascendantDegree: dc.data.ascendantDegree,
              planetaryPositions: {
                create: dc.data.planetaryPositions.map(p => ({
                  planet: p.planet.toUpperCase(),
                  sign: p.sign,
                  degree: p.degree,
                  house: p.house,
                  retrograde: p.retrograde || false,
                  combust: p.combust || false,
                })),
              },
              houses: {
                create: dc.data.houses.map(h => ({
                  house: h.house,
                  sign: h.sign,
                  degree: h.degree,
                })),
              },
            },
          });
        }

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
