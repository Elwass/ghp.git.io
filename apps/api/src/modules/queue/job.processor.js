import { db } from '../../db/pool.js';
import { logger } from '../../utils/logger.js';

async function markTask(taskId, status, extras = {}) {
  const { lastError = null, completed = false } = extras;

  await db.query(
    `
      UPDATE automation_tasks
      SET status = $2,
          updated_at = NOW(),
          completed_at = CASE WHEN $3 THEN NOW() ELSE completed_at END,
          last_error = $4
      WHERE id = $1
    `,
    [taskId, status, completed, lastError]
  );
}

async function processLikeTask(data) {
  logger.info('Processing LIKE task', { taskId: data.taskId, target: data.target });
  await new Promise((resolve) => setTimeout(resolve, 250));
}

async function processCommentTask(data) {
  logger.info('Processing COMMENT task', {
    taskId: data.taskId,
    target: data.target
  });
  await new Promise((resolve) => setTimeout(resolve, 350));
}

async function processFollowTask(data) {
  logger.info('Processing FOLLOW task', { taskId: data.taskId, target: data.target });
  await new Promise((resolve) => setTimeout(resolve, 250));
}

async function processPostTask(data) {
  logger.info('Processing POST task', {
    taskId: data.taskId,
    target: data.target,
    metadata: data.metadata
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
}

const handlers = {
  like: processLikeTask,
  comment: processCommentTask,
  follow: processFollowTask,
  post: processPostTask
};

export async function processAutomationJob(job) {
  const { taskId, actionType } = job.data;

  await markTask(taskId, 'processing');

  const handler = handlers[actionType];

  if (!handler) {
    throw new Error(`Unsupported action type: ${actionType}`);
  }

  try {
    await handler(job.data);
    await markTask(taskId, 'completed', { completed: true });
    logger.info('Task finished successfully', { taskId, actionType, jobId: job.id });
  } catch (error) {
    await markTask(taskId, 'failed', { lastError: error.message });
    logger.error('Task processor error', {
      taskId,
      actionType,
      jobId: job.id,
      error: error.message
    });
    throw error;
  }
}
