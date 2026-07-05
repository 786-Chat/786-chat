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

CREATE INDEX IF NOT EXISTS idx_admin_projects_owner_updated
  ON admin_projects (owner_email, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_projects_kind
  ON admin_projects (kind);

CREATE INDEX IF NOT EXISTS idx_admin_project_files_project
  ON admin_project_files (project_id);

CREATE INDEX IF NOT EXISTS idx_admin_project_messages_project_created
  ON admin_project_messages (project_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_admin_project_deployments_slug
  ON admin_project_deployments (slug);
