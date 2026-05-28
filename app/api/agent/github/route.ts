import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Get user's GitHub credentials
async function getUserGitHub(userId: string) {
  const result = await sql`
    SELECT github_token, github_repo, github_username 
    FROM user_projects 
    WHERE user_id = ${userId} 
    LIMIT 1
  `
  return result[0] || null
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...params } = body

    const github = await getUserGitHub(session.user.id)
    if (!github || !github.github_token) {
      return NextResponse.json({ 
        success: false, 
        error: "GitHub not connected. Please connect your GitHub account in settings." 
      }, { status: 400 })
    }

    const { github_token, github_repo, github_username } = github
    const [owner, repo] = github_repo?.split("/") || [github_username, ""]

    const headers_config = {
      "Authorization": `Bearer ${github_token}`,
      "Accept": "application/vnd.github.v3+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    }

    let result: { success: boolean; message: string; data?: unknown }

    switch (action) {
      case "get_repo": {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: headers_config
        })
        if (response.ok) {
          const data = await response.json()
          result = { success: true, message: "Repository found", data }
        } else {
          result = { success: false, message: "Repository not found" }
        }
        break
      }

      case "list_branches": {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
          headers: headers_config
        })
        if (response.ok) {
          const data = await response.json()
          result = { success: true, message: `Found ${data.length} branches`, data }
        } else {
          result = { success: false, message: "Failed to list branches" }
        }
        break
      }

      case "get_file": {
        const { path: filePath, branch = "main" } = params
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
          { headers: headers_config }
        )
        if (response.ok) {
          const data = await response.json()
          const content = Buffer.from(data.content, "base64").toString("utf-8")
          result = { success: true, message: "File retrieved", data: { ...data, content } }
        } else {
          result = { success: false, message: `File not found: ${filePath}` }
        }
        break
      }

      case "update_file": {
        const { path: filePath, content, message, branch = "main" } = params
        
        // First get the current file to get its SHA
        const getResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
          { headers: headers_config }
        )
        
        let sha = ""
        if (getResponse.ok) {
          const fileData = await getResponse.json()
          sha = fileData.sha
        }
        
        // Update or create the file
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
          {
            method: "PUT",
            headers: headers_config,
            body: JSON.stringify({
              message: message || `Update ${filePath}`,
              content: Buffer.from(content).toString("base64"),
              branch,
              ...(sha ? { sha } : {})
            })
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          result = { success: true, message: `File updated: ${filePath}`, data }
          
          // Log the action
          await sql`
            INSERT INTO agent_actions (user_id, action_type, file_path, commit_sha, created_at)
            VALUES (${session.user.id}, 'github_update', ${filePath}, ${data.commit?.sha || ''}, NOW())
          `
        } else {
          const error = await response.json()
          result = { success: false, message: `Failed to update file: ${error.message || 'Unknown error'}` }
        }
        break
      }

      case "create_branch": {
        const { branch, from = "main" } = params
        
        // Get the SHA of the source branch
        const refResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${from}`,
          { headers: headers_config }
        )
        
        if (!refResponse.ok) {
          result = { success: false, message: `Source branch '${from}' not found` }
          break
        }
        
        const refData = await refResponse.json()
        
        // Create new branch
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/refs`,
          {
            method: "POST",
            headers: headers_config,
            body: JSON.stringify({
              ref: `refs/heads/${branch}`,
              sha: refData.object.sha
            })
          }
        )
        
        if (response.ok) {
          result = { success: true, message: `Branch created: ${branch}` }
        } else {
          const error = await response.json()
          result = { success: false, message: `Failed to create branch: ${error.message}` }
        }
        break
      }

      case "create_pr": {
        const { title, body: prBody, head, base = "main" } = params
        
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/pulls`,
          {
            method: "POST",
            headers: headers_config,
            body: JSON.stringify({
              title,
              body: prBody || "",
              head,
              base
            })
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          result = { success: true, message: `Pull request created: #${data.number}`, data }
        } else {
          const error = await response.json()
          result = { success: false, message: `Failed to create PR: ${error.message}` }
        }
        break
      }

      case "trigger_deploy": {
        // Trigger a Vercel deployment via webhook or API
        const vercelToken = process.env.VERCEL_TOKEN
        const projectId = process.env.VERCEL_PROJECT_ID
        
        if (vercelToken && projectId) {
          const response = await fetch(
            `https://api.vercel.com/v13/deployments`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${vercelToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                name: repo,
                project: projectId,
                target: "production",
                gitSource: {
                  type: "github",
                  repo: github_repo,
                  ref: "main"
                }
              })
            }
          )
          
          if (response.ok) {
            const data = await response.json()
            result = { success: true, message: "Deployment triggered", data: { url: data.url } }
          } else {
            result = { success: false, message: "Failed to trigger deployment" }
          }
        } else {
          result = { success: false, message: "Vercel integration not configured" }
        }
        break
      }

      default:
        result = { success: false, message: `Unknown action: ${action}` }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error("GitHub API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
