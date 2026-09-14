CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  supplier TEXT NOT NULL,
  supplier_batch TEXT NOT NULL,
  quantity TEXT NOT NULL,
  unit TEXT NOT NULL,
  date_received TEXT NOT NULL,
  use_by_date TEXT NOT NULL,
  storage_location TEXT NOT NULL,
  allergen_yes_no TEXT NOT NULL,
  allergen_type TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_name ON deliveries(name);
CREATE INDEX IF NOT EXISTS idx_deliveries_supplier ON deliveries(supplier);
CREATE INDEX IF NOT EXISTS idx_deliveries_use_by_date ON deliveries(use_by_date);
