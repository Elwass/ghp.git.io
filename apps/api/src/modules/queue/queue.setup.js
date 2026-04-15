import { Queue, QueueEvents } from 'bullmq';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export const queueConnection = {
  url: env.redisUrl
};

export const automationQueue = new Queue('automation.tasks', {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 200,
    removeOnFail: 1000
  }
});

export const automationQueueEvents = new QueueEvents('automation.tasks', {
  connection: queueConnection
});

automationQueueEvents.on('completed', ({ jobId }) => {
  logger.info('Automation task completed', { jobId, queue: 'automation.tasks' });
});

automationQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error('Automation task failed', {
    jobId,
    queue: 'automation.tasks',
    failedReason
  });
});

export async function addAutomationTask(payload) {
  const jobName = `automation.${payload.actionType}`;

  return automationQueue.add(jobName, payload, {
    jobId: payload.taskId,
    delay: payload.delayMs ?? 0,
    priority: payload.priority ?? 3
  });
}
