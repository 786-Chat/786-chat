import { streamText, convertToModelMessages, consumeStream, UIMessage, tool } from "ai"
import { createDeepSeek } from "@ai-sdk/deepseek"
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
        headers: { "Content-Type": "application/json" },
      })
    }

    // Check if admin user - skip all limits for admin
    const isAdminRequest = isAdminUser(session.email)

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
      : await canSendMessage(session.id)
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
    if (subStatus === "cancelled" || subStatus === "expired") {
      return new Response(
        JSON.stringify({
          error: "SUBSCRIPTION_INACTIVE",
          message: "Your subscription has ended. Please subscribe to continue.",
        }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      )
    }

    if (subStatus === "past_due" || subStatus === "unpaid") {
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

    // === AI PROTECTION CHECKS ===
    const protectionResult = await checkAIProtection({
      userId: session.id,
      plan: userPlan,
      messageContent: userText,
      fileSize: files[0]?.size,
      fileType: files[0]?.type,
      pdfPages: files[0]?.pdfPages,
      imageCount,
    })

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

    // Get or create chat
    let currentChatId = chatId
    if (!currentChatId) {
      const title = userText.slice(0, 50) + (userText.length > 50 ? "..." : "")

      const newChat = await sql`
        INSERT INTO chats (user_id, title)
        VALUES (${session.id}, ${title})
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

    // Admin system prompt with agent capabilities
    const adminSystemPrompt = `You are MujeebProAI Assistant with FULL ADMIN ACCESS.
AUTHORIZED ADMIN: mujeeb@job4u.com

You have access to powerful tools to manage the MujeebProAI website:
- read_file: Read any file from the codebase
- write_file: Create or update files (auto-deploys to production)
- delete_file: Remove files from the codebase
- list_files: Browse directory contents
- search_code: Find code patterns
- get_database_info: View database structure
- query_database: Run SELECT queries

IMPORTANT: Only the admin (mujeeb@job4u.com) can make changes to the MujeebProAI project.
When other users ask to change mujeebproai, politely inform them that only the admin can make project changes.

When the admin asks to change the website:
1. First read the relevant files to understand the current code
2. Make the changes using write_file
3. Explain what you changed

All changes auto-deploy to mujeebproai.com within 1-2 minutes.

Be helpful, precise, and always confirm before making major changes.`

    // Customer system prompt - help them with THEIR projects
    const userSystemPrompt = aiSettings.systemPrompt + `

IMPORTANT: You are helping a CUSTOMER with their OWN website projects.

Your role is to help customers:
- Generate new websites for their business
- Edit and customize their generated/imported websites
- Answer questions about web development, design, and features
- Help them manage their sites in the dashboard

If a customer asks to change the MujeebProAI platform itself (not their own website), politely explain:
"I can help you with your own website projects! Changes to the MujeebProAI platform can only be made by the admin.
What would you like to do with YOUR website today?"

Focus on helping customers:
1. Create beautiful websites using themes
2. Customize colors, fonts, layouts
3. Add pages and content
4. Set up their business information
5. Deploy and manage their sites`

    // Admin tools for file operations (only available to admin)
    const adminTools = {
      read_file: tool({
        description: "Read the contents of a file from the MujeebProAI codebase",
        parameters: z.object({
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
        parameters: z.object({
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
        parameters: z.object({
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
        parameters: z.object({
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
        parameters: z.object({
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
        parameters: z.object({
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
        parameters: z.object({
          query: z.string().describe("SQL SELECT query to run"),
        }),
        execute: async ({ query: sqlQuery }) => {
          // Only allow SELECT queries for safety
          if (!sqlQuery.trim().toLowerCase().startsWith("select")) {
            return { success: false, error: "Only SELECT queries are allowed" }
          }
          try {
            const result = await sql.unsafe(sqlQuery)
            return { success: true, rows: result.slice(0, 100), totalRows: result.length }
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Query failed" }
          }
        },
      }),
    }

    // Stream response - use different model based on admin status
    const result = await streamText({
      // Admin uses Vercel AI Gateway (OpenAI - included free), customers use DeepSeek
      model: isAdmin 
        ? "openai/gpt-4.1" as any
        : deepseek(aiSettings.model as "deepseek-chat" | "deepseek-reasoner"),
      system: isAdmin ? adminSystemPrompt : userSystemPrompt,
      messages: modelMessages,
      temperature: isAdmin ? 0.7 : aiSettings.temperature,
      maxTokens: isAdmin ? 8192 : aiSettings.maxTokens,
      // Enable tools for admin users only
      tools: isAdmin && github.isGitHubConfigured() ? adminTools : undefined,
      maxSteps: isAdmin ? 10 : undefined, // Allow multiple tool calls for admin
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

        // Track cost for admin dashboard
        await trackUsage(session.id, inputTokens, outputTokens, aiSettings.model as DeepSeekModel)

        // Deduct message cost from balance
        await deductMessageCost(session.id, balanceCheck.usingFreeMessage, balanceCheck.messageCost)
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
        headers: { "Content-Type": "application/json" },
      })
    }

    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get("chatId")

    if (chatId) {
      // Get specific chat messages
      const dbMessages = await sql`
        SELECT id, role, content, created_at
        FROM messages
        WHERE chat_id = ${chatId}
        ORDER BY created_at ASC
      `
      return new Response(JSON.stringify({ messages: dbMessages }), {
        headers: { "Content-Type": "application/json" },
      })
    } else {
      // Get all chats for user
      const chats = await sql`
        SELECT c.id, c.title, c.created_at, c.updated_at,
               (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as message_count
        FROM chats c
        WHERE c.user_id = ${session.id}
        ORDER BY c.updated_at DESC
        LIMIT 50
      `

      // Get comprehensive usage info
      const subscriptions = await sql`
        SELECT 
          plan, 
          messages_used, 
          messages_limit, 
          daily_messages_used,
          extra_credits,
          status
        FROM subscriptions
        WHERE user_id = ${session.id}
      `
      const subscription = subscriptions[0] || {
        plan: "starter",
        messages_used: 0,
        messages_limit: 5,
        daily_messages_used: 0,
        extra_credits: 0,
      }

      // Get user balance data
      const balanceData = await sql`
        SELECT balance, free_messages_used, free_messages_limit 
        FROM user_balances 
        WHERE user_id = ${session.id}
      `
      const userBalance = balanceData[0] || { balance: 0, free_messages_used: 0, free_messages_limit: 100 }
      const freeMessagesRemaining = Math.max(0, (userBalance.free_messages_limit || 100) - (userBalance.free_messages_used || 0))

      const planLimits = AI_LIMITS.dailyLimits[subscription.plan as PlanType] || AI_LIMITS.dailyLimits.starter

      return new Response(
        JSON.stringify({
          chats,
          usage: {
            plan: subscription.plan || "starter",
            monthly: {
              used: userBalance.free_messages_used || 0,
              limit: userBalance.free_messages_limit || 100,
              remaining: freeMessagesRemaining,
            },
            daily: {
              used: subscription.daily_messages_used || 0,
              limit: planLimits.messagesPerDay,
              remaining: Math.max(0, planLimits.messagesPerDay - (subscription.daily_messages_used || 0)),
            },
            balance: Number(userBalance.balance) || 0,
            freeMessagesRemaining: freeMessagesRemaining,
            extraCredits: subscription.extra_credits || 0,
            status: subscription.status || "active",
          },
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    }
  } catch (error) {
    console.error("[Chat API] Get chats error:", error)
    return new Response(JSON.stringify({ error: "Failed to get chats" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
