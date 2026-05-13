import { prisma } from "../config/database";
import logger from "../config/logger";

export const getUserSettings = async (userId: string) => {
  let settings = await prisma.userSettings.findUnique({
    where: { userId }
  });

  if (!settings) {
    // Create default settings if not exists
    settings = await prisma.userSettings.create({
      data: {
        userId,
        chartStyle: "western",
        darkMode: true,
        accentColor: "violet"
      }
    });
  }

  return {
    display: {
      chartStyle: settings.chartStyle,
      defaultDivisionalChart: settings.defaultDivisionalChart,
      darkMode: settings.darkMode,
      accentColor: settings.accentColor
    },
    notifications: {
      dailyReading: {
        enabled: settings.dailyReadingEnabled,
        time: settings.dailyReadingTime
      },
      transitAlerts: {
        enabled: settings.transitAlertsEnabled,
        level: settings.transitAlertsLevel
      },
      compatibilityUpdates: {
        enabled: settings.compatibilityEnabled,
        frequency: settings.compatibilityFreq
      },
      birthdayReminders: {
        enabled: settings.birthdayRemindersEnabled
      }
    },
    privacy: {
      shareBirthData: settings.shareBirthData,
      analytics: settings.analyticsEnabled
    }
  };
};

export const updateUserSettings = async (userId: string, patch: any) => {
  const updateData: any = {};

  if (patch.display) {
    if (patch.display.chartStyle) updateData.chartStyle = patch.display.chartStyle;
    if (patch.display.defaultDivisionalChart) updateData.defaultDivisionalChart = patch.display.defaultDivisionalChart;
    if (patch.display.darkMode !== undefined) updateData.darkMode = patch.display.darkMode;
    if (patch.display.accentColor) updateData.accentColor = patch.display.accentColor;
  }

  if (patch.notifications) {
    if (patch.notifications.dailyReading) {
      if (patch.notifications.dailyReading.enabled !== undefined) updateData.dailyReadingEnabled = patch.notifications.dailyReading.enabled;
      if (patch.notifications.dailyReading.time) updateData.dailyReadingTime = patch.notifications.dailyReading.time;
    }
    if (patch.notifications.transitAlerts) {
      if (patch.notifications.transitAlerts.enabled !== undefined) updateData.transitAlertsEnabled = patch.notifications.transitAlerts.enabled;
      if (patch.notifications.transitAlerts.level) updateData.transitAlertsLevel = patch.notifications.transitAlerts.level;
    }
    if (patch.notifications.compatibilityUpdates) {
      if (patch.notifications.compatibilityUpdates.enabled !== undefined) updateData.compatibilityEnabled = patch.notifications.compatibilityUpdates.enabled;
      if (patch.notifications.compatibilityUpdates.frequency) updateData.compatibilityFreq = patch.notifications.compatibilityUpdates.frequency;
    }
    if (patch.notifications.birthdayReminders) {
      if (patch.notifications.birthdayReminders.enabled !== undefined) updateData.birthdayRemindersEnabled = patch.notifications.birthdayReminders.enabled;
    }
  }

  if (patch.privacy) {
    if (patch.privacy.shareBirthData !== undefined) updateData.shareBirthData = patch.privacy.shareBirthData;
    if (patch.privacy.analytics !== undefined) updateData.analyticsEnabled = patch.privacy.analytics;
  }

  await prisma.userSettings.update({
    where: { userId },
    data: updateData
  });

  // Sync NatalChart zodiacType if chartStyle changed
  if (patch.display?.chartStyle) {
    const zodiacType = patch.display.chartStyle === "vedic" ? "SIDEREAL" : "TROPICAL";
    await prisma.natalChart.updateMany({
      where: { userId },
      data: { zodiacType }
    });
    logger.info(`Synced zodiacType to ${zodiacType} for user ${userId} based on chartStyle change`);
  }

  return getUserSettings(userId);
};
