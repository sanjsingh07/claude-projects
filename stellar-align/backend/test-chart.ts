// Test script to verify chart calculations
import { calculateNatalChart } from './src/services/astrology';
import { calculateVedicChart } from './src/services/vedicAstrology';

async function testChart() {
  // Test with a known birthdate: January 1, 2000, 12:00 PM, New York
  const birthDate = new Date('2000-01-01T12:00:00-05:00');
  const birthTime = '12:00';
  const latitude = 40.7128; // New York
  const longitude = -74.0060;
  const timezone = 'America/New_York';

  console.log('Testing Western Chart Calculation');
  console.log('Birth Date:', birthDate.toISOString());
  console.log('Location: New York (40.71, -74.00)');
  console.log('---');

  try {
    const westernChart = await calculateNatalChart(
      birthDate,
      birthTime,
      latitude,
      longitude,
      timezone
    );

    console.log('\nWestern Chart Results:');
    console.log('Sun:', westernChart.sun.sign, westernChart.sun.signDegree, '°');
    console.log('Moon:', westernChart.moon.sign, westernChart.moon.signDegree, '°');
    console.log('Ascendant:', westernChart.ascendant.sign, westernChart.ascendant.signDegree, '°');
    console.log('Midheaven:', westernChart.midheaven.sign, westernChart.midheaven.signDegree, '°');
    console.log('Mercury:', westernChart.mercury.sign, westernChart.mercury.signDegree, '°');
    console.log('Venus:', westernChart.venus.sign, westernChart.venus.signDegree, '°');
    console.log('Mars:', westernChart.mars.sign, westernChart.mars.signDegree, '°');
    console.log('Jupiter:', westernChart.jupiter.sign, westernChart.jupiter.signDegree, '°');
    console.log('Saturn:', westernChart.saturn.sign, westernChart.saturn.signDegree, '°');

    // Now test Vedic
    console.log('\n---');
    console.log('Testing Vedic Chart Calculation');

    const vedicChart = await calculateVedicChart(
      {
        date: birthDate,
        time: birthTime,
        latitude,
        longitude,
        timezone,
        ayanamsa: 'lahiri',
      },
      westernChart
    );

    console.log('\nVedic Chart Results (Sidereal):');
    console.log('Ayanamsa used:', vedicChart.ayanamsa, '°');
    console.log('D1 Ascendant:', vedicChart.d1.ascendant);
    console.log('D1 Planetary Positions:');
    vedicChart.d1.planetaryPositions.forEach(p => {
      console.log(`  ${p.planet}: ${p.sign} (${p.degree}°)`);
    });
    console.log('Moon Nakshatra:', vedicChart.nakshatras.moon.name, 'Pada', vedicChart.nakshatras.moon.pada);

  } catch (error) {
    console.error('Error:', error);
  }
}

testChart();
