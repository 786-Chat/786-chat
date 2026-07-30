-- Additive phase-one deployment domain model.
-- This migration creates new objects only and does not modify production DNS.

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

CREATE INDEX IF NOT EXISTS idx_admin_project_domains_project_created
  ON admin_project_domains (project_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_project_domains_hostname
  ON admin_project_domains (LOWER(hostname))
  WHERE hostname IS NOT NULL AND status != 'removed';

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_project_domains_primary
  ON admin_project_domains (project_id)
  WHERE is_primary = TRUE AND status != 'removed';
