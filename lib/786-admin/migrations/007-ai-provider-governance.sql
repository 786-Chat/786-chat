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
