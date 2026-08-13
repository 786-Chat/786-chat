-- Saffron Manager schema
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  vip BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  guests INTEGER NOT NULL CHECK (guests > 0),
  special_request TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_customer_id ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_booking_date ON reservations(booking_date);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  company_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'Each',
  supplier TEXT DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  rotation_method TEXT NOT NULL DEFAULT 'FIFO' CHECK (rotation_method IN ('FIFO','FEFO','Manual')),
  storage_type TEXT NOT NULL DEFAULT 'Ambient / Room Temperature',
  min_temperature NUMERIC(5,2),
  max_temperature NUMERIC(5,2),
  last_stock_in_at TIMESTAMPTZ,
  last_stock_out_at TIMESTAMPTZ,
  last_stock_in_date TIMESTAMPTZ,
  last_stock_out_date TIMESTAMPTZ,
  used_date DATE,
  best_before_date DATE,
  use_by_date DATE,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('STOCK IN', 'STOCK OUT', 'WASTAGE')),
  qty_in INTEGER,
  qty_out INTEGER,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  unit TEXT NOT NULL,
  reference TEXT DEFAULT '',
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  batch_number TEXT,
  batch_allocations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);

CREATE TABLE IF NOT EXISTS stock_batches (
  id SERIAL PRIMARY KEY,
  batch_number TEXT NOT NULL UNIQUE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  qty_received NUMERIC(12,2) NOT NULL DEFAULT 0,
  qty_remaining NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'Each',
  stock_in_date DATE NOT NULL,
  stock_in_time TIME NOT NULL,
  reference TEXT DEFAULT '',
  supplier TEXT DEFAULT '',
  best_before_date DATE,
  use_by_date DATE,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DEPLETED','EXPIRED')),
  created_by TEXT NOT NULL,
  received_temperature NUMERIC(5,2),
  storage_type TEXT,
  min_temperature NUMERIC(5,2),
  max_temperature NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_batches_product_id ON stock_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_batches_status ON stock_batches(status);
CREATE INDEX IF NOT EXISTS idx_stock_batches_expiry ON stock_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_stock_batches_use_by ON stock_batches(use_by_date);

CREATE TABLE IF NOT EXISTS wastage (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  batch_id INTEGER REFERENCES stock_batches(id),
  batch_number TEXT,
  qty NUMERIC(12,2) NOT NULL,
  unit TEXT NOT NULL,
  cost_price NUMERIC(10,2) NOT NULL,
  total_loss NUMERIC(12,2) NOT NULL,
  reason TEXT NOT NULL,
  other_reason TEXT,
  reference TEXT DEFAULT '',
  staff_user_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wastage_product_id ON wastage(product_id);
CREATE INDEX IF NOT EXISTS idx_wastage_created_at ON wastage(created_at);

CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT NOT NULL
);

INSERT INTO staff (name, pin) VALUES ('Mujeeb', '1234') ON CONFLICT DO NOTHING;
