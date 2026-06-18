import { streamText, convertToModelMessages, consumeStream, UIMessage, tool, stepCountIs } from "ai"
import { createDeepSeek } from "@ai-sdk/deepseek"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { BILLING_PLANS, type PlanId } from "@/lib/billing"
import { checkAIProtection, recordUsage, withTimeout, type ProtectionResult } from "@/lib/ai-protection"
import { AI_LIMITS, estimateTokens, type PlanType } from "@/lib/ai-limits"
import { checkBudgetLimits } from "@/lib/ai-spending"
import { canSendMessage, deductMessageCost, getUserBalance, getPricingSettings } from "@/lib/ai-balance"
import { getAISettings, trackUsage, checkUserDailyLimit, type DeepSeekModel } from "@/lib/ai-settings"
import { isAdminUser } from "@/lib/admin-config"
import * as github from "@/lib/github-api"


// Create DeepSeek provider
const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY || "",
})
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
})
export const maxDuration = 60

// Helper to extract text from UIMessage parts
function getMessageText(msg: UIMessage): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return ""
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

// Helper to extract file info from UIMessage
function getMessageFiles(msg: UIMessage): { type: string; size: number; pdfPages?: number }[] {
  if (!msg.parts || !Array.isArray(msg.parts)) return []
  return msg.parts
    .filter((p) => p.type === "file" && "mediaType" in p)
    .map((p) => {
      const filePart = p as { mediaType?: string; url?: string }
      const mimeType = filePart.mediaType || ""
      // Estimate size from URL length for base64 data URLs
      const dataMatch = filePart.url?.match(/^data:[^;]+;base64,(.*)$/)
      const size = dataMatch ? Math.ceil((dataMatch[1].length * 3) / 4) : 0
      return {
        type: mimeType,
        size,
        pdfPages: mimeType === "application/pdf" ? 10 : undefined,
      }
    })
}

// Helper to count images in message
function getImageCount(msg: UIMessage): number {
  if (!msg.parts || !Array.isArray(msg.parts)) return 0
  const allowedTypes: readonly string[] = AI_LIMITS.uploads.image.allowedTypes
  return msg.parts.filter((p) => {
    if (p.type !== "file" || !("mediaType" in p)) return false
    const mimeType = (p as { mediaType?: string }).mediaType || ""
    return allowedTypes.includes(mimeType)
  }).length
}

