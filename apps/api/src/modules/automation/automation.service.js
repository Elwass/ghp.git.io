import { db } from '../../db/pool.js';
import { enqueueAutomationTask } from '../queue/queue.js';

export async function createAutomationTask(tenantId, createdBy, payload) {
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
      status,
      created_by,
      metadata
    )
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'queued', $7, $8)
    RETURNING *
    `,
    [
      tenantId,
      payload.socialAccountId,
      payload.actionType,
      payload.target,
      payload.commentText || null,
      payload.scheduleAt || null,
      createdBy,
      payload.metadata || {}
    ]
  );

  const task = result.rows[0];

  await enqueueAutomationTask(
    `automation.${task.action_type}`,
    {
      taskId: task.id,
      tenantId: task.tenant_id,
      socialAccountId: task.social_account_id,
      actionType: task.action_type,
      target: task.target,
      commentText: task.comment_text,
      metadata: task.metadata
    },
    {
      delay: payload.scheduleAt
        ? Math.max(new Date(payload.scheduleAt).getTime() - Date.now(), 0)
        : 0,
      jobId: `task:${task.id}`
    }
  );

  return task;
}

export async function listAutomationTasks(tenantId) {
  const result = await db.query(
    `
    SELECT id, social_account_id, action_type, target, schedule_at, status, created_at
    FROM automation_tasks
    WHERE tenant_id = $1
    ORDER BY created_at DESC
    `,
    [tenantId]
  );

  return result.rows;
}
