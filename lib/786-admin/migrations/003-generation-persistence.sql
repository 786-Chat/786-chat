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

CREATE INDEX IF NOT EXISTS idx_admin_project_revisions_project_created
  ON admin_project_revisions (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_builder_generation_jobs_project_created
  ON builder_generation_jobs (project_id, created_at DESC);
