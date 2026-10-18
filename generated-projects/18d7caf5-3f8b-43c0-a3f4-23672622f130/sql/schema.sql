CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  document_date TEXT,
  expiry_date TEXT,
  staff_member TEXT NOT NULL DEFAULT '',
  certificate_reference TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  blob_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_staff ON documents(staff_member);
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON documents(expiry_date);

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

CREATE TABLE IF NOT EXISTS freezer_options (
  id TEXT PRIMARY KEY,
  option_type TEXT NOT NULL CHECK (option_type IN ('equipment_type', 'location', 'staff_name', 'saved_note')),
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(option_type, value)
);

CREATE INDEX IF NOT EXISTS idx_freezer_options_type ON freezer_options(option_type);

CREATE TABLE IF NOT EXISTS temperature_checks (
  id TEXT PRIMARY KEY,
  equipment_id TEXT NOT NULL,
  equipment_name TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
  location TEXT NOT NULL,
  target_temperature TEXT NOT NULL,
  actual_temperature TEXT NOT NULL,
  check_date TEXT NOT NULL,
  check_time TEXT NOT NULL,
  checked_by TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Normal', 'Warning', 'Out of Range')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (equipment_id) REFERENCES freezer_equipment(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_temperature_checks_equipment ON temperature_checks(equipment_id);
CREATE INDEX IF NOT EXISTS idx_temperature_checks_date ON temperature_checks(check_date);
CREATE INDEX IF NOT EXISTS idx_temperature_checks_status ON temperature_checks(status);

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

CREATE TABLE IF NOT EXISTS haccp_checks (
  id TEXT PRIMARY KEY,
  check_date TEXT NOT NULL,
  check_time TEXT NOT NULL,
  process_area TEXT NOT NULL,
  hazard_type TEXT NOT NULL CHECK (hazard_type IN ('Biological', 'Chemical', 'Physical', 'Allergen')),
  control_point TEXT NOT NULL,
  critical_limit TEXT NOT NULL,
  actual_result TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pass', 'Warning', 'Fail')),
  checked_by TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_haccp_checks_date ON haccp_checks(check_date);
CREATE INDEX IF NOT EXISTS idx_haccp_checks_status ON haccp_checks(status);

CREATE TABLE IF NOT EXISTS haccp_options (
  id TEXT PRIMARY KEY,
  option_type TEXT NOT NULL CHECK (option_type IN ('process_area', 'control_point', 'critical_limit', 'staff_name', 'saved_note')),
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(option_type, value)
);

CREATE INDEX IF NOT EXISTS idx_haccp_options_type ON haccp_options(option_type);

CREATE TABLE IF NOT EXISTS stock_adjustments (
  id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('ingredient', 'product')),
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity_change TEXT NOT NULL,
  reason TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_adjustments_item ON stock_adjustments(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_created ON stock_adjustments(created_at);

CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  production_record_id TEXT NOT NULL UNIQUE REFERENCES production_records(batch_record_id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  product_name TEXT NOT NULL,
  flavour TEXT NOT NULL,
  batch_number TEXT NOT NULL,
  production_date TEXT NOT NULL,
  quantity_produced TEXT NOT NULL,
  quantity_available TEXT NOT NULL,
  unit TEXT NOT NULL,
  net_weight TEXT NOT NULL,
  storage_location TEXT NOT NULL,
  storage_temperature TEXT,
  storage_instruction TEXT NOT NULL,
  use_by_date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_product ON inventory_items(product_name);
CREATE INDEX IF NOT EXISTS idx_inventory_items_flavour ON inventory_items(flavour);
CREATE INDEX IF NOT EXISTS idx_inventory_items_batch ON inventory_items(batch_number);
CREATE INDEX IF NOT EXISTS idx_inventory_items_location ON inventory_items(storage_location);
CREATE INDEX IF NOT EXISTS idx_inventory_items_use_by ON inventory_items(use_by_date);

CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id TEXT PRIMARY KEY,
  inventory_item_id TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  batch_number TEXT NOT NULL,
  quantity_before TEXT NOT NULL,
  quantity_change TEXT NOT NULL,
  quantity_after TEXT NOT NULL,
  reason TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_item ON inventory_adjustments(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_created ON inventory_adjustments(created_at);

CREATE TABLE IF NOT EXISTS haccp_flow_confirmations (
  id TEXT PRIMARY KEY,
  confirmed_by TEXT NOT NULL,
  confirmation_date TEXT NOT NULL,
  review_date TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS haccp_daily_checks (
  id TEXT PRIMARY KEY,
  check_date TEXT NOT NULL,
  staff_member TEXT NOT NULL,
  production_today TEXT NOT NULL CHECK (production_today IN ('Yes', 'No')),
  heat_treatment_recorded TEXT CHECK (heat_treatment_recorded IN ('OK', 'Attention')),
  cooling_completed_below_8 TEXT CHECK (cooling_completed_below_8 IN ('OK', 'Attention')),
  cooling_completed_within_90 TEXT CHECK (cooling_completed_within_90 IN ('OK', 'Attention')),
  freezer_storage_check TEXT CHECK (freezer_storage_check IN ('OK', 'Attention')),
  cleaning_check_completed TEXT CHECK (cleaning_check_completed IN ('OK', 'Attention')),
  any_problem TEXT NOT NULL CHECK (any_problem IN ('Yes', 'No')),
  problem_action TEXT NOT NULL DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_haccp_daily_checks_date ON haccp_daily_checks(check_date);

CREATE TABLE IF NOT EXISTS haccp_manager_reviews (
  id TEXT PRIMARY KEY,
  review_period TEXT NOT NULL,
  reviewed_by TEXT NOT NULL,
  repeated_problems TEXT NOT NULL DEFAULT '',
  action_required TEXT NOT NULL DEFAULT '',
  staff_training_required TEXT NOT NULL CHECK (staff_training_required IN ('Yes', 'No')),
  review_completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_haccp_manager_reviews_period ON haccp_manager_reviews(review_period);

CREATE TABLE IF NOT EXISTS process_flows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  steps TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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


CREATE TABLE IF NOT EXISTS weekly_check_results (
  id TEXT PRIMARY KEY,
  check_type TEXT NOT NULL CHECK (check_type IN ('opening', 'closing')),
  task_key TEXT NOT NULL,
  check_date TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(check_type, task_key, check_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_check_results_lookup
  ON weekly_check_results(check_type, check_date);
