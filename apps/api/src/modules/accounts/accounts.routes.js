import { Router } from 'express';
import { z } from 'zod';
import {
  createAccount,
  listAccounts,
  updateAccountStatus
} from './accounts.service.js';

const createAccountSchema = z.object({
  platform: z.enum(['instagram', 'x', 'tiktok', 'linkedin', 'facebook']),
  handle: z.string().min(1),
  loginUsername: z.string().min(1),
  loginPasswordEnc: z.string().min(1)
});

const patchStatusSchema = z.object({
  status: z.enum(['active', 'paused', 'banned'])
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(300).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

export const accountsRouter = Router();

accountsRouter.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const rows = await listAccounts(req.user.tenantId, query);
    return res.json({ data: rows, pagination: query });
  } catch (error) {
    return next(error);
  }
});

accountsRouter.post('/', async (req, res, next) => {
  try {
    const payload = createAccountSchema.parse(req.body);
    const row = await createAccount(req.user.tenantId, payload);
    return res.status(201).json(row);
  } catch (error) {
    return next(error);
  }
});

accountsRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const payload = patchStatusSchema.parse(req.body);
    const row = await updateAccountStatus(req.user.tenantId, req.params.id, payload.status);

    if (!row) {
      return res.status(404).json({ message: 'Account not found' });
    }

    return res.json(row);
  } catch (error) {
    return next(error);
  }
});
