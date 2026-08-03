-- =====================================================
-- 786.Chat admin workspace — project persistence schema
-- Additive. Idempotent. Safe setup only.
-- Run via: POST /api/786-admin/setup  (owner-gated).
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_email   TEXT NOT NULL,
  kind          TEXT NOT NULL DEFAULT '786chat',
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  prompt        TEXT NOT NULL DEFAULT '',
  preview_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_project_files (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES admin_projects(id) ON DELETE CASCADE,
  path       TEXT NOT NULL,
  content    TEXT NOT NULL,
  language   TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, path)
);

CREATE TABLE IF NOT EXISTS admin_project_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES admin_projects(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content    TEXT NOT NULL,
  model      TEXT,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_project_revisions (
  id            UUID PRIMARY KEY,
  project_id    UUID NOT NULL REFERENCES admin_projects(id) ON DELETE CASCADE,
  owner_email   TEXT NOT NULL,
  label         TEXT NOT NULL DEFAULT 'Saved revision',
  source        TEXT NOT NULL DEFAULT 'manual',
  files         JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS builder_generation_jobs (
  id                  UUID PRIMARY KEY,
  project_id          UUID NOT NULL REFERENCES admin_projects(id) ON DELETE CASCADE,
  owner_email         TEXT NOT NULL,
  status              TEXT NOT NULL CHECK (status IN ('queued','running','validated','failed')),
  prompt              TEXT NOT NULL,
  specification       JSONB NOT NULL DEFAULT '{}'::jsonb,
  implementation_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  validation          JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider            TEXT,
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS admin_project_deployments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL UNIQUE REFERENCES admin_projects(id) ON DELETE CASCADE,
  slug           TEXT NOT NULL UNIQUE,
  title          TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live','failed')),
  published_html TEXT NOT NULL,
  files          JSONB NOT NULL DEFAULT '{}'::jsonb,
  version        INTEGER NOT NULL DEFAULT 1,
  published_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_project_domains (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         UUID NOT NULL REFERENCES admin_projects(id) ON DELETE CASCADE,
  deployment_id      UUID REFERENCES admin_project_deployments(id) ON DELETE SET NULL,
  owner_email        TEXT NOT NULL,
  address_type       TEXT NOT NULL CHECK (address_type IN ('path','subdomain','custom')),
  slug               TEXT,
  hostname           TEXT,
  is_primary         BOOLEAN NOT NULL DEFAULT FALSE,
  status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','configuring','active','error','removed')),
  dns_status         TEXT NOT NULL DEFAULT 'not_required'
                       CHECK (dns_status IN ('not_required','pending','verifying','verified','error')),
  ssl_status         TEXT NOT NULL DEFAULT 'pending'
                       CHECK (ssl_status IN ('pending','provisioning','active','error')),
  provider           TEXT,
  provider_domain_id TEXT,
  dns_records        JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_message      TEXT,
  verified_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (address_type = 'path' AND slug IS NOT NULL AND hostname IS NULL)
    OR
    (address_type IN ('subdomain','custom') AND hostname IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_admin_projects_owner_updated
  ON admin_projects (owner_email, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_projects_kind
  ON admin_projects (kind);

CREATE INDEX IF NOT EXISTS idx_admin_project_files_project
  ON admin_project_files (project_id);

CREATE INDEX IF NOT EXISTS idx_admin_project_messages_project_created
  ON admin_project_messages (project_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_admin_project_revisions_project_created
  ON admin_project_revisions (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_builder_generation_jobs_project_created
  ON builder_generation_jobs (project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS builder_ai_generations (
  id UUID PRIMARY KEY,
  owner_email TEXT NOT NULL,
  user_id TEXT NOT NULL,
  project_id UUID REFERENCES admin_projects(id) ON DELETE SET NULL,
  plan TEXT NOT NULL,
  feature TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'validation_failed', 'failed')),
  prompt_hash TEXT NOT NULL,
  prompt_characters INTEGER NOT NULL DEFAULT 0,
  primary_model TEXT,
  selected_model TEXT,
  provider_attempts JSONB NOT NULL DEFAULT '[]'::jsonb,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(14, 8) NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_builder_ai_generations_owner_created
  ON builder_ai_generations (owner_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_builder_ai_generations_project_created
  ON builder_ai_generations (project_id, created_at DESC)
  WHERE project_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS builder_ai_usage_daily (
  owner_email TEXT NOT NULL,
  usage_date DATE NOT NULL,
  requests INTEGER NOT NULL DEFAULT 0,
  input_tokens BIGINT NOT NULL DEFAULT 0,
  output_tokens BIGINT NOT NULL DEFAULT 0,
  total_tokens BIGINT NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(14, 8) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_email, usage_date)
);

CREATE TABLE IF NOT EXISTS builder_ai_rate_limits (
  owner_email TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_project_builds (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         UUID NOT NULL REFERENCES admin_projects(id) ON DELETE CASCADE,
  status             TEXT NOT NULL DEFAULT 'queued'
                     CHECK (status IN ('queued','running','passed','failed','cancelled')),
  package_manager    TEXT NOT NULL CHECK (package_manager IN ('npm','pnpm','yarn')),
  commands           JSONB NOT NULL DEFAULT '[]'::jsonb,
  logs               TEXT NOT NULL DEFAULT '',
  error_message      TEXT,
  source_version     TEXT NOT NULL,
  github_branch      TEXT,
  github_commit_sha  TEXT,
  github_pr_url      TEXT,
  deployment_url     TEXT,
  parent_build_id    UUID REFERENCES admin_project_builds(id) ON DELETE SET NULL,
  repair_attempt     INTEGER NOT NULL DEFAULT 0 CHECK (repair_attempt BETWEEN 0 AND 2),
  repair_status      TEXT NOT NULL DEFAULT 'not_needed'
                     CHECK (repair_status IN ('not_needed','pending','running','repaired','exhausted')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at         TIMESTAMPTZ,
  completed_at       TIMESTAMPTZ,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_project_builds_project_created
  ON admin_project_builds (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_project_builds_status
  ON admin_project_builds (status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_admin_project_deployments_slug
  ON admin_project_deployments (slug);

CREATE INDEX IF NOT EXISTS idx_admin_project_domains_project_created
  ON admin_project_domains (project_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_project_domains_hostname
  ON admin_project_domains (LOWER(hostname))
  WHERE hostname IS NOT NULL AND status != 'removed';

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_project_domains_primary
  ON admin_project_domains (project_id)
  WHERE is_primary = TRUE AND status != 'removed';

CREATE TABLE IF NOT EXISTS builder_security_rate_limits (
  namespace TEXT NOT NULL,
  identifier_hash TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (namespace, identifier_hash)
);

CREATE INDEX IF NOT EXISTS idx_builder_security_rate_limits_updated
  ON builder_security_rate_limits (updated_at);

CREATE TABLE IF NOT EXISTS builder_project_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES admin_projects(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  name TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, owner_email, name)
);

CREATE INDEX IF NOT EXISTS idx_builder_project_secrets_owner_project
  ON builder_project_secrets (owner_email, project_id, name);

CREATE TABLE IF NOT EXISTS builder_billing_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing','completed','failed')),
  attempt_count INTEGER NOT NULL DEFAULT 1,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
