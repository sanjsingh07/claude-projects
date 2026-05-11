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

  const startDate = new Date("2026-05-10T00:00:00Z");
  const result = await getTransitsForPeriod(mockNatalSidereal, "week", startDate);
  
  console.log("--- SIDEREAL INGRESSES (MAY 10-17, 2026) ---");
  result.transits
    .filter((t: any) => t.eventKind === "ingress")
    .forEach((t: any) => console.log(`[${t.date.day} ${t.date.month}] ${t.title}`));
}

main().catch(console.error);
