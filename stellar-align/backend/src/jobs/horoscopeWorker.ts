import { Worker, Job } from "bullmq";
import { connection, HOROSCOPE_QUEUE_NAME } from "../config/queue";
import { astrologyService } from "../services/astrology";
import { prisma } from "../config/database";
import logger from "../config/logger";
import { DateTime } from "luxon";

interface HoroscopeJobData {
  userId?: string;
  date?: Date;
  isBulk?: boolean;
}

export const horoscopeWorker = new Worker<HoroscopeJobData>(
  HOROSCOPE_QUEUE_NAME,
  async (job: Job<HoroscopeJobData>) => {
    try {
      if (job.name === "enqueue-daily-horoscopes") {
        logger.info("Running scheduled daily horoscope enqueuer");
        const result = await enqueueDailyHoroscopes();
        return { success: true, ...result };
      }

      const { userId, date } = job.data;
      
      if (!userId || !date) {
        throw new Error(`Missing required job data: userId=${userId}, date=${date}`);
      }

      logger.info(`Starting horoscope generation for user ${userId} on date ${date}`);
      
      // Ensure date is start of day UTC
      const targetDate = DateTime.fromJSDate(new Date(date)).toUTC().startOf("day").toJSDate();
      
      await astrologyService.generateDailyHoroscope(userId, targetDate);
      
      return { success: true, userId, date: targetDate };
    } catch (error: any) {
      logger.error(`Failed to process job ${job.name} (ID: ${job.id})`, {
        error: error.message,
        jobId: job.id,
        userId: job.data.userId
      });
      throw error;
    }
  },
  { connection }
);

// Master job to enqueue all users
export async function enqueueDailyHoroscopes(date?: Date) {
  const targetDate = date || DateTime.now().toUTC().plus({ days: 1 }).startOf("day").toJSDate();
  
  // Get all active users who have a natal chart
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      isDeleted: false,
      natalChart: { isNot: null },
    },
    select: { id: true },
  });

  logger.info(`Enqueuing horoscopes for ${users.length} users for date ${targetDate.toISOString()}`);

  const jobs = users.map(user => ({
    name: `horoscope-${user.id}-${targetDate.toISOString()}`,
    data: { userId: user.id, date: targetDate, isBulk: true },
  }));

  // Add jobs in chunks to avoid overwhelming Redis
  const chunkSize = 100;
  for (let i = 0; i < jobs.length; i += chunkSize) {
    const chunk = jobs.slice(i, i + chunkSize);
    await (await import("../config/queue")).horoscopeQueue.addBulk(chunk);
  }

  return { enqueued: users.length };
}

horoscopeWorker.on("completed", (job) => {
  logger.info(`Horoscope worker: Job ${job.id} completed`);
});

horoscopeWorker.on("failed", (job, err) => {
  logger.error(`Horoscope worker: Job ${job?.id} failed`, { error: err.message });
});
