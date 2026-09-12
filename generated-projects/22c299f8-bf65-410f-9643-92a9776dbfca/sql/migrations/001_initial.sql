-- 786.Chat runtime-only bootstrap for an imported database-backed app.
-- Source schemas remain authoritative; this creates the isolated database
-- so the imported runtime receives DATABASE_URL before cold start.
SELECT 1;
