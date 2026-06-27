import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import { sql } from "@/lib/786-admin/db"

export async function POST() {
  const session = await getSession()
  const email = session?.email
  if (!isAdminUser(email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const schemaPath = path.join(process.cwd(), "lib", "786-admin", "schema.sql")
  let schemaSql: string
  try {
    schemaSql = await fs.readFile(schemaPath, "utf-8")
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not read lib/786-admin/schema.sql",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }

  const lower = schemaSql.toLowerCase()
  const forbidden = ["drop table", "drop index", "alter table", "truncate", "delete from"]
  for (const keyword of forbidden) {
    if (lower.includes(keyword)) {
      return NextResponse.json(
        { error: `Refusing to run schema.sql: contains forbidden keyword "${keyword}".` },
        { status: 400 }
      )
    }
  }

  const cleaned = schemaSql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")

  const statements = cleaned
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  const results: { statement: string; ok: boolean; error?: string }[] = []
  for (const statement of statements) {
    try {
      await (sql as unknown as {
        query: (text: string) => Promise<unknown>
      }).query(statement)
      results.push({ statement: statement.split("\n")[0].slice(0, 80), ok: true })
    } catch (error) {
      results.push({
        statement: statement.split("\n")[0].slice(0, 80),
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const failed = results.filter((r) => !r.ok).length
  return NextResponse.json({
    success: failed === 0,
    total: results.length,
    failed,
    results,
  })
}
