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
        risingSign: chartData.ascendant?.sign || "unknown",
        planetaryPositions: {
          sun: chartData.sun,
          moon: chartData.moon,
          mercury: chartData.mercury,
          venus: chartData.venus,
          mars: chartData.mars,
          jupiter: chartData.jupiter,
          saturn: chartData.saturn,
          uranus: chartData.uranus,
          neptune: chartData.neptune,
          pluto: chartData.pluto,
          chiron: chartData.chiron,
          lilith: chartData.lilith,
          node: chartData.node,
          ascendant: chartData.ascendant,
          midheaven: chartData.midheaven,
        } as any,
        houses: chartData.houses as any,
        aspects: chartData.aspects as any,
        chartPattern: null,
        houseSystem: "placidus",
        calculationMethod: "astronomia",
        calculatedAt: new Date(),
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
