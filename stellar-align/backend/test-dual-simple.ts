import { getTransitsForPeriod } from "./src/services/transits/transitEngine";
import { DateTime } from "luxon";

async function main() {
  const mockNatal = {
    planetaryPositions: [],
    ayanamsa: "LAHIRI"
  };

  const startDate = new Date("2026-05-11T00:00:00Z");
  console.log("--- DUAL ZODIAC TEST (MAY 11-12, 2026) ---");
  // Only 2 days to keep it fast
  const result = await getTransitsForPeriod(mockNatal, "week", startDate);
  
  const ingresses = result.transits.filter((t: any) => t.eventKind === "ingress" && t.date.day <= 13);
  ingresses.forEach((t: any) => {
    console.log(`[${t.date.day} ${t.date.month}] ${t.title} (System: ${t.zodiacSystem})`);
  });
}

main().catch(console.error);
