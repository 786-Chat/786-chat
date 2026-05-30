import { tool } from "ai"
import { z } from "zod"
import { sql } from "@/lib/db"
import { AGENT_CONFIG } from "@/lib/admin-config"

// GitHub API helper
async function githubApi(endpoint: string, options: RequestInit = {}) {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error("GITHUB_TOKEN not configured")
  
  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GitHub API error: ${response.status} - ${error}`)
  }
  
  return response.json()
}

// Read file from GitHub
export const readFileTool = tool({
  description: "Read a file from the MujeebProAI codebase",
  parameters: z.object({
    path: z.string().describe("File path relative to project root (e.g., 'app/page.tsx')"),
  }),
  execute: async ({ path }) => {
    try {
      const { owner, repo, branch } = AGENT_CONFIG.github
      const data = await githubApi(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`)
      
      if (data.type !== "file") {
        return { error: `${path} is not a file` }
      }
      
      const content = Buffer.from(data.content, "base64").toString("utf-8")
      return { 
        success: true,
        path,
        content,
        size: data.size,
        sha: data.sha,
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to read file" }
    }
  },
})

// Write/Update file on GitHub
export const writeFileTool = tool({
  description: "Write or update a file in the MujeebProAI codebase. Changes will auto-deploy to production.",
  parameters: z.object({
    path: z.string().describe("File path relative to project root"),
    content: z.string().describe("The full content to write to the file"),
    message: z.string().describe("Commit message describing the change"),
  }),
  execute: async ({ path, content, message }) => {
    try {
      const { owner, repo, branch } = AGENT_CONFIG.github
      
      // Get current file SHA if it exists
      let sha: string | undefined
      try {
        const existing = await githubApi(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`)
        sha = existing.sha
      } catch {
        // File doesn't exist, that's fine for new files
      }
      
      // Create or update the file
      const data = await githubApi(`/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        body: JSON.stringify({
          message,
          content: Buffer.from(content).toString("base64"),
          branch,
          ...(sha && { sha }),
        }),
      })
      
      // Log the action
      await sql`
        INSERT INTO agent_actions (tool_name, tool_params, result, status, chat_id)
        VALUES ('write_file', ${JSON.stringify({ path, message })}, ${JSON.stringify({ commit: data.commit?.sha })}, 'success', 'admin')
      `
      
      return {
        success: true,
        path,
        commitSha: data.commit?.sha,
        message: `File ${sha ? "updated" : "created"} successfully. Auto-deploying to production...`,
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to write file" }
    }
  },
})

// Delete file from GitHub
export const deleteFileTool = tool({
  description: "Delete a file from the MujeebProAI codebase",
  parameters: z.object({
    path: z.string().describe("File path to delete"),
    message: z.string().describe("Commit message for deletion"),
  }),
  execute: async ({ path, message }) => {
    try {
      const { owner, repo, branch } = AGENT_CONFIG.github
      
      // Get file SHA
      const existing = await githubApi(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`)
      
      await githubApi(`/repos/${owner}/${repo}/contents/${path}`, {
        method: "DELETE",
        body: JSON.stringify({
          message,
          sha: existing.sha,
          branch,
        }),
      })
      
      return {
        success: true,
        path,
        message: "File deleted successfully",
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to delete file" }
    }
  },
})

// List files in a directory
export const listFilesTool = tool({
  description: "List files in a directory of the MujeebProAI codebase",
  parameters: z.object({
    path: z.string().describe("Directory path (e.g., 'app' or 'components')").default(""),
  }),
  execute: async ({ path }) => {
    try {
      const { owner, repo, branch } = AGENT_CONFIG.github
      const endpoint = path 
        ? `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
        : `/repos/${owner}/${repo}/contents?ref=${branch}`
      
      const data = await githubApi(endpoint)
      
      if (!Array.isArray(data)) {
        return { error: "Path is not a directory" }
      }
      
      const files = data.map((item: any) => ({
        name: item.name,
        type: item.type,
        path: item.path,
        size: item.size,
      }))
      
      return { success: true, path: path || "/", files }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to list files" }
    }
  },
})

// Search code in repository
export const searchCodeTool = tool({
  description: "Search for code patterns in the MujeebProAI codebase",
  parameters: z.object({
    query: z.string().describe("Search query (code pattern to find)"),
  }),
  execute: async ({ query }) => {
    try {
      const { owner, repo } = AGENT_CONFIG.github
      const data = await githubApi(`/search/code?q=${encodeURIComponent(query)}+repo:${owner}/${repo}`)
      
      const results = data.items?.slice(0, 10).map((item: any) => ({
        path: item.path,
        name: item.name,
        url: item.html_url,
      })) || []
      
      return { success: true, query, results, totalCount: data.total_count }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to search code" }
    }
  },
})

// Get database info
export const getDatabaseInfoTool = tool({
  description: "Get information about database tables and structure",
  parameters: z.object({
    tableName: z.string().optional().describe("Specific table name, or leave empty for all tables"),
  }),
  execute: async ({ tableName }) => {
    try {
      if (tableName) {
        // Get columns for specific table
        const columns = await sql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = ${tableName}
          ORDER BY ordinal_position
        `
        return { success: true, table: tableName, columns }
      } else {
        // List all tables
        const tables = await sql`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name
        `
        return { success: true, tables: tables.map((t: any) => t.table_name) }
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to get database info" }
    }
  },
})

// Run database query (read-only)
export const queryDatabaseTool = tool({
  description: "Run a read-only SQL query on the database",
  parameters: z.object({
    query: z.string().describe("SQL SELECT query to run"),
  }),
  execute: async ({ query }) => {
    try {
      // Basic safety check - only allow SELECT
      const upperQuery = query.trim().toUpperCase()
      if (!upperQuery.startsWith("SELECT")) {
        return { error: "Only SELECT queries are allowed" }
      }
      
      const result = await sql.query(query)
      return { 
        success: true, 
        rowCount: result.length,
        rows: result.slice(0, 100), // Limit to 100 rows
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Query failed" }
    }
  },
})

// All admin agent tools
export const adminAgentTools = {
  read_file: readFileTool,
  write_file: writeFileTool,
  delete_file: deleteFileTool,
  list_files: listFilesTool,
  search_code: searchCodeTool,
  get_database_info: getDatabaseInfoTool,
  query_database: queryDatabaseTool,
}
