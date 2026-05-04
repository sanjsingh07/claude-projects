export const PLANET_SYMBOLS: Record<string, string> = {
  SUN: "☉", MOON: "☽", MERCURY: "☿", VENUS: "♀", MARS: "♂",
  JUPITER: "♃", SATURN: "♄", URANUS: "♅", NEPTUNE: "♆", PLUTO: "♇",
  CHIRON: "⚷", LILITH: "⚸", NODE: "☊", KETU: "☋",
  ASCENDANT: "ASC", MIDHEAVEN: "MC"
};

export const SIGN_SYMBOLS: Record<string, string> = {
  ARIES: "♈", TAURUS: "♉", GEMINI: "♊", CANCER: "♋",
  LEO: "♌", VIRGO: "♍", LIBRA: "♎", SCORPIO: "♏",
  SAGITTARIUS: "♐", CAPRICORN: "♑", AQUARIUS: "♒", PISCES: "♓"
};

export const ASPECT_SYMBOLS: Record<string, string> = {
  CONJUNCTION: "☌", SEXTILE: "✶", SQUARE: "□",
  TRINE: "△", OPPOSITION: "☍", QUINCUNX: "⚺", QUINTILE: "◊"
};

export const ASPECT_NAMES: Record<string, string> = {
  CONJUNCTION: "conjunction",
  SEXTILE: "sextile",
  SQUARE: "square",
  TRINE: "trine",
  OPPOSITION: "opposition",
  QUINCUNX: "quincunx",
  QUINTILE: "quintile"
};

export function formatOrb(orb: number): string {
  return `${Math.floor(orb)}°${Math.round((orb % 1) * 60).toString().padStart(2, '0')}'`;
}

export function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
