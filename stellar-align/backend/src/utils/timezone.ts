import { find } from "geo-tz";
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
