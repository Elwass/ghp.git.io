# Queue-Based Automation System (BullMQ)

## Queue Setup

File: `apps/api/src/modules/queue/queue.setup.js`

- Defines Redis connection via `REDIS_URL`.
- Creates `automation.tasks` queue with default retry policy:
  - `attempts: 5`
  - exponential backoff with 2s base delay
- Adds queue event listeners for completed/failed events.
- Exposes `addAutomationTask(payload)` to enqueue supported task types:
  - `like`
  - `comment`
  - `follow`
  - `post`

## Worker File

File: `apps/api/src/modules/queue/workers/automation.worker.js`

- Starts a BullMQ worker for `automation.tasks`.
- Configures `concurrency: 25`.
- Delegates business logic to job processor.
- Logs worker lifecycle:
  - job received
  - job completed
  - job failed (+ retry visibility via `willRetry`)

## Job Processor

File: `apps/api/src/modules/queue/job.processor.js`

- Maps `actionType` to concrete handlers (`like`, `comment`, `follow`, `post`).
- Marks tasks in PostgreSQL through states:
  - `processing`
  - `completed`
  - `failed`
- Persists `last_error` when processing fails.
- Throws errors back to BullMQ so retry policy applies automatically.

## API Integration

- `POST /api/v1/automation/tasks` accepts task creation payload and enqueues jobs.
- Supported `actionType`: `like`, `comment`, `follow`, `post`.
- Optional `scheduleAt` for delayed execution.
- Optional `priority` (1..10).
