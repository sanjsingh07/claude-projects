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
  const chartStyle = user.settings?.chartStyle || "western";
  
  // Extract city/region/country from birthLocationName (assuming format: "City, Region, Country")
  const locationParts = user.birthLocationName?.split(",") || [];
  const city = locationParts[0]?.trim() || "Unknown";
  const region = locationParts[1]?.trim() || "";
  const country = locationParts[2]?.trim() || "";

  const birthDateTime = DateTime.fromJSDate(user.birthDateTime, { zone: "utc" });
  const formattedDate = birthDateTime.toFormat("LLL d, yyyy");
  
  const birthTime = user.birthTimeUnknown ? "Unknown" : birthDateTime.toFormat("h:mm a");

  const astrology: any = {};
  if (natalChart) {
    let positions: any[] = [];
    let sunSign: ZodiacSign = natalChart.sunSign;
    let moonSign: ZodiacSign = natalChart.moonSign;
    let risingSign: ZodiacSign = natalChart.risingSign;

    if (chartStyle === "vedic" && natalChart.divisionalCharts) {
      const d1 = natalChart.divisionalCharts.find((dc: any) => dc.chartType === "D1");
      if (d1) {
        positions = d1.planetaryPositions;
        sunSign = d1.planetaryPositions.find((p: any) => p.planet === "SUN")?.sign || sunSign;
        moonSign = d1.planetaryPositions.find((p: any) => p.planet === "MOON")?.sign || moonSign;
        risingSign = d1.ascendant || risingSign;
      }
    } else {
      positions = natalChart.planetaryPositions as any;
    }
    
    const findPos = (planet: string) => {
      if (!positions) return null;
      if (Array.isArray(positions)) {
        return positions.find((p: any) => p.planet?.toUpperCase() === planet.toUpperCase());
      }
      // If it's an object, try lowercase and uppercase keys
      return (positions as any)[planet.toLowerCase()] || (positions as any)[planet.toUpperCase()];
    };
    
    const sunPos = findPos("SUN");
    const moonPos = findPos("MOON");
    const ascPos = findPos("ASCENDANT");

    if (sunPos) {
      astrology.sun = {
        sign: sunPos.sign.toLowerCase(),
        degree: sunPos.degree,
        label: formatPlacement(sunPos.sign, sunPos.degree)
      };
    } else if (sunSign) {
        astrology.sun = {
            sign: sunSign.toLowerCase(),
            degree: 0,
            label: sunSign.charAt(0).toUpperCase() + sunSign.slice(1).toLowerCase()
        };
    }
    
    if (moonPos) {
      astrology.moon = {
        sign: moonPos.sign.toLowerCase(),
        degree: moonPos.degree,
        label: formatPlacement(moonPos.sign, moonPos.degree)
      };
    } else if (moonSign) {
        astrology.moon = {
            sign: moonSign.toLowerCase(),
            degree: 0,
            label: moonSign.charAt(0).toUpperCase() + moonSign.slice(1).toLowerCase()
        };
    }
    
    if (risingSign) {
      astrology.rising = {
        sign: risingSign.toLowerCase(),
        degree: ascPos?.degree || 0,
        label: formatPlacement(risingSign, ascPos?.degree || 0)
      };
    }

    ["MERCURY", "VENUS", "MARS"].forEach(p => {
      const pos = findPos(p);
      if (pos) {
        astrology[p.toLowerCase()] = {
          sign: pos.sign.toLowerCase(),
          degree: pos.degree,
          label: formatPlacement(pos.sign, pos.degree)
        };
      }
    });
  }

  const badges: any[] = [];
  if (astrology.sun) {
    badges.push({
      label: `${astrology.sun.sign.charAt(0).toUpperCase() + astrology.sun.sign.slice(1)} Sun`,
      type: getSignBadgeType(astrology.sun.sign.toUpperCase() as any)
    });
  }
  if (astrology.moon) {
    badges.push({
      label: `${astrology.moon.sign.charAt(0).toUpperCase() + astrology.moon.sign.slice(1)} Moon`,
      type: getSignBadgeType(astrology.moon.sign.toUpperCase() as any)
    });
  }
  if (astrology.rising) {
    badges.push({
      label: `${astrology.rising.sign.charAt(0).toUpperCase() + astrology.rising.sign.slice(1)} Rising`,
      type: getSignBadgeType(astrology.rising.sign.toUpperCase() as any)
    });
  }

  return {
    id: user.id,
    name: user.displayName || "User",
    avatarInitial: (user.displayName || "U").charAt(0).toUpperCase(),
    bio: user.bio,
    birthData: {
      date: user.birthDateTime.toISOString(),
      formattedDate,
      time: birthTime,
      isTimeApproximate: user.birthTimeUnknown,
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
