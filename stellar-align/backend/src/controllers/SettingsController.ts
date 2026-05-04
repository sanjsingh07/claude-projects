import { Request, Response, NextFunction } from "express";
import * as settingsService from "../services/settingsService";

export class SettingsController {
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.getUserSettings(req.userId!);
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.updateUserSettings(req.userId!, req.body);
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      next(error);
    }
  }
}
