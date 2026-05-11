import { getPlanetaryPositions } from "./src/services/astrology";
import { DateTime } from "luxon";

async function main() {
  const startDate = DateTime.fromISO("2026-05-10T00:00:00Z");
  
  console.log("Checking Sun-Mercury (0°) and Moon Ingress");
  
  for (let i = 0; i < 6; i++) {
    const date = startDate.plus({ days: i });
    const pos: any = await getPlanetaryPositions(date.toJSDate());
    const siderealPos: any = await getPlanetaryPositions(date.toJSDate(), "LAHIRI");
    
    let diff = Math.abs(pos.sun.longitude - pos.mercury.longitude);
    if (diff > 180) diff = 360 - diff;
    
    console.log(`[${date.toFormat("dd LLL")}] Sun-Merc Orb: ${diff.toFixed(4)}°`);
    console.log(`        Tropical Moon: ${pos.moon.longitude.toFixed(2)}° (${pos.moon.sign})`);
    console.log(`        Sidereal Moon: ${siderealPos.moon.longitude.toFixed(2)}° (${siderealPos.moon.sign})`);
  }
}

main().catch(console.error);
