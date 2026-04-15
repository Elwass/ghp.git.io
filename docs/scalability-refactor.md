# Scalability Refactor (300 Accounts / 10,000 Daily Tasks)

## What changed

### Queue sharding
- Introduced queue sharding using `QUEUE_SHARDS` (default 6).
- Tasks are distributed to queues `automation.tasks.0..N` via hash of `socialAccountId`.
- Reduces queue contention and supports horizontal scaling.

### Multi-worker setup
- Worker process now starts one BullMQ worker per shard.
- Concurrency and rate limits are configurable:
  - `WORKER_CONCURRENCY`
  - `WORKER_RATE_LIMIT_MAX`
  - `WORKER_RATE_LIMIT_DURATION_MS`

### Per-account locking
- Added PostgreSQL advisory locks keyed by `socialAccountId`.
- Prevents conflicting concurrent actions on the same account.

### Task model for high volume
- Extended `automation_tasks` schema with:
  - `run_at`
  - `queue_name`
  - `priority`
  - `attempts`
  - `processed_by`
- Added dispatch and account-time indexes for fast queue and reporting queries.

### API pagination
- Added `limit`/`offset` pagination to account and automation list endpoints.
- Supports efficient listing for 300+ accounts and large task history.

## Operational baseline
- At 10,000 tasks/day (~417 tasks/hour average), 6 shards with 30 concurrency each provides headroom for burst processing.
- Rate limiting protects downstream social platforms while preserving throughput.
