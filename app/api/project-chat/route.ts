import { streamText, tool } from "ai"
import { z } from "zod"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { getAISettings } from "@/lib/ai-settings"
import { createDeepSeek } from "@ai-sdk/deepseek"

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { messages, siteId, siteName, subdomain, siteConfig, siteContent } = await request.json()

    // Verify user owns this site
    const siteCheck = await sql`
      SELECT id, user_id, site_name, subdomain, site_config, site_content
      FROM customer_sites 
      WHERE id = ${siteId} AND user_id = ${session.user.id}
    `

    if (siteCheck.length === 0) {
      return new Response("Site not found", { status: 404 })
    }

    const site = siteCheck[0]
    const aiSettings = await getAISettings()
    const deepseek = createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY })

    // System prompt for project-specific AI assistant
    const systemPrompt = `You are an AI assistant helping a customer customize their website "${siteName}" (${subdomain}.mujeebproai.com).

CURRENT SITE CONFIGURATION:
${JSON.stringify(siteConfig || {}, null, 2)}

CURRENT SITE CONTENT:
${JSON.stringify(siteContent || {}, null, 2)}

You have tools to:
1. update_site_config - Change colors, fonts, and design settings
2. update_site_content - Change text, titles, descriptions
3. get_current_site - Get the current site configuration

IMPORTANT: All changes are AUTO-SAVED and AUTO-PUBLISHED instantly. The customer does NOT need to click any deploy/publish button.

When the user asks to change something:
1. Understand what they want to change
2. Use the appropriate tool to make the change
3. Confirm the changes - they are ALREADY LIVE on their website!

Be helpful, friendly, and creative. Suggest improvements when appropriate.`

    // Project-specific tools
    const projectTools = {
      update_site_config: tool({
        description: "Update the site design configuration (colors, fonts, borders, etc.) - Changes go LIVE instantly",
        inputSchema: z.object({
          primaryColor: z.string().optional().describe("Primary brand color in hex format"),
          secondaryColor: z.string().optional().describe("Secondary color in hex format"),
          backgroundColor: z.string().optional().describe("Background color in hex format"),
          textColor: z.string().optional().describe("Text color in hex format"),
          fontFamily: z.string().optional().describe("Font family name"),
          borderRadius: z.string().optional().describe("Border radius in px"),
        }),
        execute: async (updates) => {
          try {
            const currentConfig = site.site_config || {}
            const newConfig = { ...currentConfig, ...updates }
            
            // Auto-save AND auto-publish - no button needed
            await sql`
              UPDATE customer_sites 
              SET site_config = ${JSON.stringify(newConfig)}, 
                  is_published = true,
                  updated_at = NOW()
              WHERE id = ${siteId}
            `
            
            return { 
              success: true, 
              message: "Changes saved and LIVE on your website!",
              changes: updates,
              newConfig
            }
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to update config" }
          }
        },
      }),

      update_site_content: tool({
        description: "Update the site content (text, titles, descriptions) - Changes go LIVE instantly",
        inputSchema: z.object({
          section: z.enum(["hero", "about", "contact", "footer", "services", "testimonials"]).describe("Which section to update"),
          updates: z.record(z.string()).describe("Key-value pairs of content to update"),
        }),
        execute: async ({ section, updates }) => {
          try {
            const currentContent = site.site_content || {}
            const sectionContent = currentContent[section] || {}
            const newSectionContent = { ...sectionContent, ...updates }
            const newContent = { ...currentContent, [section]: newSectionContent }
            
            // Auto-save AND auto-publish - no button needed
            await sql`
              UPDATE customer_sites 
              SET site_content = ${JSON.stringify(newContent)}, 
                  is_published = true,
                  updated_at = NOW()
              WHERE id = ${siteId}
            `
            
            return { 
              success: true, 
              message: `${section} section updated and LIVE on your website!`,
              changes: updates
            }
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to update content" }
          }
        },
      }),

      get_current_site: tool({
        description: "Get the current site configuration and content",
        inputSchema: z.object({
          dummy: z.boolean().optional().describe("Unused parameter"),
        }),
        execute: async () => {
          const currentSite = await sql`
            SELECT site_config, site_content, site_name, subdomain, is_published
            FROM customer_sites 
            WHERE id = ${siteId}
          `
          
          if (currentSite.length === 0) {
            return { success: false, error: "Site not found" }
          }
          
          return { 
            success: true,
            site: currentSite[0]
          }
        },
      }),

      add_feature: tool({
        description: "Add a new feature to the features section - Changes go LIVE instantly",
        inputSchema: z.object({
          title: z.string().describe("Feature title"),
          description: z.string().describe("Feature description"),
          icon: z.string().optional().describe("Icon name (star, zap, shield, heart, etc.)"),
        }),
        execute: async ({ title, description, icon }) => {
          try {
            const currentContent = site.site_content || {}
            const features = currentContent.features || []
            features.push({ title, description, icon: icon || "star" })
            const newContent = { ...currentContent, features }
            
            // Auto-save AND auto-publish - no button needed
            await sql`
              UPDATE customer_sites 
              SET site_content = ${JSON.stringify(newContent)}, 
                  is_published = true,
                  updated_at = NOW()
              WHERE id = ${siteId}
            `
            
            return { 
              success: true, 
              message: `Feature "${title}" added and LIVE on your website!`
            }
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to add feature" }
          }
        },
      }),
    }

    const result = await streamText({
      model: deepseek(aiSettings.model as "deepseek-chat" | "deepseek-reasoner"),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 2048,
      tools: projectTools,
      maxSteps: 5,
      abortSignal: request.signal,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Project chat error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
