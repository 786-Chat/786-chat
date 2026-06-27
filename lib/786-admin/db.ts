import { getSql, sql } from "@/lib/db"

export { sql }

export async function transaction<T = unknown>(queries: unknown[]): Promise<T[]> {
  const client = getSql() as unknown as {
    transaction?: (queries: unknown[]) => Promise<T[]>
  }

  if (!client.transaction) {
    throw new Error("Neon transaction API is not available")
  }

  return client.transaction(queries)
}
