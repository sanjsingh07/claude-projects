import { calculateNatalChart } from './src/services/astrology';
import { DateTime } from 'luxon';
import * as julian from 'astronomia/julian';

async function debugPositions() {
  // User's birth data: 23/08/1997, 06:00 AM, Khandwa, Madhya Pradesh, India
  const birthDate = new Date('1997-08-23T06:00:00+05:30');
  const birthTime = '06:00';
  const latitude = 21.8333;
  const longitude = 75.8333;
  const timezone = 'Asia/Kolkata';

  console.log('=== Debug Planetary Positions ===');
  console.log('Birth Date (local):', birthDate.toISOString());
  console.log('Birth Time:', birthTime);
  console.log('Location: Khandwa, India (21.83°N, 75.83°E)');
  console.log('');

  const chart = await calculateNatalChart(
    birthDate,
    birthTime,
    latitude,
    longitude,
    timezone
  );

  console.log('=== Tropical (Western) Positions ===');
  console.log('Planet\t\tLongitude\tSign\t\tSign Degree');
  console.log('---------------------------------------------------');
  console.log(`Ascendant\t${chart.ascendant.longitude.toFixed(2)}°\t${chart.ascendant.sign}\t${chart.ascendant.signDegree.toFixed(2)}°`);
  console.log(`Sun\t\t${chart.sun.longitude.toFixed(2)}°\t${chart.sun.sign}\t${chart.sun.signDegree.toFixed(2)}°`);
  console.log(`Moon\t\t${chart.moon.longitude.toFixed(2)}°\t${chart.moon.sign}\t${chart.moon.signDegree.toFixed(2)}°`);
  console.log(`Mercury\t\t${chart.mercury.longitude.toFixed(2)}°\t${chart.mercury.sign}\t${chart.mercury.signDegree.toFixed(2)}°`);
  console.log(`Venus\t\t${chart.venus.longitude.toFixed(2)}°\t${chart.venus.sign}\t${chart.venus.signDegree.toFixed(2)}°`);
  console.log(`Mars\t\t${chart.mars.longitude.toFixed(2)}°\t${chart.mars.sign}\t${chart.mars.signDegree.toFixed(2)}°`);
  console.log(`Jupiter\t\t${chart.jupiter.longitude.toFixed(2)}°\t${chart.jupiter.sign}\t${chart.jupiter.signDegree.toFixed(2)}°`);
  console.log(`Saturn\t\t${chart.saturn.longitude.toFixed(2)}°\t${chart.saturn.sign}\t${chart.saturn.signDegree.toFixed(2)}°`);
  console.log('');

  // Check what sidereal positions would be with Lahiri ayanamsa
  const jd = julian.CalendarGregorianToJD(1997, 8, 23.25);
  const T = (jd - 2451545.0) / 36525;
  const ayanamsa = 23.85 + (T * 1.3969444) + (0.00000036 * Math.pow(T * 36525, 2));
  
  console.log('=== Sidereal (Vedic) Positions (with ~24° ayanamsa) ===');
  console.log(`Ayanamsa: ${ayanamsa.toFixed(4)}°`);
  console.log('');
  
  const toSidereal = (lon: number) => ((lon - ayanamsa) % 360 + 360) % 360;
  const getSign = (lon: number) => {
    const signs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    return signs[Math.floor(lon / 30) % 12];
  };
  
  console.log('Planet\t\tTropical Lon\tSidereal Lon\tSidereal Sign');
  console.log('-------------------------------------------------------------------');
  console.log(`Ascendant\t${chart.ascendant.longitude.toFixed(2)}°\t\t${toSidereal(chart.ascendant.longitude).toFixed(2)}°\t\t${getSign(toSidereal(chart.ascendant.longitude))}`);
  console.log(`Sun\t\t${chart.sun.longitude.toFixed(2)}°\t\t${toSidereal(chart.sun.longitude).toFixed(2)}°\t\t${getSign(toSidereal(chart.sun.longitude))}`);
  console.log(`Moon\t\t${chart.moon.longitude.toFixed(2)}°\t\t${toSidereal(chart.moon.longitude).toFixed(2)}°\t\t${getSign(toSidereal(chart.moon.longitude))}`);
  console.log('');
  
  // Expected values from user
  console.log('=== Expected Values ===');
  console.log('Western (Tropical):');
  console.log('  Lagna: Leo, Sun: Leo, Moon: Aries, Mercury: Virgo (R), Venus: Libra, Mars: Scorpio, Jupiter: Aquarius (R), Saturn: Aries (R)');
  console.log('');
  console.log('Vedic (Sidereal):');
  console.log('  Lagna: Leo, Sun: Leo, Moon: Aries, Mercury: Leo (R), Venus: Virgo, Mars: Libra, Jupiter: Capricorn (R), Saturn: Pisces (R), Rahu: Leo');
}

debugPositions();
