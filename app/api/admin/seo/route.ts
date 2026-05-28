import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

const sql = neon(process.env.DATABASE_URL!)

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

// GET all SEO settings
export async function GET(request: NextRequest) {
  try {
    const seo = await sql`SELECT * FROM seo_settings`
    
    // Convert to object format
    const seoMap: Record<string, unknown> = {}
    seo.forEach((item: Record<string, unknown>) => {
      if (item.page && typeof item.page === 'string') {
        seoMap[item.page] = {
          title: item.title,
          description: item.description,
          keywords: item.keywords,
          og_image: item.og_image
        }
      }
    })
    
    return NextResponse.json({ seo: seoMap })
  } catch (error) {
    console.error("Error fetching SEO:", error)
    return NextResponse.json({ error: "Failed to fetch SEO settings" }, { status: 500 })
  }
}

// POST update SEO
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { page, title, description, keywords, og_image } = body
    
    await sql`
      INSERT INTO seo_settings (page, title, description, keywords, og_image, updated_at)
      VALUES (${page}, ${title}, ${description}, ${keywords}, ${og_image}, NOW())
      ON CONFLICT (page) DO UPDATE SET
        title = ${title},
        description = ${description},
        keywords = ${keywords},
        og_image = ${og_image},
        updated_at = NOW()
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating SEO:", error)
    return NextResponse.json({ error: "Failed to update SEO settings" }, { status: 500 })
  }
}
