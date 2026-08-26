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
