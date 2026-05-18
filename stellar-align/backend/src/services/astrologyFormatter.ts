import { ZodiacSign } from "@prisma/client";

export const formatPlacement = (sign: ZodiacSign, degree: number): string => {
  const signName = sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase();
  return `${signName} ${Math.floor(degree)}°`;
};

export const getSignEmoji = (sign: ZodiacSign): string => {
  const emojis: Record<ZodiacSign, string> = {
    ARIES: "♈",
    TAURUS: "♉",
    GEMINI: "♊",
    CANCER: "♋",
    LEO: "♌",
    VIRGO: "♍",
    LIBRA: "♎",
    SCORPIO: "♏",
    SAGITTARIUS: "♐",
    CAPRICORN: "♑",
    AQUARIUS: "♒",
    PISCES: "♓",
  };
  return emojis[sign] || "";
};

export const getSignBadgeType = (sign: ZodiacSign): "fire" | "water" | "earth" | "air" => {
  const fire: ZodiacSign[] = ["ARIES", "LEO", "SAGITTARIUS"];
  const water: ZodiacSign[] = ["CANCER", "SCORPIO", "PISCES"];
  const earth: ZodiacSign[] = ["TAURUS", "VIRGO", "CAPRICORN"];

  if (water.includes(sign)) return "water";
  if (fire.includes(sign)) return "fire";
  if (earth.includes(sign)) return "earth";
  return "air";
};
