import { getTransitsForPeriod } from "./src/services/transits/transitEngine";
import { DateTime } from "luxon";

async function main() {
  const mockNatal = {
    zodiacType: "TROPICAL",
    planetaryPositions: [],
    houses: [],
    aspects: []
  };

  // We know Sun sextile Jupiter is active around May 11, 2026.
  // We'll run the forecast for a window starting May 13, 2026.
  // If "Today" is May 11, it should show up on May 11 (Today).
  // But wait, Luxon 'now' will be the ACTUAL current date.
  
  const startDate = new Date("2026-05-10T00:00:00Z");
  console.log("--- PERSISTENCE TEST (MAY 10-17, 2026) ---");
  const result = await getTransitsForPeriod(mockNatal, "week", startDate);
  
  result.transits.forEach((t: any) => {
    console.log(`[${t.date.day} ${t.date.month}] ${t.title}`);
    if (t.duration) {
      console.log(`    Duration: ${t.duration.label}`);
    }
  });
}

main().catch(console.error);
