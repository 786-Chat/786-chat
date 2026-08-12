import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const config = await readFile("lib/786-chat/ai-provider-config.ts", "utf8")
const governance = await readFile("lib/786-chat/ai-governance.ts", "utf8")
const codegen = await readFile("lib/786-admin/codegen.ts", "utf8")
const controller = await readFile("lib/786-chat/provider-controller.ts", "utf8")
const route = await readFile("app/api/786-chat/generate/route.ts", "utf8")
const migration = await readFile("lib/786-admin/migrations/007-ai-provider-governance.sql", "utf8")

test("builder providers use current gateway model identifiers", () => {
  assert.match(config, /deepseek\/deepseek-v4-flash/)
  assert.match(config, /deepseek\/deepseek-v4-pro/)
  assert.match(config, /google\/gemini-3\.5-flash/)
  assert.match(config, /google\/gemini-3\.1-pro-preview/)
})

test("gateway requests include attribution, tags, privacy and plan budgets", () => {
  assert.match(codegen, /user: input\.userId/)
  assert.match(codegen, /feature:builder-codegen/)
  assert.match(codegen, /plan:/)
  assert.match(codegen, /zeroDataRetention: true/)
  assert.match(codegen, /maxOutputTokensForPlan\(input\.userPlan\)/)
  assert.match(codegen, /deepseek\("deepseek-chat"\)/)
  assert.match(controller, /payload\._originalPrompt \|\| payload\.message/)
  assert.match(controller, /maxOutputTokens: useCompactProfile \? 10_000 : undefined/)
  assert.match(controller, /candidateModes: CodegenMode\[\] = \[primaryMode\]/)
})

test("builder code generation prefers connected direct provider keys before gateway", () => {
  assert.match(codegen, /createDeepSeek/)
  assert.match(codegen, /createGoogleGenerativeAI/)
  assert.match(codegen, /DEEPSEEK_API_KEY/)
  assert.match(codegen, /GOOGLE_GENERATIVE_AI_API_KEY/)
  assert.match(codegen, /typeof model === "string"/)
})

test("governance enforces prompt, minute, daily, monthly and token limits", () => {
  assert.match(governance, /maxPromptCharacters/)
  assert.match(governance, /requestsPerMinute/)
  assert.match(governance, /requestsPerDay/)
  assert.match(governance, /requestsPerMonth/)
  assert.match(governance, /tokensPerMonth/)
  assert.match(governance, /AI_RATE_LIMITED/)
  assert.match(governance, /AI_DAILY_LIMIT/)
  assert.match(governance, /AI_MONTHLY_LIMIT/)
})

test("only the verified owner bypasses all plan quotas without disabling governance", () => {
  assert.match(route, /if \(!session\?\.email\)/)
  assert.match(route, /bypassPlanLimits: isAdminUser\(session\.email\)/)
  assert.match(route, /import \{ isAdminUser \} from "@\/lib\/admin-config"/)
  assert.match(route, /bypassPlanLimits:/)
  assert.match(governance, /!input\.bypassPlanLimits && prompt\.length > limit\.maxPromptCharacters/)
  assert.match(governance, /!input\.bypassPlanLimits && Number\(rate\?\.request_count/)
  assert.match(governance, /!input\.bypassPlanLimits && Number\(usage\?\.requests_today/)
  assert.match(governance, /!input\.bypassPlanLimits && \(Number\(usage\?\.requests_month/)
})

test("generation records store prompt hashes, token usage, cost and latency", () => {
  assert.match(governance, /createHash\("sha256"\)/)
  assert.match(governance, /prompt_hash/)
  assert.doesNotMatch(governance, /prompt_text|raw_prompt/)
  assert.match(governance, /estimated_cost_usd/)
  assert.match(governance, /latency_ms/)
  assert.match(governance, /builder_ai_usage_daily/)
})

test("canonical generation reserves usage and completes or fails every accepted request", () => {
  assert.match(route, /reserveBuilderGeneration/)
  assert.match(route, /completeBuilderGeneration/)
  assert.match(route, /failBuilderGeneration/)
  assert.match(route, /Retry-After/)
  assert.match(route, /generationId/)
})

test("database migration creates generation, rollup and rate-limit ledgers", () => {
  assert.match(migration, /builder_ai_generations/)
  assert.match(migration, /builder_ai_usage_daily/)
  assert.match(migration, /builder_ai_rate_limits/)
  assert.match(migration, /provider_attempts JSONB/)
})
