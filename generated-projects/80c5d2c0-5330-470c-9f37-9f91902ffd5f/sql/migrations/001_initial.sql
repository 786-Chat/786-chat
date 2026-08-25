CREATE TABLE IF NOT EXISTS production_records (
  id TEXT PRIMARY KEY,
  batch_record_id TEXT NOT NULL UNIQUE,
  batch_number TEXT NOT NULL,
  date TEXT NOT NULL,
  product TEXT NOT NULL,
  flavour TEXT NOT NULL,
  ingredients TEXT NOT NULL,
  allergens TEXT NOT NULL,
  quantity_made TEXT NOT NULL,
  unit TEXT NOT NULL,
  mixing_start_time TEXT NOT NULL,
  heat_treatment_temperature TEXT NOT NULL,
  heat_treatment_time TEXT NOT NULL,
  cooling_start_time TEXT NOT NULL,
  cooling_start_temperature TEXT NOT NULL,
  cooling_final_time TEXT NOT NULL,
  cooling_final_temperature TEXT NOT NULL,
  packaging_type TEXT NOT NULL,
  storage_location TEXT NOT NULL,
  storage_in_date TEXT NOT NULL,
  storage_in_time TEXT NOT NULL,
  use_by_date TEXT NOT NULL,
  storage_instruction TEXT NOT NULL,
  net_weight TEXT NOT NULL,
  operator_name TEXT NOT NULL,
  label_ok TEXT NOT NULL,
  storage_temperature TEXT,
  cooling_duration TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_production_records_batch_record_id ON production_records(batch_record_id);
CREATE INDEX IF NOT EXISTS idx_production_records_batch_number ON production_records(batch_number);
