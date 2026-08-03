import "server-only"

import { createHash, randomUUID } from "node:crypto"

import { sql } from "@/lib/786-admin/db"
import type { BuilderGenerationUsage } from "@/lib/786-chat/ai-provider-config"
import { normalizeBuilderPlan } from "@/lib/786-chat/billing"

type PlanLimit = {
  requestsPerMinute: number
  requestsPerDay: number
  requestsPerMonth: number
  tokensPerMonth: number
  maxPromptCharacters: number
}

const PLAN_LIMITS: Record<string, PlanLimit> = {
  starter: { requestsPerMinute: 3, requestsPerDay: 5, requestsPerMonth: 20, tokensPerMonth: 120_000, maxPromptCharacters: 6_000 },
  free: { requestsPerMinute: 3, requestsPerDay: 5, requestsPerMonth: 20, tokensPerMonth: 120_000, maxPromptCharacters: 6_000 },
  basic: { requestsPerMinute: 5, requestsPerDay: 20, requestsPerMonth: 200, tokensPerMonth: 2_000_000, maxPromptCharacters: 12_000 },
  pro: { requestsPerMinute: 8, requestsPerDay: 50, requestsPerMonth: 500, tokensPerMonth: 8_000_000, maxPromptCharacters: 20_000 },
  business: { requestsPerMinute: 15, requestsPerDay: 200, requestsPerMonth: 3_000, tokensPerMonth: 50_000_000, maxPromptCharacters: 32_000 },
  enterprise: { requestsPerMinute: 30, requestsPerDay: 1_000, requestsPerMonth: 20_000, tokensPerMonth: 300_000_000, maxPromptCharacters: 50_000 },
}

export type BuilderGenerationReservation = {
  allowed: boolean
  generationId?: string
  error?: string
  errorCode?: string
  retryAfter?: number
  limit?: PlanLimit
}

function normalizedEmail(email: string) {
  return email.toLowerCase().trim()
}

function limitsForPlan(plan: string | undefined) {
  return PLAN_LIMITS[String(plan || "starter").toLowerCase()] || PLAN_LIMITS.starter
}

function safeError(error: unknown) {
  const value = error instanceof Error ? error.message : String(error || "AI generation failed")
  return value
    .replace(/https?:\/\/\S+/gi, "provider documentation")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 500)
}

export async function reserveBuilderGeneration(input: {
  ownerEmail: string
  userId: string
  plan?: string
  prompt: string
  projectId?: string | null
}): Promise<BuilderGenerationReservation> {
  const owner = normalizedEmail(input.ownerEmail)
  const plan = normalizeBuilderPlan(input.plan)
  const limit = limitsForPlan(plan)
  const prompt = input.prompt.trim()

  if (!prompt) {
    return { allowed: false, error: "Describe what you want to build first.", errorCode: "PROMPT_REQUIRED", limit }
  }
  if (prompt.length > limit.maxPromptCharacters) {
    return {
      allowed: false,
      error: `This request is too long for the ${plan} plan. Keep it under ${limit.maxPromptCharacters.toLocaleString()} characters.`,
      errorCode: "PROMPT_TOO_LONG",
      limit,
    }
  }

  const rateRows = await sql`
    INSERT INTO builder_ai_rate_limits (owner_email, window_start, request_count, updated_at)
    VALUES (${owner}, NOW(), 1, NOW())
    ON CONFLICT (owner_email) DO UPDATE SET
      request_count = CASE
        WHEN builder_ai_rate_limits.window_start < NOW() - INTERVAL '1 minute' THEN 1
        ELSE builder_ai_rate_limits.request_count + 1
      END,
      window_start = CASE
        WHEN builder_ai_rate_limits.window_start < NOW() - INTERVAL '1 minute' THEN NOW()
        ELSE builder_ai_rate_limits.window_start
      END,
      updated_at = NOW()
    RETURNING request_count, EXTRACT(EPOCH FROM (NOW() - window_start)) AS window_seconds
  ` as unknown as Array<{ request_count: number; window_seconds: number }>
  const rate = rateRows[0]
  if (Number(rate?.request_count || 0) > limit.requestsPerMinute) {
    const retryAfter = Math.max(1, Math.ceil(60 - Number(rate?.window_seconds || 0)))
    return {
      allowed: false,
      error: `Too many generation requests. Try again in ${retryAfter} seconds.`,
      errorCode: "AI_RATE_LIMITED",
      retryAfter,
      limit,
    }
  }

  const usageRows = await sql`
    SELECT
      (SELECT COUNT(*) FROM builder_ai_generations
        WHERE owner_email = ${owner} AND created_at >= CURRENT_DATE) AS requests_today,
      (SELECT COUNT(*) FROM builder_ai_generations
        WHERE owner_email = ${owner} AND created_at >= DATE_TRUNC('month', CURRENT_DATE)) AS requests_month,
      (SELECT COALESCE(SUM(total_tokens), 0) FROM builder_ai_usage_daily
        WHERE owner_email = ${owner}
          AND usage_date >= DATE_TRUNC('month', CURRENT_DATE)::date) AS tokens_month
  ` as unknown as Array<{ requests_today: number; requests_month: number; tokens_month: number }>
  const usage = usageRows[0]
  if (Number(usage?.requests_today || 0) >= limit.requestsPerDay) {
    return { allowed: false, error: `Daily AI generation limit reached for the ${plan} plan.`, errorCode: "AI_DAILY_LIMIT", limit }
  }
  let creditReserved = 0
  if (Number(usage?.requests_month || 0) >= limit.requestsPerMonth || Number(usage?.tokens_month || 0) >= limit.tokensPerMonth) {
    const creditRows = (await sql`
      UPDATE subscriptions
      SET extra_credits = extra_credits - 1, updated_at = NOW()
      WHERE user_id = ${input.userId}::uuid AND COALESCE(extra_credits, 0) > 0
      RETURNING extra_credits
    `) as unknown as Array<{ extra_credits: number }>
    if (!creditRows[0]) {
      return { allowed: false, error: `Monthly AI usage limit reached for the ${plan} plan. Upgrade, add credits or wait for the next billing period.`, errorCode: "AI_MONTHLY_LIMIT", limit }
    }
    creditReserved = 1
  }

  const generationId = randomUUID()
  const promptHash = createHash("sha256").update(prompt).digest("hex")
  try {
    await sql`
      INSERT INTO builder_ai_generations (
        id, owner_email, user_id, project_id, plan, feature, status,
        prompt_hash, prompt_characters, credit_reserved, created_at
      ) VALUES (
        ${generationId}, ${owner}, ${input.userId}, ${input.projectId || null}, ${plan},
        'builder-codegen', 'pending', ${promptHash}, ${prompt.length}, ${creditReserved}, NOW()
      )
    `
  } catch (error) {
    if (creditReserved) {
      await sql`
        UPDATE subscriptions SET extra_credits = COALESCE(extra_credits, 0) + 1, updated_at = NOW()
        WHERE user_id = ${input.userId}::uuid
      `
    }
    throw error
  }
  return { allowed: true, generationId, limit }
}

