import { db } from '../../db/pool.js';
import { logger } from '../../utils/logger.js';

async function withAccountLock(socialAccountId, run) {
  const key = String(socialAccountId);
  await db.query('SELECT pg_advisory_lock(hashtext($1));', [key]);

  try {
    return await run();
  } finally {
    await db.query('SELECT pg_advisory_unlock(hashtext($1));', [key]);
  }
}

async function updateTaskState(taskId, updates) {
  const status = updates.status;
  const completed = updates.completed || false;
  const lastError = updates.lastError || null;
  const attempts = updates.attempts || 0;
  const processedBy = updates.processedBy || null;

  await db.query(
    `
      UPDATE automation_tasks
      SET status = $2,
          attempts = GREATEST(attempts, $3),
          processed_by = COALESCE($4, processed_by),
          updated_at = NOW(),
          completed_at = CASE WHEN $5 THEN NOW() ELSE completed_at END,
          last_error = $6
      WHERE id = $1
    `,
    [taskId, status, attempts, processedBy, completed, lastError]
  );
}

const handlers = {
  async like(data) {
    logger.info('Processing LIKE task', { taskId: data.taskId, target: data.target });
    await new Promise((resolve) => setTimeout(resolve, 120));
  },
  async comment(data) {
    logger.info('Processing COMMENT task', { taskId: data.taskId, target: data.target });
    await new Promise((resolve) => setTimeout(resolve, 180));
  },
  async follow(data) {
    logger.info('Processing FOLLOW task', { taskId: data.taskId, target: data.target });
    await new Promise((resolve) => setTimeout(resolve, 150));
  },
  async post(data) {
    logger.info('Processing POST task', { taskId: data.taskId, target: data.target });
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
};

export async function processAutomationJob(job) {
  const { taskId, actionType, socialAccountId } = job.data;

  await updateTaskState(taskId, {
    status: 'processing',
    attempts: job.attemptsMade + 1,
    processedBy: job.queueName
  });

  const handler = handlers[actionType];

  if (!handler) {
    throw new Error(`Unsupported action type: ${actionType}`);
  }

  try {
    await withAccountLock(socialAccountId, async () => {
      await handler(job.data);
    });

    await updateTaskState(taskId, {
      status: 'completed',
      completed: true,
      attempts: job.attemptsMade + 1,
      processedBy: job.queueName
    });

    logger.info('Task finished successfully', {
      taskId,
      actionType,
      queueName: job.queueName,
      attempt: job.attemptsMade + 1
    });
  } catch (error) {
    await updateTaskState(taskId, {
      status: 'failed',
      lastError: error.message,
      attempts: job.attemptsMade + 1,
      processedBy: job.queueName
    });

    logger.error('Task processor error', {
      taskId,
      actionType,
      queueName: job.queueName,
      attempt: job.attemptsMade + 1,
      error: error.message
    });

    throw error;
  }
}
