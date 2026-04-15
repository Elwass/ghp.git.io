import { Queue, QueueEvents } from 'bullmq';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export const queueConnection = {
  url: env.redisUrl
};

const SHARD_COUNT = Math.max(env.queueShards, 1);

function simpleHash(input) {
  let hash = 0;

  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function queueNameForShard(shard) {
  return `automation.tasks.${shard}`;
}

export function resolveQueueName(socialAccountId) {
  const shard = simpleHash(String(socialAccountId)) % SHARD_COUNT;
  return queueNameForShard(shard);
}

export const automationQueues = Array.from({ length: SHARD_COUNT }, (_, shard) => {
  const name = queueNameForShard(shard);
  return new Queue(name, {
    connection: queueConnection,
    defaultJobOptions: {
      attempts: 6,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 500,
      removeOnFail: 2000
    }
  });
});

export const automationQueueEvents = automationQueues.map((queue) => {
  const events = new QueueEvents(queue.name, { connection: queueConnection });

  events.on('completed', ({ jobId }) => {
    logger.info('Automation task completed', { queue: queue.name, jobId });
  });

  events.on('failed', ({ jobId, failedReason }) => {
    logger.error('Automation task failed', {
      queue: queue.name,
      jobId,
      failedReason
    });
  });

  return events;
});

export async function addAutomationTask(payload) {
  const queueName = payload.queueName || resolveQueueName(payload.socialAccountId);
  const queue = automationQueues.find((item) => item.name === queueName) || automationQueues[0];

  return queue.add(`automation.${payload.actionType}`, payload, {
    jobId: payload.taskId,
    delay: payload.delayMs ?? 0,
    priority: payload.priority ?? 3,
    attempts: payload.attempts ?? 6
  });
}
