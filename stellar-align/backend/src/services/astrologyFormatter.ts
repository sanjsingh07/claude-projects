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

export const getSignBadgeType = (sign: ZodiacSign): "accent" | "pink" | "default" => {
  // Logic to determine badge color based on sign element or just hardcoded examples
  const fire: ZodiacSign[] = ["ARIES", "LEO", "SAGITTARIUS"];
  const water: ZodiacSign[] = ["CANCER", "SCORPIO", "PISCES"];

  if (water.includes(sign)) return "pink";
  if (fire.includes(sign)) return "accent";
  return "default";
};
