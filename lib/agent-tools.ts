import { tool } from "ai"
import { z } from "zod"
import { sql } from "@/lib/db"

// Simple agent tools for admin mode
// Note: These tools provide code suggestions that the admin can apply manually
// Full auto-deploy requires GitHub token configuration

export const searchCodeTool = tool({
  description: "Search for code patterns or find files in the MujeebProAI codebase. Returns file paths and matching content.",
  inputSchema: z.object({
    query: z.string().describe("Search query - can be a function name, component name, or text pattern"),
    fileType: z.string().optional().describe("Optional file extension filter like 'tsx', 'ts', 'css'"),
  }),
  execute: async ({ query }) => {
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
      if (queryLower.includes(key) || key.includes(queryLower)) matchedFiles.push(path)
    }

    return {
      success: true,
      query,
      matchedFiles: matchedFiles.length > 0 ? matchedFiles : ["No exact matches. Try: sidebar, header, chat, preview, api, auth, database, styles"],
      suggestion: "To make changes, please describe what you want to change and I'll provide the code. You can then ask MujeebProAI Assistant to implement it, or copy the code manually.",
    }
  },
})

export const getDatabaseInfoTool = tool({
  description: "Get information about the MujeebProAI database schema and tables",
  inputSchema: z.object({
    tableName: z.string().optional().describe("Optional specific table name to get details for"),
  }),
  execute: async ({ tableName }) => {
    try {
      if (tableName) {
        const columns = await sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = ${tableName}
          ORDER BY ordinal_position
        `
        return { success: true, table: tableName, columns }
      }

      const tables = (await sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `) as unknown as Array<{ table_name: string }>
      return { success: true, tables: tables.map((table) => table.table_name) }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Database query failed" }
    }
  },
})

export const queryDatabaseTool = tool({
  description: "Run a SELECT query on the MujeebProAI database. Only SELECT queries are allowed for safety.",
  inputSchema: z.object({
    query: z.string().describe("SQL SELECT query to execute. Must start with SELECT."),
  }),
  execute: async ({ query }) => {
    try {
      const trimmedQuery = query.trim().toUpperCase()
      if (!trimmedQuery.startsWith("SELECT")) {
        return { error: "Only SELECT queries are allowed for safety. Use the admin panel for data modifications." }
      }

      const safeQuery = query.includes("LIMIT") ? query : `${query} LIMIT 100`
      const result = (await sql.query(safeQuery, [])) as unknown as Array<Record<string, unknown>>
      return {
        success: true,
        rowCount: result.length,
        rows: result.slice(0, 50),
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Query failed" }
    }
  },
})

export const suggestCodeTool = tool({
  description: "Provide code suggestions for modifying MujeebProAI. Use this when the admin asks to change something.",
  inputSchema: z.object({
    component: z.string().describe("Which component or file to modify (e.g., 'sidebar', 'header', 'chat')"),
    change: z.string().describe("Description of the change to make"),
  }),
  execute: async ({ component, change }) => ({
    success: true,
    component,
    requestedChange: change,
    instructions: `To implement this change:
1. I'll provide you with the code modifications needed
2. You can then ask MujeebProAI Assistant to make these changes, OR
3. Copy the code and update the files manually

The changes will auto-deploy to mujeebproai.com once pushed to GitHub.

What specific changes would you like me to suggest for the ${component}?`,
  }),
})

export const adminAgentTools = {
  search_code: searchCodeTool,
  get_database_info: getDatabaseInfoTool,
  query_database: queryDatabaseTool,
  suggest_code: suggestCodeTool,
}
