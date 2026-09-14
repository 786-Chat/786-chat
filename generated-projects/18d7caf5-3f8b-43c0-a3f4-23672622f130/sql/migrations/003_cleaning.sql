CREATE TABLE IF NOT EXISTS cleaning_checks (
  id TEXT PRIMARY KEY,
  area_equipment TEXT NOT NULL,
  cleaning_task TEXT NOT NULL,
  cleaning_date TEXT NOT NULL,
  cleaning_time TEXT NOT NULL,
  cleaned_by TEXT NOT NULL,
  checked_by TEXT NOT NULL,
  chemical_used TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('Satisfactory', 'Unsatisfactory')),
  notes TEXT NOT NULL DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cleaning_checks_date ON cleaning_checks(cleaning_date);
CREATE INDEX IF NOT EXISTS idx_cleaning_checks_result ON cleaning_checks(result);
CREATE INDEX IF NOT EXISTS idx_cleaning_checks_completed ON cleaning_checks(completed);

CREATE TABLE IF NOT EXISTS cleaning_options (
  id TEXT PRIMARY KEY,
  option_type TEXT NOT NULL CHECK (option_type IN ('cleaning_area', 'cleaning_task', 'staff_name', 'chemical', 'saved_note')),
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(option_type, value)
);

CREATE INDEX IF NOT EXISTS idx_cleaning_options_type ON cleaning_options(option_type);
