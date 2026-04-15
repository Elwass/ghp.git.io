# AMOREF Express Backend Blueprint

## Folder Structure

```txt
apps/api/
├── package.json
└── src/
    ├── app.js
    ├── server.js
    ├── config/
    │   └── env.js
    ├── db/
    │   ├── pool.js
    │   └── schema.sql
    ├── middleware/
    │   └── authenticate.js
    ├── modules/
    │   ├── auth/
    │   │   ├── auth.routes.js
    │   │   └── auth.service.js
    │   ├── accounts/
    │   │   ├── accounts.routes.js
    │   │   └── accounts.service.js
    │   ├── automation/
    │   │   ├── automation.routes.js
    │   │   └── automation.service.js
    │   ├── analytics/
    │   │   ├── analytics.routes.js
    │   │   └── analytics.service.js
    │   ├── queue/
    │   │   ├── queue.js
    │   │   ├── queue.setup.js
    │   │   ├── job.processor.js
    │   │   └── workers/
    │   │       └── automation.worker.js
    │   └── bot/
    │       ├── run-instagram-bot.js
    │       └── instagram/
    │           ├── browser-session.js
    │           ├── comment-generator.js
    │           ├── index.js
    │           ├── instagram.bot.js
    │           └── selectors.js
    └── utils/
        ├── http-error.js
        └── logger.js
```

## REST API Endpoints

### Auth Module
- `POST /api/v1/auth/register` — register user and return JWT.
- `POST /api/v1/auth/login` — login and return JWT.

### Account Management Module
- `GET /api/v1/accounts?limit=100&offset=0` — paginated social account list for authenticated tenant.
- `POST /api/v1/accounts` — create social account.
- `PATCH /api/v1/accounts/:id/status` — update account status (`active`, `paused`, `banned`).

### Automation Task Module
- `GET /api/v1/automation/tasks?limit=50&offset=0` — paginated automation task list for tenant.
- `POST /api/v1/automation/tasks` — create automation task and enqueue to BullMQ.
  - Supported actions: `like`, `comment`, `follow`, `post`
  - Optional fields: `scheduleAt`, `priority`, `metadata`

### Analytics Module
- `GET /api/v1/analytics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` — get total views and total likes (date-filtered).
- `GET /api/v1/analytics/fyp?from=YYYY-MM-DD&to=YYYY-MM-DD&minViews=10000` — get FYP content (views above threshold).

### System
- `GET /health` — health probe endpoint.

## Queue System (BullMQ)

- Queue name: `automation.tasks`
- Queue setup: `modules/queue/queue.setup.js`
- Worker: `modules/queue/workers/automation.worker.js`
- Job processor: `modules/queue/job.processor.js`
- Behavior:
  - Retries with exponential backoff
  - Delayed jobs for scheduled automation
  - Queue sharding for throughput (`automation.tasks.0..N`)
  - Structured logging for queue and worker events
  - Worker rate limiting controls for platform safety

## PostgreSQL Schema

The canonical schema is defined at:

- `apps/api/src/db/schema.sql`

Tables included:
- `tenants`
- `users`
- `social_accounts`
- `automation_tasks`
- `content_metrics`

Indexes included:
- `idx_social_accounts_tenant_status`
- `idx_automation_tasks_dispatch`
- `idx_automation_tasks_account_time`
- `idx_content_metrics_tenant_date`
- `idx_content_metrics_views`

## Bot Automation

- Instagram Puppeteer bot documentation: `docs/puppeteer-instagram-bot.md`


## Scalability

- See `docs/scalability-refactor.md` for 300-account / 10,000-daily-task tuning details.
