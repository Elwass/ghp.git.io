# AMOREF SaaS Platform Architecture

This document defines a production-ready system architecture for **AMOREF**, a SaaS platform for managing and automating social media operations at scale.

## 1) Architecture Diagram

```mermaid
flowchart TB
  subgraph Client Layer
    FE[React Web App\nDashboard + Bulk Composer + Account Manager]
  end

  subgraph Edge Layer
    CDN[CDN / Static Hosting]
    API_GW[API Gateway\nTLS, Rate Limiting, Auth Enforcement]
  end

  subgraph Core Backend (Node.js)
    AUTH[Auth Service\nJWT + RBAC + Tenant Context]
    ACCOUNT[Social Account Service\nCredentials, Proxies, Session Health]
    CONTENT[Content Service\nBulk Posts, Media, Templates]
    AUTOMATION[Automation Orchestrator\nRule Engine + Safety Policies]
    ANALYTICS[Analytics Service\nIngestion + Aggregation]
    DASH[Dashboard API\nKPIs, Charts, Export]
    SCHED[Scheduler Service\nCron + Campaign Triggers]
    QUEUE_API[Queue Producer Layer\nJob Contracts + Idempotency]
  end

  subgraph Execution Layer
    REDIS[(Redis\nQueues + Delayed Jobs + Locks)]
    WORKER1[Puppeteer Worker Pool A\nLike/Comment/Follow Jobs]
    WORKER2[Puppeteer Worker Pool B\nBulk Post Jobs]
    WORKER3[Puppeteer Worker Pool C\nMonitoring/Scrape Jobs]
    BROWSER[Headless Browser Runtime\nPuppeteer + Stealth + Proxy Routing]
  end

  subgraph Data Layer
    PG[(PostgreSQL\nMulti-tenant OLTP)]
    OBJ[(Object Storage\nImages/Videos)]
  end

  subgraph Observability & Ops
    LOGS[Centralized Logs]
    METRICS[Metrics + Alerts]
    AUDIT[Audit Trail]
  end

  FE --> CDN --> API_GW
  API_GW --> AUTH
  API_GW --> ACCOUNT
  API_GW --> CONTENT
  API_GW --> AUTOMATION
  API_GW --> ANALYTICS
  API_GW --> DASH

  AUTH --> PG
  ACCOUNT --> PG
  CONTENT --> PG
  CONTENT --> OBJ
  AUTOMATION --> PG
  ANALYTICS --> PG
  DASH --> PG
  SCHED --> QUEUE_API
  AUTOMATION --> QUEUE_API
  CONTENT --> QUEUE_API

  QUEUE_API --> REDIS
  REDIS --> WORKER1
  REDIS --> WORKER2
  REDIS --> WORKER3

  WORKER1 --> BROWSER
  WORKER2 --> BROWSER
  WORKER3 --> BROWSER

  WORKER1 --> PG
  WORKER2 --> PG
  WORKER3 --> PG

  AUTH --> AUDIT
  ACCOUNT --> AUDIT
  AUTOMATION --> AUDIT
  WORKER1 --> LOGS
  WORKER2 --> LOGS
  WORKER3 --> LOGS
  REDIS --> METRICS
  PG --> METRICS
```

### Key architectural decisions
- **Multi-tenant by design**: every business entity is scoped with `tenant_id`.
- **Queue-first execution**: all automation and posting actions are asynchronous jobs in Redis.
- **Worker specialization**: separate pools for engagement, posting, and monitoring to isolate failures and tune concurrency.
- **Policy guardrails**: per-platform rate limits, randomized delays, and safe-retry logic reduce account risk.
- **Idempotent jobs**: dedup keys prevent duplicate likes/comments/posts.

---

## 2) Recommended Folder Structure

