# Queue-Based Automation System (BullMQ)

## Queue Setup

File: `apps/api/src/modules/queue/queue.setup.js`

- Defines Redis connection via `REDIS_URL`.
- Creates sharded queues: `automation.tasks.0` ... `automation.tasks.N`.
- Uses hash-based queue assignment from `socialAccountId`.
- Sets default retry policy:
  - `attempts: 6`
  - exponential backoff with 2s base delay
- Adds queue event listeners for completed/failed events.
- Enqueues supported task types:
  - `like`
  - `comment`
  - `follow`
  - `post`

## Worker File

File: `apps/api/src/modules/queue/workers/automation.worker.js`

- Starts one worker per queue shard.
- Configures environment-driven throughput controls:
  - `WORKER_CONCURRENCY`
  - `WORKER_RATE_LIMIT_MAX`
  - `WORKER_RATE_LIMIT_DURATION_MS`
- Delegates business logic to job processor.
- Logs worker lifecycle and retry behavior.

## Job Processor

File: `apps/api/src/modules/queue/job.processor.js`

- Maps `actionType` to handlers (`like`, `comment`, `follow`, `post`).
- Marks task states in PostgreSQL:
  - `processing`
  - `completed`
  - `failed`
- Uses PostgreSQL advisory lock per `socialAccountId` to avoid conflicting concurrent actions.
- Persists `last_error`, attempts, and processor metadata.
- Throws errors back to BullMQ so retry policy applies automatically.

## API Integration

- `POST /api/v1/automation/tasks` creates and enqueues jobs.
- `GET /api/v1/automation/tasks?limit=50&offset=0` lists tasks with pagination.
