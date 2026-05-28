-- =====================================================
-- COMPLETE DEEPSEEK AI INTEGRATION DATABASE SCHEMA
-- Run this in Neon SQL Editor (https://console.neon.tech)
-- =====================================================

-- 1. AI PLANS TABLE (Subscription tiers)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GBP',
  monthly_requests INTEGER NOT NULL,
  monthly_tokens BIGINT NOT NULL,
  max_output_tokens INTEGER NOT NULL,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER AI SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_ai_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES ai_plans(id),
  status VARCHAR(20) DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER AI USAGE TABLE (Daily tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  requests_count INTEGER DEFAULT 0,
  input_tokens BIGINT DEFAULT 0,
  output_tokens BIGINT DEFAULT 0,
  estimated_cost_usd DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 4. AI REQUEST LOGS TABLE (Detailed history)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  request_type VARCHAR(50) NOT NULL,
  provider VARCHAR(50) DEFAULT 'deepseek',
  model VARCHAR(100) DEFAULT 'deepseek-chat',
  input_text TEXT,
  output_text TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  response_time_ms INTEGER,
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AI PROVIDER SETTINGS TABLE (Admin configurable)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_provider_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  model VARCHAR(100),
  base_url VARCHAR(255),
  input_cost_per_million DECIMAL(10,4),
  output_cost_per_million DECIMAL(10,4),
  max_tokens INTEGER DEFAULT 4096,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_ai_usage_user_date ON user_ai_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_user ON ai_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_created ON ai_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_ai_subscriptions_user ON user_ai_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_subscriptions_status ON user_ai_subscriptions(status);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Default AI Plans
INSERT INTO ai_plans (name, slug, price, currency, monthly_requests, monthly_tokens, max_output_tokens, features, sort_order) VALUES 
('Free Trial', 'free', 0.00, 'GBP', 100, 100000, 1000, '["chat"]', 0),
('Basic AI', 'basic', 9.00, 'GBP', 5000, 2000000, 2000, '["chat", "basic_content"]', 1),
('Pro AI', 'pro', 29.00, 'GBP', 20000, 10000000, 4000, '["chat", "website_edits", "content_help", "code_help"]', 2),
('Business AI', 'business', 79.00, 'GBP', 100000, 50000000, 8000, '["chat", "website_edits", "content_help", "code_help", "priority_support", "api_access"]', 3)
ON CONFLICT (slug) DO NOTHING;

-- Default DeepSeek Provider Settings
INSERT INTO ai_provider_settings (provider, is_enabled, is_primary, model, base_url, input_cost_per_million, output_cost_per_million, max_tokens) VALUES 
('deepseek', true, true, 'deepseek-chat', 'https://api.deepseek.com', 0.14, 0.28, 4096)
ON CONFLICT (provider) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERY (Run after setup)
-- =====================================================
-- SELECT 'ai_plans' as table_name, COUNT(*) as row_count FROM ai_plans
-- UNION ALL
-- SELECT 'ai_provider_settings', COUNT(*) FROM ai_provider_settings
-- UNION ALL
-- SELECT 'user_ai_usage', COUNT(*) FROM user_ai_usage
-- UNION ALL
-- SELECT 'ai_request_logs', COUNT(*) FROM ai_request_logs
-- UNION ALL
-- SELECT 'user_ai_subscriptions', COUNT(*) FROM user_ai_subscriptions;
