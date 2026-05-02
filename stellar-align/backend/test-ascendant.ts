import { DateTime } from 'luxon';
import * as julian from 'astronomia/julian';

// Test: 23/08/1997, 06:00 AM, Khandwa, Madhya Pradesh, India
const birthDate = new Date('1997-08-23T06:00:00+05:30');
const birthTime = '06:00';
const latitude = 21.8333;
const longitude = 75.8333;
const timezone = 'Asia/Kolkata';

console.log('Birth date (ISO):', birthDate.toISOString());
console.log('Birth time:', birthTime);

const timeParts = birthTime.split(':').map(Number);
const dateTime = DateTime.fromJSDate(birthDate, { zone: timezone })
  .set({ hour: timeParts[0] || 0, minute: timeParts[1] || 0, second: 0 })
  .toUTC();

console.log('DateTime (UTC):', dateTime.toISO());
console.log('Year:', dateTime.year);
console.log('Month:', dateTime.month);
console.log('Day:', dateTime.day);
console.log('Hour:', dateTime.hour);
console.log('Minute:', dateTime.minute);

const jd = julian.CalendarGregorianToJD(
  dateTime.year,
  dateTime.month,
  dateTime.day + dateTime.hour / 24 + dateTime.minute / 1440 + dateTime.second / 86400
);

console.log('Julian Date:', jd);

// Calculate sidereal time and ascendant
const T = (jd - 2451545.0) / 36525;
let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000;
gmst = ((gmst % 360) + 360) % 360;

console.log('GMST:', gmst.toFixed(2), '°');

const lst = ((gmst + longitude) % 360 + 360) % 360;
console.log('LST:', lst.toFixed(2), '°');

// Ram (RA of MC) in radians
const RAMC = (lst * Math.PI) / 180;
const eps = (23.439291 * Math.PI) / 180; // obliquity
const lat = (latitude * Math.PI) / 180;

// Midheaven
let mc = (Math.atan2(Math.sin(RAMC), Math.cos(RAMC) * Math.cos(eps)) * 180) / Math.PI;
mc = ((mc % 360) + 360) % 360;
console.log('MC (tropical):', mc.toFixed(2), '°');

// Ascendant
const y = Math.sin(RAMC);
const x = -Math.cos(RAMC) * Math.cos(eps) - Math.tan(lat) * Math.cos(eps);
let asc = (Math.atan2(y, x) * 180) / Math.PI;
asc = ((asc % 360) + 360) % 360;
console.log('Ascendant (tropical):', asc.toFixed(2), '°');

// Convert to sign
const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
console.log('MC sign:', signs[Math.floor(mc / 30) % 12], mc % 30);
console.log('Ascendant sign:', signs[Math.floor(asc / 30) % 12], asc % 30);

// Sidereal ascendant (with ayanamsa ~24°)
const ayanamsa = 24.08;
const siderealAsc = ((asc - ayanamsa) % 360 + 360) % 360;
console.log('');
console.log('Sidereal Ascendant:', siderealAsc.toFixed(2), '°');
console.log('Sidereal Ascendant sign:', signs[Math.floor(siderealAsc / 30) % 12], siderealAsc % 30);
