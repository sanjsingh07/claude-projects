import { getPlanetaryPositions } from "./src/services/astrology";
import { DateTime } from "luxon";

async function main() {
  const dates = [
    "2026-05-14T00:00:00Z",
    "2026-05-14T12:00:00Z",
    "2026-05-15T00:00:00Z",
    "2026-05-15T12:00:00Z"
  ];

  for (const d of dates) {
    const dt = DateTime.fromISO(d);
    const tropical: any = await getPlanetaryPositions(dt.toJSDate());
    const sidereal: any = await getPlanetaryPositions(dt.toJSDate(), "LAHIRI");

    console.log(`[${d}] Western Moon: ${tropical.moon.longitude.toFixed(2)}° (${tropical.moon.sign})`);
    console.log(`             Vedic Moon:   ${sidereal.moon.longitude.toFixed(2)}° (${sidereal.moon.sign})`);
  }
}

main().catch(console.error);
