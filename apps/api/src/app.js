import express from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { accountsRouter } from './modules/accounts/accounts.routes.js';
import { automationRouter } from './modules/automation/automation.routes.js';
import { authenticate } from './middleware/authenticate.js';
import { errorHandler } from './utils/http-error.js';

export const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/accounts', authenticate, accountsRouter);
app.use('/api/v1/automation', authenticate, automationRouter);

app.use(errorHandler);
