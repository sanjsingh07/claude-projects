import { ZodiacSign } from "@prisma/client";
import { formatPlacement, getSignBadgeType } from "./astrologyFormatter";
import { DateTime } from "luxon";

export interface UserProfileResponse {
  id: string;
  name: string;
  avatarInitial: string;
  birthData: {
    date: string;
    formattedDate: string;
    time: string;
    isTimeApproximate: boolean;
    place: {
      city: string;
      region: string;
      country: string;
      latitude: number;
      longitude: number;
    };
    timezone: {
      label: string;
      offset: number;
    };
  };
  astrology: {
    sun: { sign: ZodiacSign; degree: number; label: string };
    moon: { sign: ZodiacSign; degree: number; label: string };
    rising: { sign: ZodiacSign; degree: number; label: string };
    mercury?: { sign: ZodiacSign; degree: number; label: string };
    venus?: { sign: ZodiacSign; degree: number; label: string };
    mars?: { sign: ZodiacSign; degree: number; label: string };
  };
  bio?: string;
  badges: Array<{ label: string; type: "accent" | "pink" | "default" }>;
}

export const buildUserProfile = (user: any): UserProfileResponse => {
  const natalChart = user.natalChart;
  
  // Extract city/region/country from birthLocationName (assuming format: "City, Region, Country")
  const locationParts = user.birthLocationName?.split(",") || [];
  const city = locationParts[0]?.trim() || "Unknown";
  const region = locationParts[1]?.trim() || "";
  const country = locationParts[2]?.trim() || "";

  const birthDateTime = DateTime.fromJSDate(user.birthDate);
  const formattedDate = birthDateTime.toFormat("LLL d, yyyy");
  
  // Important: We use { zone: 'utc' } because the database stores the clock time in a UTC field.
  // This prevents the server's local timezone (e.g. IST) from shifting the displayed time.
  const birthTime = user.birthTime ? DateTime.fromJSDate(user.birthTime, { zone: 'utc' }).toFormat("h:mm a") : "12:00 PM";

  const astrology: any = {};
  if (natalChart) {
    const positions = natalChart.planetaryPositions as any;
    
    const findPos = (planet: string) => {
      if (!positions) return null;
      if (Array.isArray(positions)) {
        return positions.find((p: any) => p.planet?.toUpperCase() === planet.toUpperCase());
      }
      // If it's an object, try lowercase and uppercase keys
      return positions[planet.toLowerCase()] || positions[planet.toUpperCase()];
    };
    
    const sunPos = findPos("SUN");
    const moonPos = findPos("MOON");
    const risingSign = natalChart.risingSign;
    const ascPos = findPos("ASCENDANT");

    if (sunPos) {
      astrology.sun = {
        sign: sunPos.sign,
        degree: sunPos.degree,
        label: formatPlacement(sunPos.sign, sunPos.degree)
      };
    }
    
    if (moonPos) {
      astrology.moon = {
        sign: moonPos.sign,
        degree: moonPos.degree,
        label: formatPlacement(moonPos.sign, moonPos.degree)
      };
    }
    
    if (risingSign) {
      astrology.rising = {
        sign: risingSign,
        degree: ascPos?.degree || 0,
        label: formatPlacement(risingSign, ascPos?.degree || 0)
      };
    }

    ["MERCURY", "VENUS", "MARS"].forEach(p => {
      const pos = findPos(p);
      if (pos) {
        astrology[p.toLowerCase()] = {
          sign: pos.sign,
          degree: pos.degree,
          label: formatPlacement(pos.sign, pos.degree)
        };
      }
    });
  }

  const badges: any[] = [];
  if (astrology.sun) {
    badges.push({
      label: `${astrology.sun.sign.charAt(0) + astrology.sun.sign.slice(1).toLowerCase()} Sun`,
      type: getSignBadgeType(astrology.sun.sign)
    });
  }
  if (astrology.moon) {
    badges.push({
      label: `${astrology.moon.sign.charAt(0) + astrology.moon.sign.slice(1).toLowerCase()} Moon`,
      type: getSignBadgeType(astrology.moon.sign)
    });
  }
  if (astrology.rising) {
    badges.push({
      label: `${astrology.rising.sign.charAt(0) + astrology.rising.sign.slice(1).toLowerCase()} Rising`,
      type: getSignBadgeType(astrology.rising.sign)
    });
  }

  return {
    id: user.id,
    name: user.displayName || "User",
    avatarInitial: (user.displayName || "U").charAt(0).toUpperCase(),
    bio: user.bio,
    birthData: {
      date: user.birthDate.toISOString(),
      formattedDate,
      time: birthTime,
      isTimeApproximate: false,
      place: {
        city,
        region,
        country,
        latitude: user.birthLatitude || 0,
        longitude: user.birthLongitude || 0
      },
      timezone: {
        label: user.birthTimezone || "UTC",
        offset: user.birthUtcOffset || 0
      }
    },
    astrology,
    badges
  };
};
