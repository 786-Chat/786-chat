-- Existing schema preserved, adding haccp_flow_confirmations table
CREATE TABLE IF NOT EXISTS haccp_flow_confirmations (
  id TEXT PRIMARY KEY,
  confirmed_by TEXT NOT NULL,
  confirmation_date TEXT NOT NULL,
  review_date TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS haccp_daily_checks (
  id TEXT PRIMARY KEY,
  check_date TEXT NOT NULL,
  staff_member TEXT NOT NULL,
  production_today TEXT NOT NULL CHECK (production_today IN ('Yes', 'No')),
  heat_treatment_recorded TEXT CHECK (heat_treatment_recorded IN ('OK', 'Attention')),
  cooling_completed_below_8 TEXT CHECK (cooling_completed_below_8 IN ('OK', 'Attention')),
  cooling_completed_within_90 TEXT CHECK (cooling_completed_within_90 IN ('OK', 'Attention')),
  freezer_storage_check TEXT CHECK (freezer_storage_check IN ('OK', 'Attention')),
  cleaning_check_completed TEXT CHECK (cleaning_check_completed IN ('OK', 'Attention')),
  any_problem TEXT NOT NULL CHECK (any_problem IN ('Yes', 'No')),
  problem_action TEXT NOT NULL DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_haccp_daily_checks_date ON haccp_daily_checks(check_date);

CREATE TABLE IF NOT EXISTS haccp_manager_reviews (
  id TEXT PRIMARY KEY,
  review_period TEXT NOT NULL,
  reviewed_by TEXT NOT NULL,
  repeated_problems TEXT NOT NULL DEFAULT '',
  action_required TEXT NOT NULL DEFAULT '',
  staff_training_required TEXT NOT NULL CHECK (staff_training_required IN ('Yes', 'No')),
  review_completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_haccp_manager_reviews_period ON haccp_manager_reviews(review_period);