```txt
amoref/
├── apps/
│   ├── api/                          # Node.js backend (REST/GraphQL)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── config/
│   │   │   ├── middleware/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── tenants/
│   │   │   │   ├── users/
│   │   │   │   ├── social-accounts/
│   │   │   │   ├── automation-rules/
│   │   │   │   ├── campaigns/
│   │   │   │   ├── posts/
│   │   │   │   ├── queue/
│   │   │   │   ├── analytics/
│   │   │   │   └── dashboard/
│   │   │   ├── db/
│   │   │   │   ├── migrations/
│   │   │   │   └── seeds/
│   │   │   └── shared/
│   │   ├── test/
│   │   └── package.json
│   │
│   ├── worker-bot/                   # Node.js Puppeteer workers
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── queue/
│   │   │   │   ├── consumers/
│   │   │   │   │   ├── engagement.consumer.ts
│   │   │   │   │   ├── posting.consumer.ts
│   │   │   │   │   └── monitoring.consumer.ts
│   │   │   │   └── job-handlers/
│   │   │   ├── puppeteer/
│   │   │   │   ├── browser-factory.ts
│   │   │   │   ├── platform-adapters/
│   │   │   │   ├── anti-detection/
│   │   │   │   └── proxy-manager.ts
│   │   │   ├── services/
│   │   │   └── shared/
│   │   ├── test/
│   │   └── package.json
│   │
│   └── web/                          # React frontend
│       ├── src/
│       │   ├── app/
│       │   ├── pages/
│       │   │   ├── dashboard/
│       │   │   ├── accounts/
│       │   │   ├── automations/
│       │   │   ├── bulk-posting/
│       │   │   └── settings/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── store/
│       │   └── utils/
│       └── package.json
│
├── packages/
│   ├── shared-types/
│   ├── shared-config/
│   ├── eslint-config/
│   └── tsconfig/
│
├── infra/
│   ├── docker/
│   ├── k8s/
│   ├── terraform/
│   └── monitoring/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   └── runbooks/
│
├── .github/workflows/
├── docker-compose.yml
└── README.md
```

---

## 3) Database Schema (PostgreSQL)

Below is a pragmatic schema for 300+ managed accounts, queue-driven automation, and KPI monitoring.

### 3.1 Core tenancy and identity

```sql
CREATE TABLE tenants (
  id              UUID PRIMARY KEY,
  name            VARCHAR(120) NOT NULL,
  plan            VARCHAR(40) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id              UUID PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  email           VARCHAR(160) NOT NULL,
  password_hash   TEXT NOT NULL,
  full_name       VARCHAR(120),
  role            VARCHAR(30) NOT NULL, -- owner/admin/analyst
  status          VARCHAR(20) NOT NULL DEFAULT 'active',
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email)
);
```

### 3.2 Social account management

```sql
CREATE TABLE social_platforms (
  id              SMALLSERIAL PRIMARY KEY,
  code            VARCHAR(30) UNIQUE NOT NULL,  -- instagram, x, tiktok, etc.
  name            VARCHAR(80) NOT NULL
);

CREATE TABLE proxies (
  id              UUID PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  provider        VARCHAR(80),
  host            VARCHAR(255) NOT NULL,
  port            INT NOT NULL,
  username        VARCHAR(120),
  password_enc    TEXT,
  geo_country     VARCHAR(2),
  status          VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE social_accounts (
  id                  UUID PRIMARY KEY,
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  platform_id         SMALLINT NOT NULL REFERENCES social_platforms(id),
  handle              VARCHAR(120) NOT NULL,
  login_username      VARCHAR(160) NOT NULL,
  login_password_enc  TEXT NOT NULL,
  session_cookies_enc TEXT,
  proxy_id            UUID REFERENCES proxies(id),
  status              VARCHAR(20) NOT NULL DEFAULT 'active', -- active/paused/banned
  health_score        NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  last_active_at      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, platform_id, handle)
);

CREATE INDEX idx_social_accounts_tenant_status
  ON social_accounts (tenant_id, status);
```

### 3.3 Campaigns, bulk posting, and content

```sql
CREATE TABLE media_assets (
  id              UUID PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  storage_url     TEXT NOT NULL,
  mime_type       VARCHAR(80) NOT NULL,
  file_size_bytes BIGINT,
  checksum        VARCHAR(128),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE post_templates (
  id              UUID PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  title           VARCHAR(140) NOT NULL,
  caption         TEXT,
  hashtags        TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campaigns (
  id              UUID PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  name            VARCHAR(140) NOT NULL,
  type            VARCHAR(30) NOT NULL, -- automation|bulk_posting
  status          VARCHAR(20) NOT NULL DEFAULT 'draft',
  start_at        TIMESTAMPTZ,
  end_at          TIMESTAMPTZ,
  timezone        VARCHAR(50) NOT NULL DEFAULT 'UTC',
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campaign_accounts (
  campaign_id      UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, social_account_id)
);

CREATE TABLE posts (
  id              UUID PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  campaign_id     UUID REFERENCES campaigns(id),
  template_id     UUID REFERENCES post_templates(id),
  target_platform_id SMALLINT NOT NULL REFERENCES social_platforms(id),
  caption         TEXT,
  scheduled_at    TIMESTAMPTZ,
  status          VARCHAR(20) NOT NULL DEFAULT 'queued', -- queued|published|failed
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE post_media (
  post_id          UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  media_asset_id   UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  sort_order       INT NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, media_asset_id)
);

CREATE INDEX idx_posts_tenant_status_scheduled
  ON posts (tenant_id, status, scheduled_at);
```

### 3.4 Automation rules and execution