export async function completeBuilderGeneration(input: {
  generationId: string
  ownerEmail: string
  status: "completed" | "validation_failed"
  primaryModel?: string | null
  selectedModel?: string | null
  providerAttempts?: unknown
  usage: BuilderGenerationUsage
  latencyMs: number
}) {
  const owner = normalizedEmail(input.ownerEmail)
  await sql`
    UPDATE builder_ai_generations
    SET status = ${input.status},
        primary_model = ${input.primaryModel || null},
        selected_model = ${input.selectedModel || null},
        provider_attempts = ${JSON.stringify(input.providerAttempts || [])}::jsonb,
        input_tokens = ${input.usage.inputTokens},
        output_tokens = ${input.usage.outputTokens},
        total_tokens = ${input.usage.totalTokens},
        estimated_cost_usd = ${input.usage.estimatedCostUsd},
        latency_ms = ${Math.max(0, Math.floor(input.latencyMs))},
        completed_at = NOW()
    WHERE id = ${input.generationId} AND owner_email = ${owner}
  `
  await sql`
    INSERT INTO builder_ai_usage_daily (
      owner_email, usage_date, requests, input_tokens, output_tokens,
      total_tokens, estimated_cost_usd, updated_at
    ) VALUES (
      ${owner}, CURRENT_DATE, 1, ${input.usage.inputTokens}, ${input.usage.outputTokens},
      ${input.usage.totalTokens}, ${input.usage.estimatedCostUsd}, NOW()
    )
    ON CONFLICT (owner_email, usage_date) DO UPDATE SET
      requests = builder_ai_usage_daily.requests + 1,
      input_tokens = builder_ai_usage_daily.input_tokens + EXCLUDED.input_tokens,
      output_tokens = builder_ai_usage_daily.output_tokens + EXCLUDED.output_tokens,
      total_tokens = builder_ai_usage_daily.total_tokens + EXCLUDED.total_tokens,
      estimated_cost_usd = builder_ai_usage_daily.estimated_cost_usd + EXCLUDED.estimated_cost_usd,
      updated_at = NOW()
  `
}

export async function failBuilderGeneration(input: {
  generationId: string
  ownerEmail: string
  errorCode: string
  error: unknown
  providerAttempts?: unknown
  latencyMs: number
}) {
  await sql`
    WITH failed AS (
      UPDATE builder_ai_generations
      SET status = 'failed',
          provider_attempts = ${JSON.stringify(input.providerAttempts || [])}::jsonb,
          error_code = ${input.errorCode.slice(0, 80)},
          error_message = ${safeError(input.error)},
          latency_ms = ${Math.max(0, Math.floor(input.latencyMs))},
          credit_refunded = credit_reserved > 0,
          completed_at = NOW()
      WHERE id = ${input.generationId}
        AND owner_email = ${normalizedEmail(input.ownerEmail)}
        AND status = 'pending'
      RETURNING user_id, credit_reserved
    )
    UPDATE subscriptions s
    SET extra_credits = COALESCE(s.extra_credits, 0) + failed.credit_reserved,
        updated_at = NOW()
    FROM failed
    WHERE failed.credit_reserved > 0 AND s.user_id::text = failed.user_id
  `
}
