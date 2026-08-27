CREATE TABLE IF NOT EXISTS weekly_check_results (
  id TEXT PRIMARY KEY,
  check_type TEXT NOT NULL CHECK (check_type IN ('opening', 'closing')),
  task_key TEXT NOT NULL,
  check_date TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(check_type, task_key, check_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_check_results_lookup
  ON weekly_check_results(check_type, check_date);
