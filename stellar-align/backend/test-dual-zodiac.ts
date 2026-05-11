import { getTransitsForPeriod } from "./src/services/transits/transitEngine";
import { DateTime } from "luxon";

async function main() {
  const mockNatal = {
    planetaryPositions: [],
    ayanamsa: "LAHIRI"
  };

  const startDate = new Date("2026-05-10T00:00:00Z");
  console.log("--- DUAL ZODIAC TEST (MAY 10-17, 2026) ---");
  const result = await getTransitsForPeriod(mockNatal, "week", startDate);
  
  const ingresses = result.transits.filter((t: any) => t.eventKind === "ingress");
  ingresses.forEach((t: any) => {
    console.log(`[${t.date.day} ${t.date.month}] ${t.title} (System: ${t.zodiacSystem})`);
  });

  const skyAspects = result.transits.filter((t: any) => t.eventKind === "sky_aspect").slice(0, 5);
  console.log("\n--- SKY ASPECTS (SAMPLE) ---");
  skyAspects.forEach((t: any) => {
    console.log(`[${t.date.day} ${t.date.month}] ${t.title}`);
  });
}

main().catch(console.error);
