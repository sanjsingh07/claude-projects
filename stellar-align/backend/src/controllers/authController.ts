import { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
import appleSignin from "apple-signin-auth";
import { DateTime } from "luxon";
import { authService } from "../services/auth.service";
import { chartService } from "../services/chart.service";
import { env } from "../config/env";
import logger from "../config/logger";
import { ApiError } from "../utils/errors";

export class AuthController {
  constructor() {
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.logout = this.logout.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.changePassword = this.changePassword.bind(this);
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
        birthDate: birthDateStr,
        birthTime,
        birthTimezone,
        birthLocationName,
        birthLatitude,
        birthLongitude,
        displayName,
        gender,
      } = req.body;

      let year, month, day;
      
      if (birthDateStr.includes("T")) {
        // If it's an ISO string (likely from an older frontend version), 
        // use luxon to parse it in the target birthTimezone to get the correct local date
        const dt = DateTime.fromISO(birthDateStr, { zone: birthTimezone });
        year = dt.year;
        month = dt.month;
        day = dt.day;
      } else {
        // Assume YYYY-MM-DD format
        const dateParts = birthDateStr.split("-").map(Number);
        year = dateParts[0];
        month = dateParts[1];
        day = dateParts[2];
      }

      let hours = 12;
      let minutes = 0;
      
      if (birthTime && typeof birthTime === 'string' && birthTime.includes(':')) {
        const parts = birthTime.split(':').map(Number);
        if (!isNaN(parts[0]) && !isNaN(parts[1])) {
          hours = parts[0];
          minutes = parts[1];
        }
      }

      const normalizedBirthDateTime = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));

      const result = await authService.register({
        email,
        password,
        birthDateTime: normalizedBirthDateTime,
        birthTimezone,
        birthLocationName,
        birthLatitude: birthLatitude ? parseFloat(birthLatitude) : undefined,
        birthLongitude: birthLongitude ? parseFloat(birthLongitude) : undefined,
        displayName,
        gender,
      });

      // Calculate natal chart via queue (robust & retryable)
      await chartService.enqueueChartCalculation(result.user.id);

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
        data: {
          tokens,
        },
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
}

export const authController = new AuthController();
