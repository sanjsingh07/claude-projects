import { prisma } from "./src/config/database";
import { astrologyService } from "./src/services/astrology";

async function calculateChart() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'dsadsa@gmail.com' },
    });

    if (!user || !user.birthLatitude || !user.birthLongitude) {
      console.log('User not found or missing birth data');
      return;
    }

    console.log('Calculating chart for:', user.email, {
      birthDate: user.birthDate,
      birthTime: user.birthTime,
      birthLatitude: user.birthLatitude,
      birthLongitude: user.birthLongitude,
      birthTimezone: user.birthTimezone,
    });

    const timeStr = user.birthTime 
      ? user.birthTime.toISOString().slice(11, 16)
      : "12:00";

    console.log('Time string:', timeStr);

    const chartData = await astrologyService.calculateNatalChart(
      user.birthDate,
      timeStr,
      user.birthLatitude,
      user.birthLongitude,
      user.birthTimezone || "UTC",
    );

    console.log('Chart calculated! Sun:', chartData.sun.sign, 'Moon:', chartData.moon.sign, 'Rising:', chartData.ascendant?.sign);

    // Prepare planetary positions array
    const planets = [
      "sun", "moon", "mercury", "venus", "mars", "jupiter", 
      "saturn", "uranus", "neptune", "pluto", "chiron", 
      "lilith", "node", "ascendant", "midheaven"
    ];

    const planetaryPositionsData = planets.map(p => {
      const pos = (chartData as any)[p];
      return {
        planet: p.toUpperCase(),
        sign: pos.sign,
        longitude: pos.longitude,
        latitude: pos.latitude,
        distance: pos.distance,
        speed: pos.speed || 0,
        degree: pos.degree,
        minute: pos.minute,
        house: pos.house,
        retrograde: pos.retrograde || false,
      };
    });

    const housesData = chartData.houses.map(h => ({
      house: h.house,
      sign: h.sign,
      longitude: h.longitude,
      degree: h.degree,
      minute: h.minute,
    }));

    const aspectsData = chartData.aspects.map(a => ({
      planet1: a.planet1,
      planet2: a.planet2,
      type: a.type,
      angle: a.angle,
      orb: a.orb,
      applying: a.applying,
    }));

    // Delete existing chart
    await prisma.natalChart.deleteMany({
      where: { userId: user.id },
    });

    // Save complete chart with all planetary positions
    await prisma.natalChart.create({
      data: {
        userId: user.id,
        sunSign: chartData.sun.sign,
        moonSign: chartData.moon.sign,
        risingSign: chartData.ascendant?.sign || null,
        houseSystem: "PLACIDUS",
        calculationMethod: "swiss_ephemeris",
        calculatedAt: new Date(),
        planetaryPositions: {
          create: planetaryPositionsData,
        },
        houses: {
          create: housesData,
        },
        aspects: {
          create: aspectsData,
        },
      },
    });

    console.log('Complete chart saved with all planets!');
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

calculateChart();
