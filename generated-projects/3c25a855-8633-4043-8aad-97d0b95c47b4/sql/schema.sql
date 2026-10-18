CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);

CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  company_id TEXT NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  date TIMESTAMPTZ NOT NULL,
  party_size INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reservations_company ON reservations(company_id);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  company_id TEXT NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  total NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_company ON orders(company_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  company_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_company ON audit_logs(company_id);
