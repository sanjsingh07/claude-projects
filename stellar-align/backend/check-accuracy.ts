import { getTransitsForPeriod } from "./src/services/transits/transitEngine";
import { DateTime } from "luxon";

async function main() {
  const mockNatalSidereal = {
    zodiacType: "SIDEREAL",
    ayanamsa: "LAHIRI",
    planetaryPositions: [],
    houses: [],
    aspects: []
  };
  
  const mockNatalTropical = {
    zodiacType: "TROPICAL",
    planetaryPositions: [],
    houses: [],
    aspects: []
  };

  const startDate = new Date("2026-05-10T00:00:00Z");
  
  console.log("--- SIDEREAL TRANSITS (MAY 10-15, 2026) ---");
  const siderealResult = await getTransitsForPeriod(mockNatalSidereal, "week", startDate);
  siderealResult.transits
    .filter((t: any) => t.date.day >= 10 && t.date.day <= 15)
    .forEach((t: any) => console.log(`[${t.date.day} ${t.date.month}] ${t.title} (${t.eventKind})`));

  console.log("\n--- TROPICAL TRANSITS (MAY 10-15, 2026) ---");
  const tropicalResult = await getTransitsForPeriod(mockNatalTropical, "week", startDate);
  tropicalResult.transits
    .filter((t: any) => t.date.day >= 10 && t.date.day <= 15)
    .forEach((t: any) => console.log(`[${t.date.day} ${t.date.month}] ${t.title} (${t.eventKind})`));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
