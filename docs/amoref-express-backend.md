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
    │   └── queue/
    │       ├── queue.js
    │       └── workers/
    │           └── automation.worker.js
    └── utils/
        └── http-error.js
```

## REST API Endpoints

### Auth Module
- `POST /api/v1/auth/register` — register user and return JWT.
- `POST /api/v1/auth/login` — login and return JWT.

### Account Management Module
- `GET /api/v1/accounts` — list all social accounts for authenticated tenant.
- `POST /api/v1/accounts` — create social account.
- `PATCH /api/v1/accounts/:id/status` — update account status (`active`, `paused`, `banned`).

### Automation Task Module
- `GET /api/v1/automation/tasks` — list automation tasks for tenant.
- `POST /api/v1/automation/tasks` — create automation task (`like`, `comment`, `follow`) and enqueue to BullMQ.

### System
- `GET /health` — health probe endpoint.

## Queue System (BullMQ)

- Queue name: `automation.tasks`
- Producer: `modules/queue/queue.js`
- Worker: `modules/queue/workers/automation.worker.js`
- Processing strategy:
  - Retries with exponential backoff
  - Delayed jobs for scheduled automation
  - `jobId` idempotency (`task:<taskId>`)

## PostgreSQL Schema

The canonical schema is defined at:

- `apps/api/src/db/schema.sql`

Tables included:
- `tenants`
- `users`
- `social_accounts`
- `automation_tasks`

Indexes included:
- `idx_social_accounts_tenant_status`
- `idx_automation_tasks_tenant_status_schedule`
