-- Additive Phase 1 deployment migration.
-- Published project addresses point to an exact passed compiled build.

ALTER TABLE admin_project_deployments
  ADD COLUMN IF NOT EXISTS runtime_url TEXT,
  ADD COLUMN IF NOT EXISTS build_id UUID REFERENCES admin_project_builds(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_admin_project_deployments_build
  ON admin_project_deployments (build_id);
