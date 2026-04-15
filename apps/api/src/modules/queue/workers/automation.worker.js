import { Worker } from 'bullmq';
import { automationQueues, queueConnection } from '../queue.setup.js';
import { processAutomationJob } from '../job.processor.js';
import { logger } from '../../../utils/logger.js';
import { env } from '../../../config/env.js';

function createWorker(queueName) {
  const worker = new Worker(
    queueName,
    async (job) => {
      logger.info('Worker received job', {
        queue: queueName,
        jobId: job.id,
        actionType: job.data?.actionType,
        attemptsMade: job.attemptsMade
      });

      await processAutomationJob(job);
    },
    {
      connection: queueConnection,
      concurrency: env.workerConcurrency,
      limiter: {
        max: env.workerRateLimitMax,
        duration: env.workerRateLimitDurationMs
      }
    }
  );

  worker.on('completed', (job) => {
    logger.info('Worker marked job completed', {
      queue: queueName,
      jobId: job.id,
      actionType: job.data?.actionType
    });
  });

  worker.on('failed', (job, error) => {
    logger.error('Worker failed job', {
      queue: queueName,
      jobId: job?.id,
      actionType: job?.data?.actionType,
      attemptsMade: job?.attemptsMade,
      attemptsTotal: job?.opts?.attempts,
      willRetry: (job?.attemptsMade ?? 0) < (job?.opts?.attempts ?? 0),
      error: error.message
    });
  });

  logger.info('Automation worker started', {
    queue: queueName,
    concurrency: env.workerConcurrency,
    rateLimitMax: env.workerRateLimitMax,
    rateLimitDurationMs: env.workerRateLimitDurationMs
  });

  return worker;
}

export const automationWorkers = automationQueues.map((queue) => createWorker(queue.name));
