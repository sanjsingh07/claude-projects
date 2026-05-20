import { Queue, QueueEvents, ConnectionOptions } from "bullmq";
import logger from "./logger";

const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
  maxRetriesPerRequest: null, // Required by BullMQ
};

export const HOROSCOPE_QUEUE_NAME = "horoscope-generation";
export const CHART_QUEUE_NAME = "chart-generation";

export const horoscopeQueue = new Queue(HOROSCOPE_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const chartQueue = new Queue(CHART_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 5, // More attempts for critical chart generation
    backoff: {
      type: "exponential",
      delay: 10000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const horoscopeQueueEvents = new QueueEvents(HOROSCOPE_QUEUE_NAME, {
  connection,
});

export const chartQueueEvents = new QueueEvents(CHART_QUEUE_NAME, {
  connection,
});

horoscopeQueueEvents.on("completed", ({ jobId }) => {
  logger.info(`Horoscope Job ${jobId} completed successfully`);
});

horoscopeQueueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error(`Horoscope Job ${jobId} failed`, { failedReason });
});

chartQueueEvents.on("completed", ({ jobId }) => {
  logger.info(`Chart Job ${jobId} completed successfully`);
});

chartQueueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error(`Chart Job ${jobId} failed`, { failedReason });
});

export { connection };
