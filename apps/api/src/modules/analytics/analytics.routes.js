import { Router } from 'express';
import { z } from 'zod';
import { getAnalyticsSummary, getFypContent } from './analytics.service.js';

const querySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional()
});

const fypQuerySchema = querySchema.extend({
  minViews: z.coerce.number().int().positive().optional()
});

export const analyticsRouter = Router();

analyticsRouter.get('/summary', async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);
    const data = await getAnalyticsSummary(req.user.tenantId, query);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

analyticsRouter.get('/fyp', async (req, res, next) => {
  try {
    const query = fypQuerySchema.parse(req.query);
    const data = await getFypContent(req.user.tenantId, query);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
});
