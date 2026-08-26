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
