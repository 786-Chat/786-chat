ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_event_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_stripe_session_unique
  ON payments (stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_stripe_event_unique
  ON payments (stripe_event_id) WHERE stripe_event_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS builder_billing_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing','completed','failed')),
  attempt_count INTEGER NOT NULL DEFAULT 1,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE builder_ai_generations ADD COLUMN IF NOT EXISTS credit_reserved INTEGER NOT NULL DEFAULT 0;
ALTER TABLE builder_ai_generations ADD COLUMN IF NOT EXISTS credit_refunded BOOLEAN NOT NULL DEFAULT FALSE;
