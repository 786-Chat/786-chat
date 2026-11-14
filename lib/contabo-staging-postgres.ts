/**
 * Contabo PostgreSQL query adapter (STAGING PROTOTYPE ONLY).
 *
 * Not imported by application routes until compatibility tests pass.
 * Uses node-postgres rather than Neon's HTTP-only driver.
 * DO NOT enable in production or point at Neon without an approved cutover.
 */
import { Pool, type PoolClient, type QueryResultRow } from "pg"

type SqlPrimitive = unknown
type SqlStatement = PromiseLike<QueryResultRow[]> & {
  readonly kind: "statement"
  readonly text: string
  readonly values: readonly SqlPrimitive[]
}

let pool: Pool | undefined

function connectionPool(): Pool {
  if (pool) return pool
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error("DATABASE_URL is required")
  const url = new URL(connectionString)
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("DATABASE_URL must use a PostgreSQL connection string")
  }
  if (url.pathname !== "/chat786_staging") {
    throw new Error("Staging PostgreSQL adapter refuses non-staging databases")
  }
  pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  })
  return pool
}

function isInlineSql(value: unknown): value is SqlStatement {
  return typeof value === "object" && value !== null &&
    (value as { kind?: string }).kind === "statement"
}

function compile(parts: readonly string[], params: readonly unknown[]): { text: string; values: unknown[] } {
  if (parts.length !== params.length + 1) throw new Error("SQL template argument mismatch")
  const values: unknown[] = []
  let text = parts[0] ?? ""
  for (let i = 0; i < params.length; i++) {
    const item = params[i]
    if (isInlineSql(item)) {
      const nested = { text: item.text, values: [...item.values] }
      // Rebase parameter placeholders to the outer query.
      const offset = values.length
      text += nested.text.replace(/\$(\d+)/g, (_m, n: string) => `$${Number(n) + offset}`)
      values.push(...nested.values)
    } else {
      values.push(item)
      text += `$${values.length}`
    }
    text += parts[i + 1] ?? ""
  }
  return { text, values }
}

function deferred(text: string, values: readonly unknown[]): SqlStatement {
  let pending: Promise<QueryResultRow[]> | undefined
  const run = () => {
    pending ??= connectionPool().query(text, [...values]).then(result => result.rows)
    return pending
  }
  return {
    kind: "statement",
    text,
    values,
    then(onfulfilled, onrejected) {
      return run().then(onfulfilled, onrejected)
    },
  }
}

/**
 * Build a lazy tagged-template statement. Queries execute when awaited.
 * Statements can be collected first and sent to transaction() atomically.
 */
export function pgSql(parts: TemplateStringsArray, ...values: unknown[]): SqlStatement {
  const query = compile(parts, values)
  return deferred(query.text, query.values)
}

/** Explicit trusted raw SQL only. Never pass untrusted input to unsafe(). */
// Supports both await sql.unsafe("SELECT ...") and ${sql.unsafe("trusted_column")}
pgSql.unsafe = (trustedSql: string): SqlStatement => {
  if (typeof trustedSql !== "string" || !trustedSql.trim()) {
    throw new Error("unsafe() requires a non-empty SQL string")
  }
  // This API does not escape SQL identifiers or raw SQL. Never pass user input.
  return deferred(trustedSql, [])
}

/** Execute multiple deferred statements, sequentially, within one atomic transaction. */
export async function pgTransaction(statements: readonly SqlStatement[]): Promise<QueryResultRow[][]> {
  const client: PoolClient = await connectionPool().connect()
  try {
    await client.query("BEGIN")
    const all: QueryResultRow[][] = []
    for (const statement of statements) {
      if (statement.kind !== "statement") throw new Error("Invalid deferred SQL statement")
      const result = await client.query(statement.text, [...statement.values])
      all.push(result.rows)
    }
    await client.query("COMMIT")
    return all
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

/** Explicitly close the connection pool during tests/shutdown. */
export async function closePgPool(): Promise<void> {
  if (!pool) return
  const current = pool
  pool = undefined
  await current.end()
}
