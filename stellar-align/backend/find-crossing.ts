import { getPlanetaryPositions } from "./src/services/astrology";
import { DateTime } from "luxon";

async function main() {
  const findCrossing = async (start: DateTime, system: any) => {
    let current = start;
    // Check every hour for 48 hours
    for (let i = 0; i < 48; i++) {
      const pos: any = await getPlanetaryPositions(current.toJSDate(), system);
      if (pos.moon.sign === "ARIES") {
        return current;
      }
      current = current.plus({ hours: 1 });
    }
    return null;
  };

  const westernCross = await findCrossing(DateTime.fromISO("2026-05-12T00:00:00Z"), undefined);
  const vedicCross = await findCrossing(DateTime.fromISO("2026-05-13T00:00:00Z"), "LAHIRI");

  console.log("EXACT CROSSING TIMES (UTC):");
  console.log("Western Moon enters Aries:", westernCross?.toISO());
  console.log("Vedic Moon enters Aries:  ", vedicCross?.toISO());
}

main().catch(console.error);