```sql
CREATE TABLE automation_rules (
  id                UUID PRIMARY KEY,
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  name              VARCHAR(120) NOT NULL,
  platform_id       SMALLINT NOT NULL REFERENCES social_platforms(id),
  action_type       VARCHAR(30) NOT NULL, -- like/comment/follow/unfollow
  trigger_type      VARCHAR(30) NOT NULL, -- keyword, hashtag, user_list, schedule
  trigger_config    JSONB NOT NULL,
  action_config     JSONB NOT NULL,
  daily_limit       INT NOT NULL DEFAULT 100,
  hourly_limit      INT NOT NULL DEFAULT 20,
  cooldown_seconds  INT NOT NULL DEFAULT 60,
  status            VARCHAR(20) NOT NULL DEFAULT 'active',
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE job_queue_events (
  id                BIGSERIAL PRIMARY KEY,
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  social_account_id UUID REFERENCES social_accounts(id),
  job_type          VARCHAR(40) NOT NULL, -- post_publish / like / comment / follow / monitor
  dedup_key         VARCHAR(180),
  priority          SMALLINT NOT NULL DEFAULT 5,
  payload           JSONB NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending/processing/success/failed/retry/dead
  attempts          INT NOT NULL DEFAULT 0,
  max_attempts      INT NOT NULL DEFAULT 5,
  run_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at        TIMESTAMPTZ,
  finished_at       TIMESTAMPTZ,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_job_queue_events_dedup
  ON job_queue_events (tenant_id, dedup_key)
  WHERE dedup_key IS NOT NULL;

CREATE INDEX idx_job_queue_events_dispatch
  ON job_queue_events (status, run_at, priority);
```

### 3.5 Monitoring and analytics

```sql
CREATE TABLE account_metrics_daily (
  id                BIGSERIAL PRIMARY KEY,
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  social_account_id UUID NOT NULL REFERENCES social_accounts(id),
  metric_date       DATE NOT NULL,
  followers_count   INT,
  following_count   INT,
  posts_count       INT,
  views_count       BIGINT,
  likes_count       BIGINT,
  comments_count    BIGINT,
  engagement_rate   NUMERIC(6,3),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (social_account_id, metric_date)
);

CREATE TABLE post_metrics_hourly (
  id                BIGSERIAL PRIMARY KEY,
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  post_id           UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  metric_hour       TIMESTAMPTZ NOT NULL,
  views_count       BIGINT,
  likes_count       BIGINT,
  comments_count    BIGINT,
  shares_count      BIGINT,
  saves_count       BIGINT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, metric_hour)
);

CREATE INDEX idx_account_metrics_daily_tenant_date
  ON account_metrics_daily (tenant_id, metric_date);

CREATE INDEX idx_post_metrics_hourly_post_hour
  ON post_metrics_hourly (post_id, metric_hour);
```

### 3.6 Security and auditability

```sql
CREATE TABLE audit_logs (
  id              BIGSERIAL PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  actor_user_id   UUID REFERENCES users(id),
  action          VARCHAR(120) NOT NULL,
  entity_type     VARCHAR(80) NOT NULL,
  entity_id       VARCHAR(80) NOT NULL,
  before_state    JSONB,
  after_state     JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant_created
  ON audit_logs (tenant_id, created_at DESC);
```

---

## 4) Queue Design (Redis)

Suggested queues and priorities:

- `engagement.high` (follow/comment replies, urgent moderation)
- `engagement.normal` (likes/comments/follows)
- `posting.scheduled` (bulk post publish events)
- `monitoring.poll` (metric scraping and health checks)
- `maintenance` (cookie refresh, session re-login)

Recommended controls:
- Concurrency per worker pool + per-account mutex lock.
- Exponential backoff with jitter for retries.
- Dead-letter queue for exhausted jobs.
- Circuit-breaker per platform/account to pause risky automations.

---

## 5) Scale Notes for 300+ Accounts

- Start with **3 worker groups** (engagement, posting, monitoring), each horizontally scalable.
- Use **sharding-by-tenant** in worker assignment to reduce noisy-neighbor issues.
- Partition heavy metric tables by date (`post_metrics_hourly` monthly partitions).
- Add read replicas for dashboard reads once analytical traffic grows.
- Keep Puppeteer browser instances warm in bounded pools to reduce startup latency.

This architecture is designed to be incrementally deployable: monorepo first, then split services as throughput increases.

---

## Express Backend Starter (Implemented)

A concrete Node.js + Express backend scaffold is included under `apps/api` with:
- Auth module
- Account management module
- Automation task module
- BullMQ queue system

See implementation details and endpoint catalog in:
- `docs/amoref-express-backend.md`
- `docs/queue-based-automation.md`
- `docs/puppeteer-instagram-bot.md`

- `docs/react-dashboard.md`
- `docs/scalability-refactor.md`
