CREATE TABLE IF NOT EXISTS admin_project_deployment_versions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES admin_projects(id) ON DELETE CASCADE,
  deployment_id    UUID NOT NULL REFERENCES admin_project_deployments(id) ON DELETE CASCADE,
  build_id         UUID REFERENCES admin_project_builds(id) ON DELETE SET NULL,
  version          INTEGER NOT NULL,
  action           TEXT NOT NULL CHECK (action IN ('deploy','redeploy','rollback')),
  status           TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live','failed')),
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL,
  runtime_url      TEXT,
  published_html   TEXT NOT NULL DEFAULT '',
  files            JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_version   TEXT NOT NULL,
  restored_version INTEGER,
  published_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_admin_project_deployment_versions_project
  ON admin_project_deployment_versions (project_id, version DESC);

INSERT INTO admin_project_deployment_versions
  (project_id, deployment_id, build_id, version, action, status, title, slug,
   runtime_url, published_html, files, source_version, published_at)
SELECT d.project_id, d.id, d.build_id, d.version, 'deploy', d.status, d.title, d.slug,
       d.runtime_url, d.published_html, d.files, md5(d.files::text), d.published_at
FROM admin_project_deployments d
WHERE NOT EXISTS (
  SELECT 1
  FROM admin_project_deployment_versions v
  WHERE v.project_id = d.project_id
)
ON CONFLICT (project_id, version) DO NOTHING;
