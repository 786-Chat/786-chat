# DeepSeek AI Integration - Complete Setup Guide

## Quick Start (Already Connected to Neon)

Since your project is already connected to Neon, the AI tables should already be created. You can verify by running this SQL in the Neon Console:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'ai%' OR table_name LIKE 'user_ai%';
```

## If Tables Don't Exist, Run This SQL

Go to [Neon Console](https://console.neon.tech) → Your Project → SQL Editor → Run:

```sql
-- See sql/ai-schema.sql for complete schema
```

Or copy the entire contents of `sql/ai-schema.sql` and run it.

---

## Environment Variables Required

Add these to Vercel (Settings → Environment Variables):

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon connection string | Already set via integration |
| `DEEPSEEK_API_KEY` | DeepSeek API key | sk-xxxxxxxxxxxxxxxx |

### Get DeepSeek API Key:
1. Go to [platform.deepseek.com](https://platform.deepseek.com)
2. Sign up / Log in
3. Go to API Keys
4. Create new key
5. Copy and add to Vercel

---

## File Structure

```
lib/
  ai/
    deepseek.ts       # DeepSeek API helper with usage tracking
  db.ts               # Neon database connection

app/
  api/
    ai/
      route.ts        # POST: chat, GET: usage stats
    admin/
      ai-usage/
        route.ts      # Admin usage statistics
      ai-providers/
        route.ts      # Provider management
        test/
          route.ts    # Test provider connection

  shop-dashboard/
    ai/
      page.tsx        # Customer AI chat interface

  admin/
    ai-usage/
      page.tsx        # Admin AI usage dashboard

sql/
  ai-schema.sql       # Complete database schema
```

---

## Features

### Customer Dashboard (/shop-dashboard/ai)
- Real-time usage stats (requests, tokens, cost)
- 5 request types: Chat, Website Edit, Menu Help, Business Content, Code Help
- Chat interface with message history
- Plan upgrade prompts

### Admin Dashboard (/admin/ai-usage)
- System-wide usage monitoring
- Daily cost/request charts
- Top users by usage
- Provider settings management
- Budget alerts

---

## API Endpoints

### POST /api/ai
Send a chat message to DeepSeek AI.

```typescript
// Request
{
  "message": "Help me write a menu description",
  "requestType": "menu_help" // chat | website_edit | menu_help | business_content | code_help
}

// Response
{
  "response": "Here's a great menu description...",
  "usage": {
    "inputTokens": 50,
    "outputTokens": 150,
    "totalTokens": 200,
    "costUsd": 0.000056
  }
}
```

### GET /api/ai
Get user's AI usage statistics.

```typescript
// Response
{
  "todayUsage": { "requests": 10, "tokens": 5000, "cost": 0.001 },
  "monthUsage": { "requests": 150, "tokens": 75000, "cost": 0.015 },
  "plan": { "name": "Pro AI", "monthlyRequests": 20000, "monthlyTokens": 10000000 }
}
```

---

## Pricing (DeepSeek)

| Model | Input | Output |
|-------|-------|--------|
| deepseek-chat | $0.14/1M tokens | $0.28/1M tokens |

Very cost-effective compared to GPT-4 ($30/1M) or Claude ($15/1M).

---

## Troubleshooting

### "Database connection failed"
- Check DATABASE_URL is set in Vercel
- Ensure Neon project is active

### "AI request failed"
- Check DEEPSEEK_API_KEY is set
- Verify API key is valid at platform.deepseek.com

### "Usage limit exceeded"
- User has reached their plan's monthly limit
- Upgrade plan or wait for next billing cycle

---

## Verification Commands

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check plans
SELECT name, price, monthly_requests FROM ai_plans;

-- Check provider settings
SELECT provider, is_enabled, model FROM ai_provider_settings;

-- Check usage (after some requests)
SELECT * FROM user_ai_usage ORDER BY created_at DESC LIMIT 10;
```
