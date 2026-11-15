import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import vm from "node:vm"

const require = createRequire(import.meta.url)
const ts = require("typescript")
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..")

function compiled(path) {
  const code = readFileSync(resolve(root, path), "utf8")
  return ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
}

test("actual 786.Chat and Admin DB exports operate on disposable PostgreSQL 17", async t => {
  const connectionString = process.env.CONTABO_CI_DATABASE_URL
  if (!connectionString) return t.skip("Disposable CI PostgreSQL not configured")
  const url = new URL(connectionString)
  assert.equal(url.pathname, "/chat786_staging")
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname))

  const processStub = { env: {
    DATABASE_URL: connectionString,
    DATABASE_PROVIDER: "postgres",
    CONTABO_STAGING_ONLY: "1",
  } }
  const transpiledModules = new Map()
  let neonCalled = false
  function moduleFor(path) {
    if (transpiledModules.has(path)) return transpiledModules.get(path)
    const output = {}
    transpiledModules.set(path, output)
    const mapping = {
      "@/lib/contabo-staging-postgres": "lib/contabo-staging-postgres.ts",
      "@/lib/db": "lib/db.ts",
    }
    const importFrom = id => {
      if (id === "pg") return require("pg")
      if (id === "@neondatabase/serverless") return {
        neon() { neonCalled = true; throw new Error("Neon must not run during Contabo staging tests") },
      }
      if (mapping[id]) return moduleFor(mapping[id])
      throw new Error("Unexpected import in database adapter: " + id)
    }
    vm.runInNewContext(compiled(path), {
      exports: output,
      require: importFrom,
      process: processStub,
      URL,
    }, { filename: path })
    return output
  }

  // The same entry points used by app pages and Admin workspace.
  const platform = moduleFor("lib/db.ts")
  const admin = moduleFor("lib/786-admin/db.ts")
  assert.equal(platform.isContaboStagingDatabase(), true)
  assert.equal(neonCalled, false)

  const { sql } = platform
  const table = "contabo_platform_ci_probe"
  try {
    await sql.unsafe(`CREATE TABLE IF NOT EXISTS ${table} (id INTEGER PRIMARY KEY, message TEXT NOT NULL)`)
    await sql.unsafe(`TRUNCATE TABLE ${table}`)
    const inserts = [
      sql`INSERT INTO contabo_platform_ci_probe (id, message) VALUES (${11}, ${"alpha"})`,
      sql`INSERT INTO contabo_platform_ci_probe (id, message) VALUES (${12}, ${"beta"})`,
    ]
    await admin.transaction(inserts)
    let rows = await sql`SELECT message FROM contabo_platform_ci_probe WHERE id = ${11}`
    assert.equal(rows[0].message, "alpha")

    await assert.rejects(async () => admin.transaction([
      sql`UPDATE contabo_platform_ci_probe SET message = ${"should roll back"} WHERE id = ${11}`,
      sql`INSERT INTO contabo_platform_ci_probe (id, message) VALUES (${12}, ${"duplicate"})`,
    ]), /duplicate key/i)
    rows = await admin.sql.query("SELECT message FROM contabo_platform_ci_probe WHERE id=$1", [11])
    assert.equal(rows[0].message, "alpha", "Admin transaction must roll back")
    assert.equal(neonCalled, false)
  } finally {
    await moduleFor("lib/contabo-staging-postgres.ts").closePgPool()
  }
})