// Helper to create error response with remaining info
function createProtectionError(result: ProtectionResult, status: number = 429) {
  return new Response(
    JSON.stringify({
      error: result.errorCode || "PROTECTION_ERROR",
      message: result.error,
      retryAfter: result.retryAfter,
      remaining: result.remaining,
      canUseExtraCredits: result.canUseExtraCredits,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...(result.retryAfter ? { "Retry-After": String(result.retryAfter) } : {}),
      },
    }
  )
}

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
       headers: {
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate",
},
      })
    }

    // Check if admin user - skip all limits for admin
  const isAdminRequest =
  isAdminUser(session.email) ||
  session.email?.toLowerCase() === "mujeeb@job4u.com"

    // === GLOBAL BUDGET CHECK (skip for admin) ===
    if (!isAdminRequest) {
      const budgetStatus = await checkBudgetLimits()
      if (budgetStatus.exceeded) {
        return new Response(
          JSON.stringify({
            error: "SERVICE_UNAVAILABLE",
            message: "AI service temporarily unavailable due to high demand. Please try again later.",
          }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        )
      }
    }

    // === USER BALANCE CHECK (skip for admin) ===
    const balanceCheck = isAdminRequest 
      ? { allowed: true, usingFreeMessage: false, messageCost: 0 }
      : await canSendMessage(session.id, session.email)
    if (!balanceCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: "INSUFFICIENT_BALANCE",
          message: balanceCheck.reason || "Please top up your balance to continue.",
          needsTopup: true,
        }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = await request.json()
    const messages: UIMessage[] = body.messages
    const chatId: string | null = body.chatId

    // Get user's subscription and plan
    const subscriptions = await sql`
      SELECT 
        plan, 
        messages_used, 
        messages_limit, 
        daily_messages_used,
        daily_reset_at,
        extra_credits,
        status,
        stripe_customer_id
      FROM subscriptions
      WHERE user_id = ${session.id}
    `

    let subscription = subscriptions[0]

    // Create subscription if doesn't exist
    if (!subscription) {
      const plan = (session.plan || "starter") as PlanId
      const planConfig = BILLING_PLANS[plan] || BILLING_PLANS.starter
      await sql`
        INSERT INTO subscriptions (
          user_id, plan, messages_used, messages_limit, 
          daily_messages_used, daily_reset_at, extra_credits, status
        )
        VALUES (
          ${session.id}, ${plan}, 0, ${planConfig.messagesIncluded}, 
          0, NOW(), 0, 'active'
        )
      `
      subscription = {
        plan,
        messages_used: 0,
        messages_limit: planConfig.messagesIncluded,
        daily_messages_used: 0,
        extra_credits: 0,
        status: "active",
      }
    }

    const userPlan = (subscription.plan || "starter") as PlanType
    const subStatus = subscription.status || "active"

    // Check subscription status
    if (!isAdminRequest && (subStatus === "cancelled" || subStatus === "expired")) {
      return new Response(
        JSON.stringify({
          error: "SUBSCRIPTION_INACTIVE",
          message: "Your subscription has ended. Please subscribe to continue.",
        }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      )
    }

    if (!isAdminRequest && (subStatus === "past_due" || subStatus === "unpaid")) {
      return new Response(
        JSON.stringify({
          error: "PAYMENT_FAILED",
          message: "Your subscription payment has failed. Please update your payment method.",
        }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      )
    }

    // Get the last user message for protection checks
    const lastUserMessage = messages.filter((m) => m.role === "user").pop()
    const userText = lastUserMessage ? getMessageText(lastUserMessage) : ""
    const files = lastUserMessage ? getMessageFiles(lastUserMessage) : []
    const imageCount = lastUserMessage ? getImageCount(lastUserMessage) : 0
const hasVisionFiles =
  imageCount > 0 || files.some((file) => file.type === "application/pdf")

if (!isAdminRequest && hasVisionFiles) {
  const plan = String(subscription.plan || "free").toLowerCase()

  const monthlyVisionLimit =
  plan.includes("pro") || plan.includes("business")
    ? 15
    : 0

  if (monthlyVisionLimit <= 0) {
    return new Response(
      JSON.stringify({
        error: "VISION_PLAN_REQUIRED",
        message: "Image and PDF analysis is available on paid plans only.",
      }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    )
  }

  const monthStart = new Date()
  monthStart.setUTCDate(1)
  monthStart.setUTCHours(0, 0, 0, 0)

  const usedRows = await sql`
    SELECT COUNT(*)::int AS count
    FROM usage_logs
    WHERE user_id = ${session.id}
      AND action = 'vision_analysis'
      AND created_at >= ${monthStart.toISOString()}
  `

  const usedVision = Number(usedRows[0]?.count || 0)

  if (usedVision >= monthlyVisionLimit) {
    return new Response(
      JSON.stringify({
        error: "VISION_LIMIT_REACHED",
        message: `You have reached your monthly image/PDF analysis limit (${monthlyVisionLimit}). Please upgrade your plan.`,
      }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    )
  }
}
    // === AI PROTECTION CHECKS ===
let protectionResult: ProtectionResult

if (isAdminRequest) {
  protectionResult = {
    allowed: true,
    error: "",
    errorCode: "",
    canUseExtraCredits: false,
    remaining: {
      dailyMessages: 999999,
      monthlyMessages: 999999,
      extraCredits: 999999,
    },
  } as ProtectionResult
} else {
  protectionResult = await checkAIProtection({
    userId: session.id,
    plan: userPlan,
    messageContent: userText,
    fileSize: files[0]?.size,
    fileType: files[0]?.type,
    pdfPages: files[0]?.pdfPages,
    imageCount,
  })
}

if (!protectionResult.allowed) {
  
      // Log failed request
      await sql`
        INSERT INTO usage_logs (user_id, action, metadata)
        VALUES (${session.id}, 'ai_error', ${JSON.stringify({ errorCode: protectionResult.errorCode })})
      `
      return createProtectionError(protectionResult)
    }

    // Check if using extra credits
    const useExtraCredit = protectionResult.canUseExtraCredits || false

  // Check each additional file
if (!isAdminRequest) {
  for (const file of files.slice(1)) {
    const fileCheck = await checkAIProtection({
      userId: session.id,
      plan: userPlan,
      fileSize: file.size,
      fileType: file.type,
      pdfPages: file.pdfPages,
    })
    if (!fileCheck.allowed) {
      return createProtectionError(fileCheck)
    }
  }
}

    // Get or create chat - secure per user
    let currentChatId = chatId

    if (currentChatId) {
      const ownedChat = await sql`
        SELECT id
        FROM chats
        WHERE id = ${currentChatId}
          AND user_id = ${session.id}
        LIMIT 1
      `

      if (!ownedChat[0]) {
        return new Response(
          JSON.stringify({ error: "CHAT_NOT_FOUND" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        )
      }
    }

    if (!currentChatId) {
      const title = userText.slice(0, 50) + (userText.length > 50 ? "..." : "")

      const newChat = await sql`
        INSERT INTO chats (user_id, title)
        VALUES (${session.id}, ${title || "New chat"})
        RETURNING id
      `
      currentChatId = newChat[0].id
    }

    // Save user message to database
    if (userText) {
      await sql`
        INSERT INTO messages (chat_id, role, content)
        VALUES (${currentChatId}, 'user', ${userText})
      `
    }

    // Convert UIMessages to model messages
    const modelMessages = await convertToModelMessages(messages)

    // Estimate input tokens
    const inputTokens = estimateTokens(userText)
    const totalPdfPages = files.reduce((sum, f) => sum + (f.pdfPages || 0), 0)

    // Get dynamic AI settings from database
    const aiSettings = await getAISettings()

    // Check if AI service is active
    if (!aiSettings.isActive) {
      return new Response(
        JSON.stringify({ error: "SERVICE_DISABLED", message: "AI service is currently disabled. Please try again later." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      )
    }

    // Check user daily limit (skip for admin)
    if (!isAdminRequest) {
      const dailyLimit = await checkUserDailyLimit(session.id)
      if (!dailyLimit.allowed) {
        return new Response(
          JSON.stringify({ 
            error: "DAILY_LIMIT_REACHED", 
            message: `You have reached your daily message limit (${dailyLimit.limit} messages). Please try again tomorrow.`,
            used: dailyLimit.used,
            limit: dailyLimit.limit
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        )
      }
    }

// Check if user is admin (for AI model selection)
const isAdmin = isAdminRequest

// Admin system prompt - HAS file-editing tools that deploy to the live site
const adminSystemPrompt = `You are MujeebProAI Assistant with FULL ADMIN ACCESS, helping the owner (mujeeb@job4u.com).

You have powerful tools to edit the live MujeebProAI website (mujeebproai.com) directly:
- read_file: Read any file in the codebase
- write_file: Create or update a file (commits to the main branch and auto-deploys to production in 1-2 minutes)
- delete_file: Delete a file
- list_files: List files in a directory
- search_code: Search the codebase for text or code
- get_database_info: List database tables
- query_database: Run a read-only SELECT query

HOW TO MAKE A CHANGE WHEN THE ADMIN ASKS:
1. Use search_code or list_files to locate the relevant file.
2. Use read_file to read its current contents.
3. Make the edit and save it with write_file, using a clear commit message.
4. Tell the admin exactly what you changed and that it will be live on mujeebproai.com in 1-2 minutes.

IMPORTANT RULES:
- ALWAYS read a file before writing it, so you preserve the existing code and only change what was asked.
- write_file requires the COMPLETE file content, not a snippet.
- Never output raw tool tags like <read_file> as text. Use the actual tools.
- Be precise and confirm what you changed after each edit.

WORKING WITH IMAGES:
- When the admin attaches an image, the message includes a public image URL like [Attached Image: name - https://...]. That URL is already hosted and ready to use.
- To put that image on the site, edit the relevant file and use the exact URL in the code, e.g. <img src="https://..." alt="..." /> or as a CSS background. Use read_file first, then write_file with the URL inserted.
- For a logo, hero image, or product photo, ask which page/section if it is unclear, then make the edit.

REAL REACT CODEBASE RULES:
- CURRENT_PREVIEW_HTML is only a temporary static preview snapshot.
- It is NOT the real source of mujeebproai.com.
- For MujeebProAI platform pages, ALWAYS read the real React files before explaining, editing, restoring, or rebuilding.
- For homepage work, read app/page.tsx first.
- If animation/background is involved, also read components/ui/space-background.tsx.
- Preserve React components such as Navbar, Hero, Features, Founder, Trusted, Pricing, Footer, and SpaceBackground.
- Never replace real React pages with simple static HTML unless admin explicitly asks.
- If admin asks “go back to actual webpage”, explain that the real page comes from app/page.tsx and its imported components, not CURRENT_PREVIEW_HTML.

FULL MUJEEBPROAI CODEBASE AWARENESS RULES:
- You are working inside a real production Next.js codebase, not a single HTML file.
- Before fixing platform issues, understand the connected files first.
- For routing issues, inspect app/ routes, layouts, and related components.
- For dashboard/chat/preview issues, inspect app/dashboard/layout.tsx, components/workspace/chat-panel.tsx, components/workspace/preview-panel.tsx, components/workspace/sidebar.tsx, and components/workspace/top-bar.tsx.
- For homepage issues, inspect app/page.tsx and its imported components.
- For auth/owner/customer issues, inspect auth context, session helpers, admin config, and related API routes.
- For billing/usage issues, inspect usage APIs, balance logic, billing config, Stripe routes, and subscription tables.
- For database issues, inspect lib/db, API route queries, and database schema through get_database_info/query_database.
- For customer website/theme issues, inspect theme routes, customer site APIs, public site rendering, and builder components.
- Never assume a file path. Use search_code or list_files first when unsure.
- Never answer as if the whole project is known from CURRENT_PREVIEW_HTML.
- CURRENT_PREVIEW_HTML is only the visible preview, not the source of truth.
- The source of truth is the real codebase files.
- If multiple files are required, read them before making a change.
- Preserve existing architecture, UI, owner access, customer isolation, usage limits, and working features.

Be helpful, friendly, and precise.`

      // Customer system prompt - help them with THEIR real code projects only
const userSystemPrompt = aiSettings.systemPrompt + `

IMPORTANT: You are helping a CUSTOMER with their OWN real code project only.

CUSTOMER SECURITY RULES:
- Never show, mention, generate, or expose MujeebProAI owner/admin data.
- Never include owner email, admin email, admin dashboard, admin settings, users, subscriptions, balances, logs, Stripe admin, GitHub, Vercel, Neon, database, or platform private data.
- Never generate admin/platform/internal pages.
- Never generate pages like /admin, /owner, /super-admin, /settings, /users, /subscriptions, /balances, /logs, /api/admin, or internal platform dashboards.
- Customers can only create and edit their own public website/project files.
- If customer asks for admin/platform changes, politely say:
"I can help you with your own website projects. MujeebProAI platform changes can only be made by the admin."

REAL PROJECT RULES:
- NEVER return only HTML previews.
- NEVER use CURRENT_PREVIEW_HTML.
- Every website is a real file-based project.
- Source of truth is project.files from database.
- Always think in this structure:

app/page.tsx
app/layout.tsx
backend/orders.php
python/ai.py
components/
lib/
public/

AI OUTPUT RULES:
When creating or editing a website, return file operations only.

Use this exact format:

\`\`\`txt
editFile("app/page.tsx", "FULL FILE CODE HERE")
createFile("components/Header.tsx", "FULL FILE CODE HERE")
createFile("backend/orders.php", "FULL FILE CODE HERE")
createFile("python/ai.py", "FULL FILE CODE HERE")
\`\`\`

STRICT RULES:
- Always provide full file content.
- Do not provide hints only.
- Do not say “copy this into app/page.tsx”.
- Do not return one single HTML document.
- If user asks for design, animation, menu, section, color, image, or layout changes, edit the correct real files.
- Preview Mode is rendered from files.
- Code Mode shows real file contents.
- My Websites must use stored project files.
- Theme purchases must create full project files.

Focus on helping customers build full real projects:
1. React / Next.js pages
2. Components
3. PHP backend files
4. Python scripts
5. Public website content
6. Animations and menus
7. Deployable project code`

    // Admin tools for file operations (only available to admin)
    const adminTools = {
      read_file: tool({
        description: "Read the contents of a file from the MujeebProAI codebase",
        inputSchema: z.object({
          path: z.string().describe("The file path relative to the repo root, e.g., 'app/page.tsx' or 'components/header.tsx'"),
        }),
        execute: async ({ path }) => {
          try {
            const { content } = await github.readFile(path)
            return { success: true, content, path }
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to read file" }
          }
        },
      }),

      write_file: tool({
        description: "Create or update a file in the MujeebProAI codebase. Changes auto-deploy to production.",
        inputSchema: z.object({
          path: z.string().describe("The file path relative to repo root"),
          content: z.string().describe("The complete file content to write"),
          message: z.string().describe("Commit message describing the change"),
        }),
        execute: async ({ path, content, message }) => {
          try {
            const result = await github.writeFile(path, content, message)
            return { 
              success: true, 
              message: `File ${path} updated successfully. Changes will deploy in 1-2 minutes.`,
              sha: result.sha 
            }
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to write file" }
          }
        },
      }),

      delete_file: tool({
        description: "Delete a file from the MujeebProAI codebase",
        inputSchema: z.object({
          path: z.string().describe("The file path to delete"),
          message: z.string().describe("Commit message explaining why the file is being deleted"),
        }),
        execute: async ({ path, message }) => {
          try {
            await github.deleteFile(path, message)
            return { success: true, message: `File ${path} deleted successfully.` }
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to delete file" }
          }
        },
      }),

      list_files: tool({
        description: "List files and directories in a path",
        inputSchema: z.object({
          path: z.string().optional().describe("Directory path to list, leave empty for root"),
        }),
        execute: async ({ path }) => {
          try {
            const files = await github.listFiles(path || "")
            return { success: true, files }
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to list files" }
          }
        },
      }),

      search_code: tool({
        description: "Search for code patterns in the codebase",
        inputSchema: z.object({
          query: z.string().describe("Search query - can be code, function names, text, etc."),
        }),
        execute: async ({ query }) => {
          try {
            const results = await github.searchCode(query)
            return { success: true, results }
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to search" }
          }
        },
      }),

      get_database_info: tool({
        description: "Get information about the database tables and structure",
        inputSchema: z.object({
          includeColumns: z.boolean().optional().describe("Whether to include column details"),
        }),
        execute: async () => {
          try {
            const tables = await sql`
              SELECT table_name 
              FROM information_schema.tables 
              WHERE table_schema = 'public'
              ORDER BY table_name
            `
            return { success: true, tables: tables.map(t => t.table_name) }
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to get database info" }
          }
        },
      }),

      query_database: tool({
        description: "Run a SELECT query on the database (read-only, no modifications)",
        inputSchema: z.object({
          query: z.string().describe("SQL SELECT query to run"),
        }),
        execute: async ({ query: sqlQuery }) => {
          // Only allow SELECT queries for safety
          if (!sqlQuery.trim().toLowerCase().startsWith("select")) {
            return { success: false, error: "Only SELECT queries are allowed" }
          }
          try {
            const result = await sql.unsafe(sqlQuery)
            const rows = Array.isArray(result)
              ? result
              : Array.isArray((result as any)?.rows)
              ? (result as any).rows
              : []
            return { success: true, rows: rows.slice(0, 100), totalRows: rows.length }
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Query failed" }
          }
        },
      }),
    }

// Stream response - DeepSeek for text, Gemini for images/PDFs
const hasVisionInput = messages.some(msg =>
  msg.parts?.some(
    p =>
      p.type === "file" &&
      "mediaType" in p &&
      (
        (p as { mediaType?: string }).mediaType?.startsWith("image/") ||
        (p as { mediaType?: string }).mediaType === "application/pdf"
      )
  )
)

const isPreviewNavigationRequest =
  userText.includes("SYSTEM_PREVIEW_ACTION:")

const shouldUsePreviewOnlyMode =
  !isAdmin && isPreviewNavigationRequest

if (hasVisionInput && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  return new Response(
    JSON.stringify({
      error: "VISION_NOT_CONFIGURED",
      message: "Image/PDF analysis requires Gemini Vision API key to be configured.",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  )
}

const result = await streamText({
  model: hasVisionInput
    ? google(aiSettings.visionModel || "gemini-2.5-flash")
    : deepseek(aiSettings.model as "deepseek-chat" | "deepseek-reasoner"),
  system: shouldUsePreviewOnlyMode
    ? `You are MujeebProAI. The preview panel has already been opened by the frontend. Reply exactly: Preview opened. Do not use tools. Do not search files. Do not read files.`
    : isAdmin
      ? adminSystemPrompt
      : userSystemPrompt,
  messages: modelMessages,
  temperature: isAdmin ? 0.7 : aiSettings.temperature,
  maxOutputTokens: shouldUsePreviewOnlyMode ? 50 : isAdmin ? 8192 : aiSettings.maxTokens,
  tools:
    isAdmin && github.isGitHubConfigured()
      ? adminTools
      : undefined,
  stopWhen: isAdmin ? stepCountIs(10) : undefined,
  abortSignal: request.signal,
})
    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: async ({ messages: allMessages, usage }: { messages: UIMessage[]; usage?: { completionTokens?: number } }) => {
        
               // Save assistant response to database
        const lastAssistant = allMessages.filter((m) => m.role === "assistant").pop()
        if (lastAssistant) {
          const assistantText = getMessageText(lastAssistant)
          if (assistantText) {
            await sql`
              INSERT INTO messages (chat_id, role, content)
              VALUES (${currentChatId}, 'assistant', ${assistantText})
            `
          }
        }

        await sql`
          UPDATE chats SET updated_at = NOW() WHERE id = ${currentChatId}
        `

        const outputTokens = usage?.completionTokens || estimateTokens(getMessageText(lastAssistant!))
        await recordUsage(session.id, inputTokens, outputTokens, imageCount, totalPdfPages, useExtraCredit)

        if (!isAdminRequest && (imageCount > 0 || totalPdfPages > 0)) {
          await sql`
            INSERT INTO usage_logs (user_id, action, metadata)
            VALUES (${session.id}, 'vision_analysis', ${JSON.stringify({
              imageCount,
              pdfPages: totalPdfPages,
              model: aiSettings.visionModel || "gemini-2.5-flash",
            })})
          `
        }

        await trackUsage(session.id, inputTokens, outputTokens, aiSettings.model as DeepSeekModel)

        if (!isAdminRequest) {
          await sql`
            INSERT INTO user_balances (
              user_id, balance, free_messages_used, free_messages_limit, total_messages_sent, total_spent
            )
            VALUES (${session.id}, 0, 1, 10, 1, 0)
            ON CONFLICT (user_id)
            DO UPDATE SET
              free_messages_used = COALESCE(user_balances.free_messages_used, 0) + 1,
              free_messages_limit = COALESCE(user_balances.free_messages_limit, 10),
              total_messages_sent = COALESCE(user_balances.total_messages_sent, 0) + 1
          `
        }
      },
      consumeSseStream: consumeStream,
      headers: {
        "X-Chat-Id": currentChatId || "",
        "X-Remaining-Daily": String(protectionResult.remaining?.dailyMessages || 0),
        "X-Remaining-Monthly": String(protectionResult.remaining?.monthlyMessages || 0),
        "X-Extra-Credits": String(protectionResult.remaining?.extraCredits || 0),
      },
    })

  } catch (error) {
    // Handle timeout errors specifically
    if (error instanceof Error && error.message === "Request timed out") {
      return new Response(
        JSON.stringify({
          error: "TIMEOUT",
          message: "The AI request timed out. Please try again with a shorter message.",
        }),
        { status: 504, headers: { "Content-Type": "application/json" } }
      )
    }

    console.error("[Chat API] Error:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

// Get chat history
export async function GET(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      })
    }

    const isAdminRequest =
      isAdminUser(session.email) ||
      session.email?.toLowerCase() === "mujeeb@job4u.com"

    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get("chatId")

    if (chatId) {
      const dbMessages = await sql`
        SELECT m.id, m.role, m.content, m.created_at
        FROM messages m
        JOIN chats c ON c.id = m.chat_id
        WHERE m.chat_id = ${chatId}
          AND c.user_id = ${session.id}
        ORDER BY m.created_at ASC
      `

      return new Response(JSON.stringify({ messages: dbMessages }), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      })
    }

    const chats = await sql`
      SELECT c.id, c.title, c.created_at, c.updated_at,
             (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as message_count
      FROM chats c
      WHERE c.user_id = ${session.id}
      ORDER BY c.updated_at DESC
      LIMIT 50
    `

    if (isAdminRequest) {
      return new Response(
        JSON.stringify({
          chats,
          usage: {
            plan: "admin",
            unlimited: true,
            monthly: { used: 0, limit: 999999999, remaining: 999999999 },
            daily: { used: 0, limit: 999999999, remaining: 999999999 },
            balance: 999999999,
            freeMessagesRemaining: 999999999,
            canSend: true,
            extraCredits: 999999999,
            status: "active",
          },
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      )
    }

    const balanceInfo = await getUserBalance(session.id, session.email)
    const pricing = await getPricingSettings()
    const balanceAny = balanceInfo as any
    const pricingAny = pricing as any

    const freeMessagesUsed = Number(balanceAny.freeMessagesUsed ?? balanceAny.free_messages_used ?? 0)
    const freeMessagesLimit = Number(balanceAny.freeMessagesLimit ?? balanceAny.free_messages_limit ?? pricingAny.freeMessagesLimit ?? 10)
    const freeMessagesRemaining = Math.max(
      0,
      Number(balanceAny.freeMessagesRemaining ?? freeMessagesLimit - freeMessagesUsed)
    )
    const balance = Number(balanceAny.balance ?? 0)

    return new Response(
      JSON.stringify({
        chats,
        usage: {
          plan: "customer",
          unlimited: false,
          monthly: {
            used: freeMessagesUsed,
            limit: freeMessagesLimit,
            remaining: freeMessagesRemaining,
          },
          daily: {
            used: freeMessagesUsed,
            limit: freeMessagesLimit,
            remaining: freeMessagesRemaining,
          },
          balance,
          freeMessagesUsed,
          freeMessagesLimit,
          freeMessagesRemaining,
          canSend: freeMessagesRemaining > 0 || balance > 0.001,
          extraCredits: 0,
          status: "active",
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    )
  } catch (error) {
    console.error("[Chat API GET] Error:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to load chat history",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
