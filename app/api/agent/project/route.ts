import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

// GET - Fetch user's project settings
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projects = await sql`
      SELECT github_username, github_repo, 
             CASE WHEN github_token IS NOT NULL THEN true ELSE false END as has_token,
             vercel_project_id, created_at, updated_at
      FROM user_projects
      WHERE user_id = ${session.id}
    `

    if (projects.length === 0) {
      return NextResponse.json({ project: null })
    }

    return NextResponse.json({ 
      project: {
        github_username: projects[0].github_username,
        github_repo: projects[0].github_repo,
        github_token: projects[0].has_token ? "connected" : null,
        vercel_project_id: projects[0].vercel_project_id,
        connected: projects[0].has_token
      }
    })
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 })
  }
}

// POST - Save or update user's project settings
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { github_username, github_repo, github_token, vercel_project_id } = body

    if (!github_username || !github_repo) {
      return NextResponse.json({ error: "GitHub username and repo are required" }, { status: 400 })
    }

    // Validate GitHub token if provided
    if (github_token) {
      try {
        const testRes = await fetch(`https://api.github.com/repos/${github_username}/${github_repo}`, {
          headers: {
            Authorization: `Bearer ${github_token}`,
            Accept: "application/vnd.github.v3+json"
          }
        })
        
        if (!testRes.ok) {
          return NextResponse.json({ 
            error: "Invalid GitHub token or repository not found",
            message: "Please check your GitHub username, repository name, and token permissions"
          }, { status: 400 })
        }
      } catch (e) {
        return NextResponse.json({ error: "Failed to validate GitHub connection" }, { status: 400 })
      }
    }

    // Check if project exists
    const existing = await sql`
      SELECT id FROM user_projects WHERE user_id = ${session.id}
    `

    if (existing.length > 0) {
      // Update existing
      if (github_token) {
        await sql`
          UPDATE user_projects 
          SET github_username = ${github_username},
              github_repo = ${github_repo},
              github_token = ${github_token},
              vercel_project_id = ${vercel_project_id || null},
              updated_at = NOW()
          WHERE user_id = ${session.id}
        `
      } else {
        await sql`
          UPDATE user_projects 
          SET github_username = ${github_username},
              github_repo = ${github_repo},
              vercel_project_id = ${vercel_project_id || null},
              updated_at = NOW()
          WHERE user_id = ${session.id}
        `
      }
    } else {
      // Insert new
      await sql`
        INSERT INTO user_projects (user_id, github_username, github_repo, github_token, vercel_project_id)
        VALUES (${session.id}, ${github_username}, ${github_repo}, ${github_token || null}, ${vercel_project_id || null})
      `
    }

    return NextResponse.json({ success: true, message: "GitHub connected successfully" })
  } catch (error) {
    console.error("Error saving project:", error)
    return NextResponse.json({ error: "Failed to save project settings" }, { status: 500 })
  }
}

// DELETE - Remove GitHub connection
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await sql`
      DELETE FROM user_projects WHERE user_id = ${session.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json({ error: "Failed to remove connection" }, { status: 500 })
  }
}
