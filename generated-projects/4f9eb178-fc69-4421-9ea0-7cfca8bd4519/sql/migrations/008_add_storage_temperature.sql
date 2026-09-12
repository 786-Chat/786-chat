ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_type TEXT NOT NULL DEFAULT 'Ambient / Room Temperature';
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_temperature NUMERIC(5,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_temperature NUMERIC(5,2);

ALTER TABLE stock_batches ADD COLUMN IF NOT EXISTS received_temperature NUMERIC(5,2);
ALTER TABLE stock_batches ADD COLUMN IF NOT EXISTS storage_type TEXT;
ALTER TABLE stock_batches ADD COLUMN IF NOT EXISTS min_temperature NUMERIC(5,2);
ALTER TABLE stock_batches ADD COLUMN IF NOT EXISTS max_temperature NUMERIC(5,2);
