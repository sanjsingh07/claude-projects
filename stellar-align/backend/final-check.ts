import { getTransitsForPeriod } from "./src/services/transits/transitEngine";
import { DateTime } from "luxon";

async function main() {
  const mockNatal = { planetaryPositions: [], ayanamsa: "LAHIRI" };
  const startDate = new Date("2026-05-11T00:00:00Z");
  
  console.log("--- FINAL ACCURACY CHECK (MAY 2026) ---");
  const result = await getTransitsForPeriod(mockNatal, "week", startDate);
  
  const relevant = result.transits.filter((t: any) => 
    t.title.includes("Moon enters Aries") || t.title.includes("Mars enters Aries")
  );
  
  relevant.forEach((t: any) => {
    console.log(`[${t.date.day} ${t.date.month}] ${t.title}`);
  });
}

main().catch(console.error);
