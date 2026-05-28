import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"


// Check if user is admin
async function isAdmin(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value
  
  if (!token) return false
  
  const payload = await verifyToken(token)
  if (!payload) return false
  
  const users = await sql`SELECT role FROM users WHERE id = ${payload.id}`
  return users.length > 0 && users[0].role === 'admin'
}

// GET all content
export async function GET(request: NextRequest) {
  try {
    const content = await sql`SELECT * FROM site_content`
    
    // Convert to object format
    const contentMap: Record<string, unknown> = {}
    content.forEach((item: Record<string, unknown>) => {
      if (item.key && typeof item.key === 'string') {
        contentMap[item.key] = item.value
      }
    })
    
    return NextResponse.json({ content: contentMap })
  } catch (error) {
    console.error("Error fetching content:", error)
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 })
  }
}

// POST update content
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { key, value } = body
    
    const valueJson = JSON.stringify(value)
    
    await sql`
      INSERT INTO site_content (key, value, updated_at)
      VALUES (${key}, ${valueJson}::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE SET
        value = ${valueJson}::jsonb,
        updated_at = NOW()
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating content:", error)
    return NextResponse.json({ error: "Failed to update content" }, { status: 500 })
  }
}
