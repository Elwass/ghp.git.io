CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120) NOT NULL,
  plan          VARCHAR(40) NOT NULL DEFAULT 'starter',
  status        VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email         VARCHAR(160) NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     VARCHAR(120),
  role          VARCHAR(30) NOT NULL DEFAULT 'member',
  status        VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE social_accounts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  platform           VARCHAR(30) NOT NULL,
  handle             VARCHAR(120) NOT NULL,
  login_username     VARCHAR(160) NOT NULL,
  login_password_enc TEXT NOT NULL,
  status             VARCHAR(20) NOT NULL DEFAULT 'active',
  last_active_at     TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, platform, handle)
);

CREATE TABLE automation_tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  action_type       VARCHAR(20) NOT NULL,
  target            VARCHAR(255) NOT NULL,
  comment_text      TEXT,
  schedule_at       TIMESTAMPTZ,
  run_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  queue_name        VARCHAR(80),
  priority          SMALLINT NOT NULL DEFAULT 3,
  attempts          SMALLINT NOT NULL DEFAULT 0,
  status            VARCHAR(20) NOT NULL DEFAULT 'queued',
  created_by        UUID REFERENCES users(id),
  processed_by      VARCHAR(80),
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_error        TEXT,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_social_accounts_tenant_status
  ON social_accounts (tenant_id, status);

CREATE INDEX idx_automation_tasks_dispatch
  ON automation_tasks (tenant_id, status, run_at, priority);

CREATE INDEX idx_automation_tasks_account_time
  ON automation_tasks (social_account_id, created_at DESC);

CREATE TABLE content_metrics (
  id            BIGSERIAL PRIMARY KEY,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content_id    UUID NOT NULL,
  content_title VARCHAR(200) NOT NULL,
  platform      VARCHAR(30) NOT NULL,
  views         BIGINT NOT NULL DEFAULT 0,
  likes         BIGINT NOT NULL DEFAULT 0,
  comments      BIGINT NOT NULL DEFAULT 0,
  metric_date   DATE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, content_id, metric_date)
);

CREATE INDEX idx_content_metrics_tenant_date
  ON content_metrics (tenant_id, metric_date);

CREATE INDEX idx_content_metrics_views
  ON content_metrics (tenant_id, views DESC);
