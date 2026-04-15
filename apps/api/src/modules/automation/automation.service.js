import { db } from '../../db/pool.js';
import { enqueueAutomationTask, resolveQueueName } from '../queue/queue.js';
import { logger } from '../../utils/logger.js';

export async function createAutomationTask(tenantId, createdBy, payload) {
  const queueName = resolveQueueName(payload.socialAccountId);

  const result = await db.query(
    `
    INSERT INTO automation_tasks (
      id,
      tenant_id,
      social_account_id,
      action_type,
      target,
      comment_text,
      schedule_at,
      run_at,
      queue_name,
      priority,
      status,
      created_by,
      metadata
    )
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, COALESCE($6, NOW()), $7, $8, 'queued', $9, $10)
    RETURNING *
    `,
    [
      tenantId,
      payload.socialAccountId,
      payload.actionType,
      payload.target,
      payload.commentText || null,
      payload.scheduleAt || null,
      queueName,
      payload.priority || 3,
      createdBy,
      payload.metadata || {}
    ]
  );

  const task = result.rows[0];
  const delayMs = payload.scheduleAt
    ? Math.max(new Date(payload.scheduleAt).getTime() - Date.now(), 0)
    : 0;

  await enqueueAutomationTask({
    taskId: task.id,
    tenantId: task.tenant_id,
    socialAccountId: task.social_account_id,
    actionType: task.action_type,
    target: task.target,
    commentText: task.comment_text,
    metadata: task.metadata,
    queueName: task.queue_name,
    delayMs,
    priority: task.priority,
    attempts: 6
  });

  logger.info('Automation task queued', {
    taskId: task.id,
    tenantId: task.tenant_id,
    actionType: task.action_type,
    queueName: task.queue_name,
    delayMs
  });

  return task;
}

export async function listAutomationTasks(tenantId, options = {}) {
  const limit = Math.min(Number(options.limit || 50), 200);
  const offset = Math.max(Number(options.offset || 0), 0);

  const result = await db.query(
    `
    SELECT id, social_account_id, action_type, target, run_at, queue_name, attempts, status, created_at
    FROM automation_tasks
    WHERE tenant_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
    `,
    [tenantId, limit, offset]
  );

  return result.rows;
}
