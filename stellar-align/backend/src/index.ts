import "dotenv/config";
import app from "./app";
import { env } from "./config/env";
import { checkDatabaseHealth, disconnectDatabase } from "./config/database";
import logger from "./config/logger";
import { redis } from "./config/redis";
import { horoscopeQueue } from "./config/queue";
import { horoscopeWorker } from "./jobs/horoscopeWorker";

const PORT = parseInt(env.PORT);

// Graceful shutdown handler
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  try {
    // Stop worker
    await horoscopeWorker.close();
    logger.info("Horoscope worker closed");

    // Close queue
    await horoscopeQueue.close();
    logger.info("Horoscope queue closed");

    // Close Redis connections
    await redis.quit();
    logger.info("Redis connections closed");

    // Disconnect from database
    await disconnectDatabase();

    logger.info("Graceful shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown", { error });
    process.exit(1);
  }
}

// Health check interval
async function runHealthCheck(): Promise<void> {
  const healthy = await checkDatabaseHealth();
  if (!healthy) {
    logger.error("Database health check failed");
  }
}

// Set up health check interval
setInterval(runHealthCheck, 30000);

// Set up signal handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Initialize background jobs
async function initJobs(): Promise<void> {
  try {
    // Remove existing repeatable jobs to avoid duplicates on restart
    const repeatableJobs = await horoscopeQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await horoscopeQueue.removeRepeatableByKey(job.key);
    }

    // Schedule daily horoscope generation at 03:00 UTC
    await horoscopeQueue.add(
      "enqueue-daily-horoscopes",
      {},
      {
        repeat: { pattern: "0 3 * * *" },
        jobId: "daily-horoscope-scheduler",
      }
    );

    logger.info("Background jobs initialized and scheduled");
  } catch (error) {
    logger.error("Failed to initialize background jobs", { error });
  }
}

// Start server
async function startServer(): Promise<void> {
  try {
    // Verify database connection
    const healthy = await checkDatabaseHealth();
    if (!healthy) {
      throw new Error("Database health check failed on startup");
    }
    logger.info("Database connected");

    // Initialize jobs
    await initJobs();

    // Start HTTP server
    const server = app.listen(PORT, "0.0.0.0", () => {
      logger.info(`Server running on http://0.0.0.0:${PORT} in ${env.NODE_ENV} mode`);
    });

    // Handle server errors
    server.on("error", (error: Error) => {
      logger.error("Server error", { error: error.message });
      process.exit(1);
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

// Run startup
startServer();
