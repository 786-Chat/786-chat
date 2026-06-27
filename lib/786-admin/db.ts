// Reuses the existing Neon-backed `sql` from lib/db.ts for ordinary
// tagged-template queries. Adds a `transaction(queries)` helper backed by a
// lazily-instantiated Neon HTTP client so the admin scope can persist
// project + files + preview_state + messages atomically (all-or-nothing).
import { neon } from "@neondatabase/serverless"
import { sql } from "@/lib/db"

export { sql }

type NeonSqlClient = ReturnType<typeof neon>

let txClient: NeonSqlClient | null = null

function getTxClient(): NeonSqlClient {
  if (!txClient) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }
    txClient = neon(process.env.DATABASE_URL)
  }
  return txClient
}

// Run multiple queries (built via the `sql` tagged template above) in a
// single Neon HTTP transaction. If any query fails, the whole transaction
// is rolled back. Returns the array of query results in input order.
export async function transaction<T = unknown>(
  queries: unknown[]
): Promise<T[]> {
  const client = getTxClient() as unknown as {
    transaction: (q: unknown[]) => Promise<T[]>
  }
  // Read the method off the client object so `this` binds correctly.
  return client.transaction(queries)
}
