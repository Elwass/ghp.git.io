import { Router } from 'express';
import { z } from 'zod';
import {
  createAutomationTask,
  listAutomationTasks
} from './automation.service.js';

const createTaskSchema = z.object({
  socialAccountId: z.string().uuid(),
  actionType: z.enum(['like', 'comment', 'follow', 'post']),
  target: z.string().min(1),
  commentText: z.string().optional(),
  scheduleAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
  priority: z.number().int().min(1).max(10).optional()
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

export const automationRouter = Router();

automationRouter.get('/tasks', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const rows = await listAutomationTasks(req.user.tenantId, query);
    return res.json({ data: rows, pagination: query });
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
