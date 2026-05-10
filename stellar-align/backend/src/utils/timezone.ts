import { find } from "geo-tz";
import { DateTime } from "luxon";
import logger from "../config/logger";

/**
 * Resolves a timezone from coordinates (latitude and longitude).
 * Returns the first matching timezone or "UTC" as a fallback.
 */
export function getTimezoneFromCoords(lat: number, lon: number): string {
  try {
    const tzs = find(lat, lon);
    if (tzs && tzs.length > 0) {
      return tzs[0];
    }
    return "UTC";
  } catch (error) {
    logger.error("Failed to resolve timezone from coordinates", { lat, lon, error });
    return "UTC";
  }
}

/**
 * Returns a list of all IANA timezones supported by the system.
 */
export function getAllTimezones(): string[] {
  try {
    // In Node.js, we can use Intl.supportedValuesOf if available (Node 18+)
    if (typeof (Intl as any).supportedValuesOf === "function") {
      return (Intl as any).supportedValuesOf("timeZone");
    }
    
    // Fallback for older environments: this is a subset or you might need a library
    // But since we are on modern Node, Intl should work.
    return ["UTC"]; 
  } catch (error) {
    return ["UTC"];
  }
}

/**
 * Validates and potentially corrects a timezone string based on coordinates.
 */
export function validateTimezone(lat?: number, lon?: number, providedTz?: string): string {
  if (lat != null && lon != null) {
    const resolvedTz = getTimezoneFromCoords(lat, lon);
    
    // If no timezone was provided, use the resolved one
    if (!providedTz) return resolvedTz;
    
    // If resolved timezone is different from provided, log a warning but prefer resolved for accuracy
    // (Astrology requires the actual physical location's timezone)
    if (providedTz !== resolvedTz) {
      logger.warn("Timezone mismatch detected. Overriding provided TZ with resolved TZ for accuracy.", {
        provided: providedTz,
        resolved: resolvedTz,
        lat,
        lon
      });
      return resolvedTz;
    }
  }

  return providedTz || "UTC";
}

/**
 * Returns the UTC offset in hours for a given timezone and date.
 */
export function getTimezoneOffset(timezone: string, date: Date = new Date()): number {
  try {
    const dt = DateTime.fromJSDate(date).setZone(timezone);
    return dt.offset / 60;
  } catch (error) {
    return 0;
  }
}

