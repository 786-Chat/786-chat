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

ALTER TABLE admin_project_builds
  ADD COLUMN IF NOT EXISTS parent_build_id UUID REFERENCES admin_project_builds(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS repair_attempt INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repair_status TEXT NOT NULL DEFAULT 'not_needed';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'admin_project_builds_repair_attempt_check'
  ) THEN
    ALTER TABLE admin_project_builds
      ADD CONSTRAINT admin_project_builds_repair_attempt_check
      CHECK (repair_attempt BETWEEN 0 AND 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'admin_project_builds_repair_status_check'
  ) THEN
    ALTER TABLE admin_project_builds
      ADD CONSTRAINT admin_project_builds_repair_status_check
      CHECK (repair_status IN ('not_needed','pending','running','repaired','exhausted'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_admin_project_builds_project_created
  ON admin_project_builds (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_project_builds_status
  ON admin_project_builds (status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_admin_project_builds_parent
  ON admin_project_builds (parent_build_id)
  WHERE parent_build_id IS NOT NULL;
