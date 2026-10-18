CREATE TABLE IF NOT EXISTS production_ingredient_usage (
  id TEXT PRIMARY KEY,
  production_record_id TEXT NOT NULL,
  batch_number TEXT NOT NULL,
  ingredient_id TEXT NOT NULL,
  ingredient_name TEXT NOT NULL,
  supplier_batch TEXT NOT NULL,
  quantity_used TEXT NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (production_record_id) REFERENCES production_records(batch_record_id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE INDEX IF NOT EXISTS idx_production_ingredient_usage_record ON production_ingredient_usage(production_record_id);
CREATE INDEX IF NOT EXISTS idx_production_ingredient_usage_ingredient ON production_ingredient_usage(ingredient_id);
