import { getTransitsForPeriod } from "./src/services/transits/transitEngine";
import { DateTime } from "luxon";

async function main() {
  const mockNatal = { planetaryPositions: [], ayanamsa: "LAHIRI" };
  const startDate = new Date("2026-05-11T00:00:00Z");
  const result = await getTransitsForPeriod(mockNatal, "week", startDate);
  
  console.log("--- ANALYSIS OF DUAL SYSTEM OUTPUT ---");
  
  const sunJup = result.transits.filter(t => t.title.includes("Sun ✶ Jupiter"));
  console.log("\n1. SKY ASPECTS (Distance based):");
  sunJup.forEach(t => console.log(`   - ${t.title} | Duration: ${t.duration.label}`));
  
  const marsIngress = result.transits.filter(t => t.title.includes("Mars enters Aries"));
  console.log("\n2. INGRESSES (Boundary based):");
  marsIngress.forEach(t => console.log(`   - ${t.title} | Date: ${t.date.day} ${t.date.month}`));
}

main().catch(console.error);
