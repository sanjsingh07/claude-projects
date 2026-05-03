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

export const horoscopeQueueEvents = new QueueEvents(HOROSCOPE_QUEUE_NAME, {
  connection,
});

horoscopeQueueEvents.on("completed", ({ jobId }) => {
  logger.info(`Job ${jobId} completed successfully`);
});

horoscopeQueueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error(`Job ${jobId} failed`, { failedReason });
});

export { connection };
