-- Keep the live AI provider on the current DeepSeek V4 API model names.
-- Legacy deepseek-chat / deepseek-reasoner aliases were retired in July 2026.
UPDATE ai_provider_settings
SET model = 'deepseek-v4-flash',
    base_url = 'https://api.deepseek.com',
    is_enabled = true,
    is_primary = true,
    updated_at = NOW()
WHERE provider = 'deepseek';
