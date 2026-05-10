import 'dotenv/config';
import { prisma } from './src/config/database';
import { astrologyService } from './src/services/astrology';
import { ZodiacType, HouseSystem } from '@prisma/client';

async function setupAndTest() {
  const email = 'test@example.com';
  
  // 1. Create User
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: 'dummy',
      birthDate: new Date('1990-01-01'),
      birthTime: new Date('2000-01-01T12:00:00Z'),
      birthLatitude: 40.7128,
      birthLongitude: -74.0060,
      birthTimezone: 'America/New_York',
    }
  });

  console.log(`User created: ${user.id}`);

  // 2. Create Natal Chart
  const chartData = await astrologyService.calculateNatalChart(
    user.birthDateTime!,
    '12:00',
    user.birthLatitude!,
    user.birthLongitude!,
    user.birthTimezone!,
    HouseSystem.PLACIDUS,
    ZodiacType.TROPICAL
  );

  await prisma.natalChart.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      sunSign: chartData.sun.sign,
      moonSign: chartData.moon.sign,
      risingSign: chartData.ascendant.sign,
      planetaryPositions: chartData as any,
      houses: chartData.houses as any,
      aspects: chartData.aspects as any,
      zodiacType: ZodiacType.TROPICAL,
    }
  });

  console.log('Natal chart created.');

  // 3. Generate Horoscope
  const date = new Date('2026-05-04T12:00:00Z');
  const horoscope = await astrologyService.generateDailyHoroscope(user.id, date);
  
  console.log('Horoscope Generated:');
  console.log(`Energy Score: ${horoscope.energyScore}`);
  console.log(`Mood Aspects: ${JSON.stringify(horoscope.moodAspects)}`);
  console.log(`Primary Transit: ${horoscope.primaryTransit.title}`);
  console.log(`Aspects Count: ${horoscope.aspects.length}`);
}

setupAndTest().then(() => process.exit());
