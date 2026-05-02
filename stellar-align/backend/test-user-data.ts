import { calculateNatalChart } from './src/services/astrology';
import { calculateVedicChart } from './src/services/vedicAstrology';
import { DateTime } from 'luxon';

async function testUserData() {
  // User's birth data: 23/08/1997, 06:00 AM, Khandwa, Madhya Pradesh, India
  // Latitude: 21.8333° N, Longitude: 75.8333° E
  const birthDate = new Date('1997-08-23T06:00:00+05:30');
  const birthTime = '06:00';
  const latitude = 21.8333; // Khandwa, Madhya Pradesh
  const longitude = 75.8333;
  const timezone = 'Asia/Kolkata';

  console.log('=== Birth Data ===');
  console.log('Date: 1997-08-23');
  console.log('Time: 06:00 AM');
  console.log('Location: Khandwa, Madhya Pradesh, India (21.83°N, 75.83°E)');
  console.log('Timezone: Asia/Kolkata (UTC+5:30)');
  console.log('');

  try {
    // Western Chart
    console.log('=== Western (Tropical) Chart ===');
    const westernChart = await calculateNatalChart(
      birthDate,
      birthTime,
      latitude,
      longitude,
      timezone
    );

    console.log('Lagna (Ascendant):', westernChart.ascendant.sign, westernChart.ascendant.signDegree.toFixed(2) + '°');
    console.log('Sun:', westernChart.sun.sign, westernChart.sun.signDegree.toFixed(2) + '°');
    console.log('Moon:', westernChart.moon.sign, westernChart.moon.signDegree.toFixed(2) + '°');
    console.log('Mercury:', westernChart.mercury.sign, westernChart.mercury.signDegree.toFixed(2) + '°', westernChart.mercury.retrograde ? '(R)' : '');
    console.log('Venus:', westernChart.venus.sign, westernChart.venus.signDegree.toFixed(2) + '°');
    console.log('Mars:', westernChart.mars.sign, westernChart.mars.signDegree.toFixed(2) + '°');
    console.log('Jupiter:', westernChart.jupiter.sign, westernChart.jupiter.signDegree.toFixed(2) + '°', westernChart.jupiter.retrograde ? '(R)' : '');
    console.log('Saturn:', westernChart.saturn.sign, westernChart.saturn.signDegree.toFixed(2) + '°', westernChart.saturn.retrograde ? '(R)' : '');
    console.log('Uranus:', westernChart.uranus.sign, westernChart.uranus.signDegree.toFixed(2) + '°');
    console.log('Neptune:', westernChart.neptune.sign, westernChart.neptune.signDegree.toFixed(2) + '°');
    console.log('Pluto:', westernChart.pluto.sign, westernChart.pluto.signDegree.toFixed(2) + '°');
    console.log('Rahu (Mean Node):', westernChart.node.sign, westernChart.node.signDegree.toFixed(2) + '°');
    console.log('');

    // Vedic Chart
    console.log('=== Vedic (Sidereal) Chart ===');
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

    console.log('Ayanamsa used:', vedicChart.ayanamsa.toFixed(4) + '°');
    console.log('');
    console.log('D1 Planetary Positions (Sidereal):');
    console.log('Lagna (Ascendant):', vedicChart.d1.ascendant, vedicChart.d1.ascendantDegree + '°');
    
    vedicChart.d1.planetaryPositions.forEach(p => {
      const planetName = p.planet.charAt(0).toUpperCase() + p.planet.slice(1);
      const retrograde = westernChart[p.planet.toLowerCase() as keyof typeof westernChart]?.retrograde ? '(R)' : '';
      console.log(`${planetName}:`, p.sign, p.degree + '°', retrograde);
    });
    
    console.log('');
    console.log('Moon Nakshatra:', vedicChart.nakshatras.moon.name, 'Pada', vedicChart.nakshatras.moon.pada, 'Lord:', vedicChart.nakshatras.moon.lord);
    
    // Expected values comparison
    console.log('');
    console.log('=== Expected vs Actual (Vedic) ===');
    const expectedVedic = {
      lagna: 'Leo',
      sun: 'Leo',
      moon: 'Aries',
      mercury: 'Leo',
      venus: 'Virgo',
      mars: 'Libra',
      jupiter: 'Capricorn',
      saturn: 'Pisces',
      rahu: 'Leo',
    };
    
    console.log('Expected Lagna:', expectedVedic.lagna, '| Actual:', vedicChart.d1.ascendant);
    console.log('Expected Sun:', expectedVedic.sun, '| Actual:', vedicChart.d1.planetaryPositions.find(p => p.planet === 'sun')?.sign);
    console.log('Expected Moon:', expectedVedic.moon, '| Actual:', vedicChart.d1.planetaryPositions.find(p => p.planet === 'moon')?.sign);
    console.log('Expected Mercury:', expectedVedic.mercury, '| Actual:', vedicChart.d1.planetaryPositions.find(p => p.planet === 'mercury')?.sign);
    console.log('Expected Venus:', expectedVedic.venus, '| Actual:', vedicChart.d1.planetaryPositions.find(p => p.planet === 'venus')?.sign);
    console.log('Expected Mars:', expectedVedic.mars, '| Actual:', vedicChart.d1.planetaryPositions.find(p => p.planet === 'mars')?.sign);
    console.log('Expected Jupiter:', expectedVedic.jupiter, '| Actual:', vedicChart.d1.planetaryPositions.find(p => p.planet === 'jupiter')?.sign);
    console.log('Expected Saturn:', expectedVedic.saturn, '| Actual:', vedicChart.d1.planetaryPositions.find(p => p.planet === 'saturn')?.sign);
    console.log('Expected Rahu:', expectedVedic.rahu, '| Actual:', vedicChart.d1.planetaryPositions.find(p => p.planet === 'node')?.sign);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testUserData();
