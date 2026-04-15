import { Router } from 'express';
import { z } from 'zod';
import {
  createAutomationTask,
  listAutomationTasks
} from './automation.service.js';

const createTaskSchema = z.object({
  socialAccountId: z.string().uuid(),
  actionType: z.enum(['like', 'comment', 'follow']),
  target: z.string().min(1),
  commentText: z.string().optional(),
  scheduleAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional()
});

export const automationRouter = Router();

automationRouter.get('/tasks', async (req, res, next) => {
  try {
    const rows = await listAutomationTasks(req.user.tenantId);
    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
});

automationRouter.post('/tasks', async (req, res, next) => {
  try {
    const payload = createTaskSchema.parse(req.body);
    const row = await createAutomationTask(req.user.tenantId, req.user.sub, payload);
    return res.status(201).json(row);
  } catch (error) {
    return next(error);
  }
});
