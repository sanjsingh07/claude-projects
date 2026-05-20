import { Worker, Job } from "bullmq";
import { connection, CHART_QUEUE_NAME } from "../config/queue";
import { chartService } from "../services/chart.service";
import logger from "../config/logger";

interface ChartJobData {
  userId: string;
}

export const chartWorker = new Worker<ChartJobData>(
  CHART_QUEUE_NAME,
  async (job: Job<ChartJobData>) => {
    const { userId } = job.data;
    
    try {
      logger.info(`Processing chart calculation job ${job.id} for user ${userId}`);
      await chartService.calculateAllChartsForUser(userId);
      return { success: true, userId };
    } catch (error: any) {
      logger.error(`Chart worker failed for user ${userId}`, {
        error: error.message,
        jobId: job.id
      });
      throw error; // Let BullMQ handle retries
    }
  },
  { connection }
);

chartWorker.on("completed", (job) => {
  logger.info(`Chart worker: Job ${job.id} completed successfully`);
});

chartWorker.on("failed", (job, err) => {
  logger.error(`Chart worker: Job ${job?.id} failed after attempts`, { 
    error: err.message,
    attempts: job?.attemptsMade
  });
});