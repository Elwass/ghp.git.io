import { Worker } from 'bullmq';
import { connection } from '../queue.js';
import { db } from '../../../db/pool.js';

const worker = new Worker(
  'automation.tasks',
  async (job) => {
    const { taskId } = job.data;

    await db.query(
      `UPDATE automation_tasks SET status = 'processing', updated_at = NOW() WHERE id = $1`,
      [taskId]
    );

    // TODO: Replace with Puppeteer bot execution logic.
    await new Promise((resolve) => setTimeout(resolve, 500));

    await db.query(
      `UPDATE automation_tasks SET status = 'completed', updated_at = NOW(), completed_at = NOW() WHERE id = $1`,
      [taskId]
    );
  },
  { connection, concurrency: 20 }
);

worker.on('failed', async (job, error) => {
  if (!job?.data?.taskId) {
    return;
  }

  await db.query(
    `
    UPDATE automation_tasks
    SET status = 'failed',
        updated_at = NOW(),
        last_error = $2
    WHERE id = $1
    `,
    [job.data.taskId, error.message]
  );
});

console.log('Automation worker started...');
