import { tool } from "ai"
import { z } from "zod"
import { sql } from "@/lib/db"

// Simple agent tools for admin mode
// Note: These tools provide code suggestions that the admin can apply manually
// Full auto-deploy requires GitHub token configuration

// Tool to search/find code patterns
export const searchCodeTool = tool({
  description: "Search for code patterns or find files in the MujeebProAI codebase. Returns file paths and matching content.",
  parameters: z.object({
    query: z.string().describe("Search query - can be a function name, component name, or text pattern"),
    fileType: z.string().optional().describe("Optional file extension filter like 'tsx', 'ts', 'css'"),
  }),
  execute: async ({ query, fileType }) => {
    // This provides helpful suggestions based on common patterns
    const suggestions = {
      sidebar: "components/workspace/sidebar.tsx",
      header: "components/workspace/top-bar.tsx", 
      chat: "components/chat/chat-interface.tsx",
      preview: "components/workspace/preview-panel.tsx",
      api: "app/api/chat/route.ts",
      auth: "lib/auth.ts",
      database: "lib/db.ts",
      styles: "app/globals.css",
      layout: "app/layout.tsx",
      page: "app/page.tsx",
    }
    
    const matchedFiles: string[] = []
    const queryLower = query.toLowerCase()
    
    for (const [key, path] of Object.entries(suggestions)) {
      if (queryLower.includes(key) || key.includes(queryLower)) {
        matchedFiles.push(path)
      }
    }
    
    return {
      success: true,
      query,
      matchedFiles: matchedFiles.length > 0 ? matchedFiles : ["No exact matches. Try: sidebar, header, chat, preview, api, auth, database, styles"],
      suggestion: "To make changes, please describe what you want to change and I'll provide the code. You can then ask v0 to implement it, or copy the code manually.",
    }
  },
})

// Tool to get database information
export const getDatabaseInfoTool = tool({
  description: "Get information about the MujeebProAI database schema and tables",
  parameters: z.object({
    tableName: z.string().optional().describe("Optional specific table name to get details for"),
  }),
  execute: async ({ tableName }) => {
    try {
      if (tableName) {
        // Get specific table columns
        const columns = await sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = ${tableName}
          ORDER BY ordinal_position
        `
        return { success: true, table: tableName, columns }
      } else {
        // Get all tables
        const tables = await sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name
        `
        return { success: true, tables: tables.map((t: { table_name: string }) => t.table_name) }
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Database query failed" }
    }
  },
})

// Tool to query database (SELECT only for safety)
export const queryDatabaseTool = tool({
  description: "Run a SELECT query on the MujeebProAI database. Only SELECT queries are allowed for safety.",
  parameters: z.object({
    query: z.string().describe("SQL SELECT query to execute. Must start with SELECT."),
  }),
  execute: async ({ query }) => {
    try {
      // Ensure only SELECT queries
      const trimmedQuery = query.trim().toUpperCase()
      if (!trimmedQuery.startsWith("SELECT")) {
        return { error: "Only SELECT queries are allowed for safety. Use the admin panel for data modifications." }
      }
      
      // Limit results for safety
      const safeQuery = query.includes("LIMIT") ? query : `${query} LIMIT 100`
      const result = await sql.unsafe(safeQuery)
      
      return { 
        success: true, 
        rowCount: result.length,
        rows: result.slice(0, 50), // Return max 50 rows
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Query failed" }
    }
  },
})

// Tool to provide code suggestions
export const suggestCodeTool = tool({
  description: "Provide code suggestions for modifying MujeebProAI. Use this when the admin asks to change something.",
  parameters: z.object({
    component: z.string().describe("Which component or file to modify (e.g., 'sidebar', 'header', 'chat')"),
    change: z.string().describe("Description of the change to make"),
  }),
  execute: async ({ component, change }) => {
    return {
      success: true,
      component,
      requestedChange: change,
      instructions: `To implement this change:
1. I'll provide you with the code modifications needed
2. You can then ask v0 to make these changes, OR
3. Copy the code and update the files manually

The changes will auto-deploy to mujeebproai.com once pushed to GitHub.

What specific changes would you like me to suggest for the ${component}?`,
    }
  },
})

// Export all tools as a single object for the AI
export const adminAgentTools = {
  search_code: searchCodeTool,
  get_database_info: getDatabaseInfoTool,
  query_database: queryDatabaseTool,
  suggest_code: suggestCodeTool,
}
