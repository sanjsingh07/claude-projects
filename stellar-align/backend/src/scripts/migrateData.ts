import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrate() {
  console.log("Starting raw SQL data migration for Enum normalization...");

  // 1. User.authProvider
  console.log("Normalizing User.authProvider...");
  await prisma.$executeRawUnsafe(`
    UPDATE "User" 
    SET "authProvider" = UPPER("authProvider")::"AuthProvider"
    WHERE "authProvider"::text != UPPER("authProvider");
  `);

  // 2. NatalChart
  console.log("Normalizing NatalChart fields...");
  await prisma.$executeRawUnsafe(`
    UPDATE "NatalChart" 
    SET 
      "sunSign" = UPPER("sunSign")::"ZodiacSign",
      "moonSign" = UPPER("moonSign")::"ZodiacSign",
      "risingSign" = CASE 
        WHEN "risingSign" IS NOT NULL THEN UPPER("risingSign")::"ZodiacSign"
        ELSE NULL 
      END,
      "houseSystem" = UPPER("houseSystem")::"HouseSystem",
      "zodiacType" = UPPER("zodiacType")::"ZodiacType",
      "ayanamsa" = UPPER("ayanamsa")::"AyanamsaType"
    WHERE 
      "sunSign"::text != UPPER("sunSign") OR 
      "moonSign"::text != UPPER("moonSign") OR
      ("risingSign" IS NOT NULL AND "risingSign"::text != UPPER("risingSign")) OR
      "houseSystem"::text != UPPER("houseSystem") OR
      "zodiacType"::text != UPPER("zodiacType") OR
      "ayanamsa"::text != UPPER("ayanamsa");
  `);

  // 3. DivisionalChart
  console.log("Normalizing DivisionalChart fields...");
  await prisma.$executeRawUnsafe(`
    UPDATE "DivisionalChart"
    SET 
      "chartType" = UPPER("chartType")::"DivisionalChartType",
      "ascendant" = UPPER("ascendant")::"ZodiacSign"
    WHERE 
      "chartType"::text != UPPER("chartType") OR
      "ascendant"::text != UPPER("ascendant");
  `);

  // 4. DailyHoroscope
  console.log("Normalizing DailyHoroscope fields...");
  // Handle 'unknown' first
  await prisma.$executeRawUnsafe(`
    UPDATE "DailyHoroscope"
    SET "moonSign" = NULL
    WHERE "moonSign"::text = 'unknown' OR "moonSign"::text = 'UNKNOWN';
  `);
  
  await prisma.$executeRawUnsafe(`
    UPDATE "DailyHoroscope"
    SET 
      "moonSign" = CASE 
        WHEN "moonSign" IS NOT NULL THEN UPPER("moonSign")::"ZodiacSign"
        ELSE NULL 
      END,
      "generatedBy" = UPPER("generatedBy")::"GeneratedBy"
    WHERE 
      ("moonSign" IS NOT NULL AND "moonSign"::text != UPPER("moonSign")) OR
      "generatedBy"::text != UPPER("generatedBy");
  `);

  // 5. Friendship
  console.log("Normalizing Friendship status...");
  await prisma.$executeRawUnsafe(`
    UPDATE "Friendship"
    SET "status" = UPPER("status")::"FriendshipStatus"
    WHERE "status"::text != UPPER("status");
  `);

  // 6. ChatMessage
  console.log("Normalizing ChatMessage role...");
  await prisma.$executeRawUnsafe(`
    UPDATE "ChatMessage"
    SET "role" = UPPER("role")::"ChatRole"
    WHERE "role"::text != UPPER("role");
  `);

  console.log("Migration completed successfully.");
}

migrate()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

