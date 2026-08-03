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
