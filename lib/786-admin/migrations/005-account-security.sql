-- Production account security for 786.Chat.
-- Additive and safe for the existing Neon database.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN;
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;
ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT FALSE;
ALTER TABLE users ALTER COLUMN email_verified SET NOT NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER;
UPDATE users SET session_version = 0 WHERE session_version IS NULL;
ALTER TABLE users ALTER COLUMN session_version SET DEFAULT 0;
ALTER TABLE users ALTER COLUMN session_version SET NOT NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT;
UPDATE users SET account_status = 'active' WHERE account_status IS NULL;
ALTER TABLE users ALTER COLUMN account_status SET DEFAULT 'active';
ALTER TABLE users ALTER COLUMN account_status SET NOT NULL;

CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_type TEXT NOT NULL CHECK (token_type IN ('email_verification', 'password_reset')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_type_created
  ON auth_tokens (user_id, token_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_expiry
  ON auth_tokens (expires_at)
  WHERE used_at IS NULL;
