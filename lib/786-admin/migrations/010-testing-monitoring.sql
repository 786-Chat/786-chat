CREATE TABLE IF NOT EXISTS builder_monitoring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('account','project','ai','build','deployment','journey','system')),
  event_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started','succeeded','failed','cancelled','degraded')),
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','error','critical')),
  owner_email TEXT,
  project_id UUID,
  build_id UUID,
  run_id UUID,
  error_code TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_builder_monitoring_events_created
  ON builder_monitoring_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_builder_monitoring_events_failures
  ON builder_monitoring_events (severity, created_at DESC)
  WHERE severity IN ('error','critical');
CREATE INDEX IF NOT EXISTS idx_builder_monitoring_events_project
  ON builder_monitoring_events (project_id, created_at DESC)
  WHERE project_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS builder_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
  severity TEXT NOT NULL CHECK (severity IN ('warning','error','critical')),
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  error_code TEXT,
  error_message TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_builder_incidents_status_seen
  ON builder_incidents (status, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS builder_journey_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('running','passed','failed')),
  current_stage TEXT NOT NULL,
  project_id UUID,
  synthetic_email TEXT,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_builder_journey_runs_started
  ON builder_journey_runs (started_at DESC);
