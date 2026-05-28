import { streamText, convertToModelMessages, consumeStream, UIMessage, tool } from "ai"
import { createDeepSeek } from "@ai-sdk/deepseek"
import { getSql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { BILLING_PLANS, type PlanId } from "@/lib/billing"
import { checkAIProtection, recordUsage, withTimeout, type ProtectionResult } from "@/lib/ai-protection"
import { AI_LIMITS, estimateTokens, type PlanType } from "@/lib/ai-limits"
import { checkBudgetLimits } from "@/lib/ai-spending"
import { canSendMessage, deductMessageCost, getUserBalance, getPricingSettings } from "@/lib/ai-balance"
import { getAISettings, trackUsage, checkUserDailyLimit, type DeepSeekModel } from "@/lib/ai-settings"
import { z } from "zod"
import { isAdmin } from "@/lib/admin-check"


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

    // Check if user is admin (skip all limits for admins)
    const isUserAdmin = isAdmin(session.email)

    // === GLOBAL BUDGET CHECK === (skip for admins)
    if (!isUserAdmin) {
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

    // === USER BALANCE CHECK === (skip for admins)
    if (!isUserAdmin) {
      const balanceCheck = await canSendMessage(session.id)
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
    }

    const body = await request.json()
    const messages: UIMessage[] = body.messages
    const chatId: string | null = body.chatId

    // Get user's subscription and plan
    const subscriptions = await getSql()`
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
      await getSql()`
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
      await getSql()`
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

      const newChat = await getSql()`
        INSERT INTO chats (user_id, title)
        VALUES (${session.id}, ${title})
        RETURNING id
      `
      currentChatId = newChat[0].id
    }

    // Save user message to database
    if (userText) {
      await getSql()`
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

    // Check user daily limit (skip for admins)
    if (!isUserAdmin) {
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

    // Check if user has agent mode enabled (Pro+ plans)
    // For editing mujeebproai.com, only admins are allowed
    // Regular users can only edit their own projects
    const userEmail = session?.email || null
    const hasAgentMode = (userPlan !== "starter" && userPlan !== "basic") || isUserAdmin
    
    // Define agent tools for Pro+ users
    const agentTools = hasAgentMode ? {
      read_file: tool({
        description: "Read the contents of a file from the user's project",
        parameters: z.object({
          file_path: z.string().describe("The path to the file to read")
        }),
        execute: async ({ file_path }) => {
          const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/agent/tools`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tool: "read_file", params: { file_path } })
          })
          return await res.json()
        }
      }),
      write_file: tool({
        description: "Write or create a file in the user's project",
        parameters: z.object({
          file_path: z.string().describe("The path to write the file"),
          content: z.string().describe("The content to write")
        }),
        execute: async ({ file_path, content }) => {
          const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/agent/tools`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tool: "write_file", params: { file_path, content } })
          })
          return await res.json()
        }
      }),
      edit_file: tool({
        description: "Edit a specific part of a file by replacing text",
        parameters: z.object({
          file_path: z.string().describe("The path to the file"),
          old_text: z.string().describe("The text to find and replace"),
          new_text: z.string().describe("The replacement text")
        }),
        execute: async ({ file_path, old_text, new_text }) => {
          const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/agent/tools`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tool: "edit_file", params: { file_path, old_text, new_text } })
          })
          return await res.json()
        }
      }),
      list_files: tool({
        description: "List files in a directory",
        parameters: z.object({
          directory: z.string().describe("The directory path to list")
        }),
        execute: async ({ directory }) => {
          const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/agent/tools`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tool: "list_files", params: { directory } })
          })
          return await res.json()
        }
      }),
      search_code: tool({
        description: "Search for text or patterns in the codebase",
        parameters: z.object({
          pattern: z.string().describe("The search pattern or text")
        }),
        execute: async ({ pattern }) => {
          const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/agent/tools`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tool: "search_code", params: { pattern } })
          })
          return await res.json()
        }
      }),
      deploy_site: tool({
        description: "Deploy the user's site to production",
        parameters: z.object({
          message: z.string().optional().describe("Deployment commit message")
        }),
        execute: async ({ message }) => {
          const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/agent/github`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "trigger_deploy", message })
          })
          return await res.json()
        }
      }),
    } : undefined

    // Stream response from DeepSeek with dynamic settings
    const result = await streamText({
      model: deepseek(aiSettings.model as "deepseek-chat" | "deepseek-reasoner"),
      system: hasAgentMode 
        ? `${aiSettings.systemPrompt}\n\nYou are an AI agent with the ability to read, edit, and write files in the user's project. You can also deploy their site. When the user asks you to make changes to their code or website, use the available tools to do so. Always confirm what changes you made after completing them.`
        : `${aiSettings.systemPrompt}\n\nYou are a helpful coding assistant. When the user asks you to create code, provide complete working code in markdown code blocks. You do NOT have access to file tools - just output code directly for the user to copy. Never try to call functions like read_file or write_file.`,
      messages: modelMessages,
      temperature: aiSettings.temperature,
      maxTokens: aiSettings.maxTokens,
      abortSignal: request.signal,
      ...(agentTools ? { tools: agentTools, maxSteps: 10 } : {}),
    })

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: async ({ messages: allMessages, usage }: { messages: UIMessage[]; usage?: { completionTokens?: number } }) => {
        // Save assistant response to database
        const lastAssistant = allMessages.filter((m) => m.role === "assistant").pop()
        if (lastAssistant) {
          const assistantText = getMessageText(lastAssistant)
          if (assistantText) {
            await getSql()`
              INSERT INTO messages (chat_id, role, content)
              VALUES (${currentChatId}, 'assistant', ${assistantText})
            `
          }
        }

        // Update chat timestamp
        await getSql()`
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
      const dbMessages = await getSql()`
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
      const chats = await getSql()`
        SELECT c.id, c.title, c.created_at, c.updated_at,
               (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as message_count
        FROM chats c
        WHERE c.user_id = ${session.id}
        ORDER BY c.updated_at DESC
        LIMIT 50
      `

      // Get comprehensive usage info
      const subscriptions = await getSql()`
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
      const balanceData = await getSql()`
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
