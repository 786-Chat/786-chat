import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'

const source = fs.readFileSync('lib/786-chat/deterministic-build-repair.ts', 'utf8')

test('repairs TS2459 when getSql/getDb is declared locally but not exported', () => {
  assert.match(source, /declares \['"\]\(get\(\?:Sql\|Db\)\)\['"\] locally, but it is not exported/)
  assert.match(source, /db-helper-export-contract/)
  assert.match(source, /export \$\{asyncPrefix \|\| ""\}function/)
  assert.match(source, /export \$\{declaration\} \$\{helper\}/)
})
