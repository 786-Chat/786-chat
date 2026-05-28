import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const chats = await sql`
      SELECT 
        c.id,
        u.name as user_name,
        u.email as user_email,
        c.title,
        (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id) as message_count,
        c.created_at,
        c.updated_at
      FROM chats c
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY c.updated_at DESC
      LIMIT 100
    `

    return NextResponse.json({ chats })
  } catch (error) {
    console.error("Failed to fetch chats:", error)
    return NextResponse.json({ chats: [] })
  }
}
