import { calculateNatalChart } from './src/services/astrology';
import { calculateVedicChart } from './src/services/vedicAstrology';

async function verifyCalculation() {
  const birthDate = new Date('1997-08-23T06:00:00+05:30');
  const birthTime = '06:00';
  const latitude = 21.8333;
  const longitude = 75.8333;
  const timezone = 'Asia/Kolkata';

  console.log('=== BIRTH DATA ===');
  console.log('Date: August 23, 1997');
  console.log('Time: 06:00 AM IST');
  console.log('Location: Khandwa, Madhya Pradesh, India (21.83°N, 75.83°E)');
  console.log('');

  const westernChart = await calculateNatalChart(birthDate, birthTime, latitude, longitude, timezone);

  console.log('=== WESTERN (TROPICAL) CHART ===');
  console.log(`Lagna (Asc):  ${westernChart.ascendant.sign.padEnd(10)} ${westernChart.ascendant.signDegree.toFixed(2)}°`);
  console.log(`Sun:          ${westernChart.sun.sign.padEnd(10)} ${westernChart.sun.signDegree.toFixed(2)}°`);
  console.log(`Moon:         ${westernChart.moon.sign.padEnd(10)} ${westernChart.moon.signDegree.toFixed(2)}°`);
  console.log(`Mercury:      ${westernChart.mercury.sign.padEnd(10)} ${westernChart.mercury.signDegree.toFixed(2)}° ${westernChart.mercury.retrograde ? '(R)' : ''}`);
  console.log(`Venus:        ${westernChart.venus.sign.padEnd(10)} ${westernChart.venus.signDegree.toFixed(2)}°`);
  console.log(`Mars:         ${westernChart.mars.sign.padEnd(10)} ${westernChart.mars.signDegree.toFixed(2)}°`);
  console.log(`Jupiter:      ${westernChart.jupiter.sign.padEnd(10)} ${westernChart.jupiter.signDegree.toFixed(2)}° ${westernChart.jupiter.retrograde ? '(R)' : ''}`);
  console.log(`Saturn:       ${westernChart.saturn.sign.padEnd(10)} ${westernChart.saturn.signDegree.toFixed(2)}° ${westernChart.saturn.retrograde ? '(R)' : ''}`);
  console.log(`Rahu (Node):  ${westernChart.node.sign.padEnd(10)} ${westernChart.node.signDegree.toFixed(2)}°`);
  console.log('');

  const vedicChart = await calculateVedicChart({
    date: birthDate,
    time: birthTime,
    latitude,
    longitude,
    timezone,
    ayanamsa: 'lahiri',
  }, westernChart);

  console.log('=== VEDIC (SIDEREAL) CHART ===');
  console.log(`Ayanamsa: ${vedicChart.ayanamsa.toFixed(4)}°`);
  console.log('');
  console.log(`Lagna (Asc):  ${vedicChart.d1.ascendant.toString().padEnd(10)} ${vedicChart.d1.ascendantDegree}°`);
  vedicChart.d1.planetaryPositions.forEach(p => {
    const planetName = p.planet.charAt(0).toUpperCase() + p.planet.slice(1).padEnd(8);
    console.log(`${planetName} ${p.sign.padEnd(10)} ${p.degree}°`);
  });
  console.log('');
  console.log(`Moon Nakshatra: ${vedicChart.nakshatras.moon.name} Pada ${vedicChart.nakshatras.moon.pada} (${vedicChart.nakshatras.moon.lord})`);
  console.log('');

  // Verification
  console.log('=== VERIFICATION ===');
  console.log('Western (Tropical) positions are calculated using astronomia library.');
  console.log('Vedic (Sidereal) positions are derived by subtracting Lahiri ayanamsa (~24°) from tropical longitudes.');
  console.log('');
  console.log('Note: The expected values provided may use different calculation methods or ayanamsa values.');
  console.log('Our calculations use standard Lahiri ayanamsa (23.85° base + precession).');
}

verifyCalculation();
