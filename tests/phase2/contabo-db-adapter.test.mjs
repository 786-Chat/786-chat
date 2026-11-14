import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import vm from "node:vm"

const require = createRequire(import.meta.url)
const ts = require("typescript")
const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../lib/contabo-staging-postgres.ts"), "utf8")
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function fixture(database = "chat786_staging") {
  const calls = []
  let shouldFail = false
  let released = false
  class Pool {
    async query(text, values) {
      calls.push({ text, values })
      return { rows: [{ ok: true }] }
    }
    async connect() {
      return {
        query: async (text, values) => {
          calls.push({ text, values })
          if (shouldFail && text.includes("BROKEN")) throw new Error("simulated query failure")
          return { rows: [{ ok: true }] }
        },
        release: () => { released = true },
      }
    }
    async end() {}
  }
  const exports = {}
  const fakeRequire = id => {
    if (id === "pg") return { Pool }
    throw new Error("Unexpected dependency: " + id)
  }
  vm.runInNewContext(transpiled, {
    exports, require: fakeRequire, URL, process: {
      env: { DATABASE_URL: `postgresql://local:dummy@postgres.internal:5432/${database}` },
    },
  }, { filename: "contabo-staging-postgres.js" })
  return {
    ...exports,
    calls,
    fail() { shouldFail = true },
    isReleased() { return released },
  }
}

test("staging SQL is deferred and parameterized", async () => {
  const { pgSql, calls } = fixture()
  const userValue = "abc' OR 1=1 --"
  const query = pgSql`SELECT * FROM demo WHERE id = ${userValue}`
  assert.equal(calls.length, 0, "query must not execute while constructing transaction batch")
  assert.equal(query.text, "SELECT * FROM demo WHERE id = $1")
  assert.deepEqual([...query.values], [userValue])
  await query
  assert.equal(calls.length, 1)
  assert.equal(calls[0].text, "SELECT * FROM demo WHERE id = $1")
})

test("trusted inline SQL and separately awaited raw SQL are both supported", async () => {
  const { pgSql, calls } = fixture()
  const statement = pgSql`UPDATE t SET updated_at = ${pgSql.unsafe("NOW()")} WHERE id = ${42}`
  assert.equal(statement.text, "UPDATE t SET updated_at = NOW() WHERE id = $1")
  assert.deepEqual([...statement.values], [42])
  await pgSql.unsafe("SELECT 1")
  await pgSql.query("SELECT $1 AS number", [7])
  assert.equal(calls[0].text, "SELECT 1")
  assert.equal(calls[1].text, "SELECT $1 AS number")
  assert.deepEqual([...calls[1].values], [7])
})

test("batch transactions commit atomically and rollback on failure", async () => {
  const mock = fixture()
  const result = await mock.pgTransaction([mock.pgSql`SELECT ${1}`, mock.pgSql`SELECT ${2}`])
  assert.equal(result.length, 2)
  assert.deepEqual(mock.calls.map(x => x.text), ["BEGIN", "SELECT $1", "SELECT $1", "COMMIT"])
  assert.equal(mock.isReleased(), true)

  const broken = fixture()
  broken.fail()
  await assert.rejects(() => broken.pgTransaction([
    broken.pgSql`SELECT ${1}`, broken.pgSql.unsafe("BROKEN SQL"),
  ]), /simulated query failure/)
  assert.deepEqual(broken.calls.map(x => x.text), ["BEGIN", "SELECT $1", "BROKEN SQL", "ROLLBACK"])
  assert.equal(broken.isReleased(), true)
})

test("adapter refuses accidental non-staging database", async () => {
  const { pgSql } = fixture("postgres")
  await assert.rejects(async () => pgSql`SELECT 1`, /refuses non-staging/)
})

test("primary database path retains opt-in gate; admin transactions are gated", () => {
  const db = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../lib/db.ts"), "utf8")
  const admin = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../lib/786-admin/db.ts"), "utf8")
  assert.match(db, /DATABASE_PROVIDER === 'postgres'/)
  assert.match(db, /CONTABO_STAGING_ONLY === '1'/)
  assert.match(db, /: neon\(platformDatabaseUrl\(\)\)/)
  assert.match(admin, /isContaboStagingDatabase\(\)/)
  assert.match(admin, /pgTransaction\(queries/)
})
