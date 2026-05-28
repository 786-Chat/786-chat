import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"
import { promises as fs } from "fs"
import path from "path"
import { isAdmin, canEditProject } from "@/lib/admin-check"

// Lazy-load database connection
function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not configured")
  }
  return neon(process.env.DATABASE_URL)
}

// Get user's project directory (stored in database)
async function getUserProjectPath(userId: string): Promise<string | null> {
  const sql = getDb()
  const result = await sql`
    SELECT github_repo, project_path FROM user_projects WHERE user_id = ${userId} LIMIT 1
  `
  if (result.length > 0 && result[0].project_path) {
    return result[0].project_path
  }
  return null
}

// Security: Validate file path is within user's project
function validatePath(basePath: string, requestedPath: string): string | null {
  const fullPath = path.resolve(basePath, requestedPath)
  if (!fullPath.startsWith(basePath)) {
    return null // Path traversal attempt
  }
  return fullPath
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { tool, params } = body

    // Get user's project path
    const projectPath = await getUserProjectPath(session.id)
    if (!projectPath) {
      return NextResponse.json({ 
        success: false, 
        error: "No project connected. Please connect your GitHub repository first." 
      }, { status: 400 })
    }

    let result: { success: boolean; message: string; data?: unknown }

    switch (tool) {
      case "read_file": {
        const filePath = validatePath(projectPath, params.file_path)
        if (!filePath) {
          return NextResponse.json({ success: false, error: "Invalid file path" }, { status: 400 })
        }
        try {
          const content = await fs.readFile(filePath, "utf-8")
          result = { success: true, message: "File read successfully", data: { content, path: params.file_path } }
        } catch {
          result = { success: false, message: `File not found: ${params.file_path}` }
        }
        break
      }

      case "write_file": {
        const filePath = validatePath(projectPath, params.file_path)
        if (!filePath) {
          return NextResponse.json({ success: false, error: "Invalid file path" }, { status: 400 })
        }
        try {
          // Ensure directory exists
          await fs.mkdir(path.dirname(filePath), { recursive: true })
          await fs.writeFile(filePath, params.content, "utf-8")
          result = { success: true, message: `File written: ${params.file_path}`, data: { path: params.file_path } }
          
          // Log the action
          const sql = getDb()
          await sql`
            INSERT INTO agent_actions (user_id, action_type, file_path, created_at)
            VALUES (${session.id}, 'write_file', ${params.file_path}, NOW())
          `
        } catch (e) {
          result = { success: false, message: `Failed to write file: ${e}` }
        }
        break
      }

      case "edit_file": {
        const filePath = validatePath(projectPath, params.file_path)
        if (!filePath) {
          return NextResponse.json({ success: false, error: "Invalid file path" }, { status: 400 })
        }
        try {
          const content = await fs.readFile(filePath, "utf-8")
          if (!content.includes(params.old_text)) {
            result = { success: false, message: "Text to replace not found in file" }
          } else {
            const newContent = content.replace(params.old_text, params.new_text)
            await fs.writeFile(filePath, newContent, "utf-8")
            result = { success: true, message: `File edited: ${params.file_path}` }
            
            // Log the action
            const sql = getDb()
            await sql`
              INSERT INTO agent_actions (user_id, action_type, file_path, created_at)
              VALUES (${session.id}, 'edit_file', ${params.file_path}, NOW())
            `
          }
        } catch {
          result = { success: false, message: `File not found: ${params.file_path}` }
        }
        break
      }

      case "list_files": {
        const dirPath = validatePath(projectPath, params.directory || ".")
        if (!dirPath) {
          return NextResponse.json({ success: false, error: "Invalid directory path" }, { status: 400 })
        }
        try {
          const files = await fs.readdir(dirPath, { withFileTypes: true })
          const fileList = files.map(f => ({
            name: f.name,
            type: f.isDirectory() ? "directory" : "file",
            path: path.join(params.directory || ".", f.name)
          }))
          result = { success: true, message: `Listed ${files.length} items`, data: fileList }
        } catch {
          result = { success: false, message: `Directory not found: ${params.directory}` }
        }
        break
      }

      case "search_code": {
        // Simple text search in project files
        try {
          const searchResults: { file: string; line: number; content: string }[] = []
          const pattern = params.pattern as string
          
          async function searchDir(dir: string) {
            const entries = await fs.readdir(dir, { withFileTypes: true })
            for (const entry of entries) {
              const fullPath = path.join(dir, entry.name)
              if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
                await searchDir(fullPath)
              } else if (entry.isFile()) {
                const ext = path.extname(entry.name)
                if ([".ts", ".tsx", ".js", ".jsx", ".css", ".json", ".md"].includes(ext)) {
                  try {
                    const content = await fs.readFile(fullPath, "utf-8")
                    const lines = content.split("\n")
                    lines.forEach((line, i) => {
                      if (line.includes(pattern)) {
                        searchResults.push({
                          file: path.relative(projectPath, fullPath),
                          line: i + 1,
                          content: line.trim().substring(0, 100)
                        })
                      }
                    })
                  } catch {
                    // Skip files that can't be read
                  }
                }
              }
            }
          }
          
          await searchDir(projectPath)
          result = { success: true, message: `Found ${searchResults.length} matches`, data: searchResults.slice(0, 50) }
        } catch (e) {
          result = { success: false, message: `Search failed: ${e}` }
        }
        break
      }

      default:
        result = { success: false, message: `Unknown tool: ${tool}` }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error("Agent tool error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
