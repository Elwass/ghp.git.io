import { Router } from 'express';
import { z } from 'zod';
import { loginUser, registerUser } from './auth.service.js';

const registerSchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const data = await registerUser(payload);
    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const data = await loginUser(payload);

    if (!data) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json(data);
  } catch (error) {
    return next(error);
  }
});
