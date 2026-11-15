import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import vm from "node:vm"

const require = createRequire(import.meta.url)
const databaseUrl = process.env.CONTABO_CI_DATABASE_URL

test("PostgreSQL 17 integration: queries, atomic commit and rollback", async (t) => {
  if (!databaseUrl) return t.skip("CONTABO_CI_DATABASE_URL is not provided")
  const parsed = new URL(databaseUrl)
  assert.equal(parsed.pathname, "/chat786_staging", "tests may only use the disposable staging DB")
  assert.ok(["127.0.0.1", "localhost"].includes(parsed.hostname), "integration tests refuse a remote database")

  const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../lib/contabo-staging-postgres.ts"), "utf8")
  const ts = require("typescript")
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}
  vm.runInNewContext(compiled, {
    exports, require, URL, process: { env: { DATABASE_URL: databaseUrl } },
  }, { filename: "contabo-staging-postgres.js" })
  const { pgSql, pgTransaction, closePgPool } = exports
  const table = "contabo_stage_ci_probe"

  try {
    // GitHub CI starts a disposable PostgreSQL service, not the user's server.
    await pgSql.unsafe(`CREATE TABLE IF NOT EXISTS ${table} (id INTEGER PRIMARY KEY, message TEXT NOT NULL)`)
    await pgSql.unsafe(`TRUNCATE TABLE ${table}`)

    await pgTransaction([
      pgSql`INSERT INTO contabo_stage_ci_probe(id, message) VALUES (${1}, ${"original"})`,
      pgSql`INSERT INTO contabo_stage_ci_probe(id, message) VALUES (${2}, ${"second"})`,
    ])
    let rows = await pgSql`SELECT id, message FROM contabo_stage_ci_probe ORDER BY id`
    assert.deepEqual(Array.from(rows, x => [x.id, x.message]), [
      [1, "original"], [2, "second"],
    ])

    await assert.rejects(
      () => pgTransaction([
        pgSql`UPDATE contabo_stage_ci_probe SET message = ${"should rollback"} WHERE id = ${1}`,
        pgSql`INSERT INTO contabo_stage_ci_probe(id, message) VALUES (${2}, ${"duplicate"})`,
      ]),
      /duplicate key/i,
    )
    rows = await pgSql`SELECT message FROM contabo_stage_ci_probe WHERE id = ${1}`
    assert.equal(rows[0].message, "original", "failed transaction must roll back earlier mutations")

    rows = await pgSql.query("SELECT message FROM contabo_stage_ci_probe WHERE id = $1", [2])
    assert.equal(rows[0].message, "second")
    await assert.rejects(async () => await pgSql`SELECT * FROM a_table_that_does_not_exist`, /does not exist/i)
  } finally {
    await closePgPool()
  }
})
