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

        // Customer system prompt - help them with THEIR projects only
    const userSystemPrompt = aiSettings.systemPrompt + `

IMPORTANT: You are helping a CUSTOMER with their OWN website projects only.

CUSTOMER SECURITY RULES:
- Never show, mention, generate, or expose MujeebProAI owner/admin data.
- Never include owner email, admin email, admin dashboard, admin settings, users, subscriptions, balances, logs, Stripe admin, GitHub, Vercel, Neon, database, or platform private data.
- Never generate preview HTML for MujeebProAI admin pages.
- Never generate pages like /admin, /owner, /super-admin, /settings, /users, /subscriptions, /balances, /logs, /api/admin, or internal platform dashboards.
- Customers can only create and edit their own public website pages.
- Customer previews must look like a normal customer business website, not the MujeebProAI platform.
- If customer asks for admin/platform changes, politely say:
"I can help you with your own website projects. MujeebProAI platform changes can only be made by the admin."

Your role is to help customers:
- Generate new websites for their business
- Edit and customize their generated/imported websites
- Create safe public pages like Home, About, Contact, Services, Menu, Order, Gallery, Booking, Blog, FAQ
- Customize colors, fonts, layouts, images, buttons, sections, and content
- Help them manage their own sites in the dashboard

HTML PREVIEW RULES:
- When generating or editing a website preview, return one full HTML document inside one \`\`\`html code block.
- The HTML must be for the customer's business website only.
- Do not include MujeebProAI admin navigation, owner dashboard, admin links, platform controls, private emails, internal routes, API routes, database names, or secret/provider names.
- Do not ask for an external URL when CURRENT_PREVIEW_HTML is provided. Edit the provided current preview and return the full updated HTML.

Focus on helping customers:
1. Create beautiful websites using themes
2. Customize colors, fonts, layouts
3. Add public pages and content
4. Set up their business information
5. Preview and improve their customer website`

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
  userText.includes("SYSTEM_PREVIEW_ACTION:") ||
  /show me .*preview/i.test(userText) ||
  /open .*preview/i.test(userText) ||
  /preview .*page/i.test(userText)

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
  system: isPreviewNavigationRequest
    ? `You are MujeebProAI. The preview panel has already been opened by the frontend. Reply exactly: Preview opened. Do not use tools. Do not search files. Do not read files.`
    : isAdmin
      ? adminSystemPrompt
      : userSystemPrompt,
  messages: modelMessages,
  temperature: isAdmin ? 0.7 : aiSettings.temperature,
  maxOutputTokens: isPreviewNavigationRequest ? 50 : isAdmin ? 8192 : aiSettings.maxTokens,
  tools:
    isAdmin && github.isGitHubConfigured() && !isPreviewNavigationRequest
      ? adminTools
      : undefined,
  stopWhen: isAdmin && !isPreviewNavigationRequest ? stepCountIs(10) : undefined,
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

        // Update chat timestamp
        await sql`
          UPDATE chats SET updated_at = NOW() WHERE id = ${currentChatId}
        `

        // Record usage with cost tracking
        const outputTokens = usage?.completionTokens || estimateTokens(getMessageText(lastAssistant!))
        await recordUsage(
          session.id,
          inputTokens,
          outputTokens,
          imageCount,
          totalPdfPages,
          useExtraCredit
        )
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
        
    const chats = await sql`
      SELECT c.id, c.title, c.created_at, c.updated_at,
             (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as message_count
      FROM chats c
      WHERE c.user_id = ${session.id}
      ORDER BY c.updated_at DESC
      LIMIT 50
    `

      }

    const balance = await getUserBalance(session.id, session.email)
    const pricing = await getPricingSettings()

    return new Response(
      JSON.stringify({
        chats,
        usage: {
          plan: "customer",
          unlimited: false,
          monthly: {
            used: balance.freeMessagesUsed || 0,
            limit: balance.freeMessagesLimit || pricing.freeMessagesLimit || 10,
            remaining: balance.freeMessagesRemaining || 0,
          },
          daily: {
            used: balance.freeMessagesUsed || 0,
            limit: balance.freeMessagesLimit || pricing.freeMessagesLimit || 10,
            remaining: balance.freeMessagesRemaining || 0,
          },
          balance: balance.balance || 0,
          freeMessagesUsed: balance.freeMessagesUsed || 0,
          freeMessagesLimit: balance.freeMessagesLimit || pricing.freeMessagesLimit || 10,
          freeMessagesRemaining: balance.freeMessagesRemaining || 0,
          canSend: balance.freeMessagesRemaining > 0 || balance.balance > 0.001,
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
