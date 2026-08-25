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

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  flavour TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  net_weight TEXT NOT NULL,
  ingredients TEXT NOT NULL,
  allergens TEXT NOT NULL,
  storage_instruction TEXT NOT NULL,
  shelf_life_days INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

CREATE TABLE IF NOT EXISTS ingredients (
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

CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_use_by_date ON ingredients(use_by_date);

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

CREATE TABLE IF NOT EXISTS freezer_equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  equipment_type TEXT NOT NULL CHECK (equipment_type IN ('Freezer', 'Chiller')),
  location TEXT NOT NULL,
  target_temperature TEXT NOT NULL,
  current_temperature TEXT NOT NULL,
  last_checked_date TEXT NOT NULL,
  last_checked_time TEXT NOT NULL,
  checked_by TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Normal', 'Warning', 'Out of Range')),
  notes TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_freezer_equipment_type ON freezer_equipment(equipment_type);
CREATE INDEX IF NOT EXISTS idx_freezer_equipment_status ON freezer_equipment(status);
