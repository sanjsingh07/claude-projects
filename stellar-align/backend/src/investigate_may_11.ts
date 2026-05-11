
import { DateTime } from "luxon";
import { getTransitsForPeriod } from "./services/transits/transitEngine";

async function investigate() {
  try {
    // Mock natal chart for a sample user (Aug 23, 1997, 11:30 AM IST)
    const mockNatalChart = {
      zodiacType: "SIDEREAL",
      ayanamsa: "LAHIRI",
      planetaryPositions: [
        { planet: "SUN", sign: "LEO", longitude: 126.5 },
        { planet: "MOON", sign: "ARIES", longitude: 15.2 },
        { planet: "MERCURY", sign: "LEO", longitude: 135.8 },
        { planet: "VENUS", sign: "VIRGO", longitude: 165.2 },
        { planet: "MARS", sign: "LIBRA", longitude: 195.4 },
        { planet: "JUPITER", sign: "AQUARIUS", longitude: 315.2 },
        { planet: "SATURN", sign: "ARIES", longitude: 25.4 },
        { planet: "URANUS", sign: "CAPRICORN", longitude: 285.2 },
        { planet: "NEPTUNE", sign: "CAPRICORN", longitude: 278.4 },
        { planet: "PLUTO", sign: "SCORPIO", longitude: 215.2 },
      ]
    };

    const may11 = DateTime.fromISO("2026-05-11", { zone: "UTC" }).toJSDate();
    
    // Note: getTransitsForPeriod calls getPlanetaryPositions which might require sweph init
    // If it fails due to missing DB/Env, we'll try to bypass
    const transits = await getTransitsForPeriod(mockNatalChart, "week", may11, "UTC");

    console.log("--- APP TRANSITS FOR MAY 11, 2026 ---");
    
    const dayEvents = transits.transits.filter(t => t.date.iso.startsWith("2026-05-11"));
    
    dayEvents.forEach(e => {
        console.log(`[${e.eventKind.toUpperCase()}] ${e.title} (${e.type})`);
        console.log(`  Symbols: ${e.symbols}`);
        console.log(`  Orb: ${e.orb.formatted}`);
    });

    console.log("\n--- UPCOMING REAL-TIME EVENTS (INGRESS/SKY) ---");
    transits.transits
      .filter(t => ['sky_aspect', 'ingress', 'station_retrograde', 'station_direct'].includes(t.eventKind))
      .forEach(e => {
        console.log(`${e.date.month} ${e.date.day}: [${e.eventKind}] ${e.title}`);
      });

    process.exit(0);
  } catch (error) {
    console.error("FAILED:", error);
    process.exit(1);
  }
}

investigate();
