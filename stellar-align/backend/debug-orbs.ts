import { getPlanetaryPositions, getOrb } from "./src/services/astrology";
import { DateTime } from "luxon";

async function main() {
  const startDate = DateTime.fromISO("2026-05-10T00:00:00Z");
  
  console.log("Checking Sun-Jupiter Sextile (60°) and Venus-Mars Sextile (60°)");
  
  for (let i = 0; i < 6; i++) {
    const date = startDate.plus({ days: i });
    const pos: any = await getPlanetaryPositions(date.toJSDate());
    
    const sunJupOrb = getOrb(pos.sun.longitude, pos.jupiter.longitude, 60);
    const venMarsOrb = getOrb(pos.venus.longitude, pos.mars.longitude, 60);
    
    console.log(`[${date.toFormat("dd LLL")}] Sun-Jup Orb: ${sunJupOrb.toFixed(4)}°, Ven-Mars Orb: ${venMarsOrb.toFixed(4)}°`);
    console.log(`        Sun: ${pos.sun.longitude.toFixed(2)}°, Jup: ${pos.jupiter.longitude.toFixed(2)}°, Ven: ${pos.venus.longitude.toFixed(2)}°, Mars: ${pos.mars.longitude.toFixed(2)}°`);
  }
}

main().catch(console.error);
