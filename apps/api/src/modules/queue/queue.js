import { Queue } from 'bullmq';
import { env } from '../../config/env.js';

export const connection = {
  url: env.redisUrl
};

export const automationQueue = new Queue('automation.tasks', { connection });

export async function enqueueAutomationTask(jobName, payload, opts = {}) {
  return automationQueue.add(jobName, payload, {
    attempts: opts.attempts ?? 5,
    backoff: opts.backoff ?? { type: 'exponential', delay: 1000 },
    removeOnComplete: opts.removeOnComplete ?? 100,
    removeOnFail: opts.removeOnFail ?? 500,
    delay: opts.delay ?? 0,
    priority: opts.priority ?? 3,
    jobId: opts.jobId
  });
}
