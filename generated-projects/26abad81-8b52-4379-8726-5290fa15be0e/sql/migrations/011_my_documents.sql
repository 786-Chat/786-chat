CREATE TABLE IF NOT EXISTS my_documents (
  id TEXT PRIMARY KEY,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  check_date TEXT NOT NULL,
  day_name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(document_type, check_date)
);

CREATE INDEX IF NOT EXISTS idx_my_documents_type_date ON my_documents(document_type, check_date);
