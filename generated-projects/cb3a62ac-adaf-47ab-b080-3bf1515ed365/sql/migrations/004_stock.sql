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
