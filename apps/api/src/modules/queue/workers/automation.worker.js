import { Worker } from 'bullmq';
import { queueConnection } from '../queue.setup.js';
import { processAutomationJob } from '../job.processor.js';
import { logger } from '../../../utils/logger.js';

export const automationWorker = new Worker(
  'automation.tasks',
  async (job) => {
    logger.info('Worker received job', {
      queue: 'automation.tasks',
      jobId: job.id,
      actionType: job.data?.actionType,
      attemptsMade: job.attemptsMade
    });

    await processAutomationJob(job);
  },
  {
    connection: queueConnection,
    concurrency: 25
  }
);

automationWorker.on('completed', (job) => {
  logger.info('Worker marked job completed', {
    queue: 'automation.tasks',
    jobId: job.id,
    actionType: job.data?.actionType
  });
});

automationWorker.on('failed', (job, error) => {
  logger.error('Worker failed job', {
    queue: 'automation.tasks',
    jobId: job?.id,
    actionType: job?.data?.actionType,
    attemptsMade: job?.attemptsMade,
    attemptsTotal: job?.opts?.attempts,
    willRetry: (job?.attemptsMade ?? 0) < (job?.opts?.attempts ?? 0),
    error: error.message
  });
});

logger.info('Automation worker started', { queue: 'automation.tasks' });
