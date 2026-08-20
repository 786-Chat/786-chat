import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'

const helper = fs.readFileSync('lib/786-chat/db-helper-contract-repair.ts', 'utf8')
const repair = fs.readFileSync('lib/786-chat/deterministic-build-repair.ts', 'utf8')

test('matches TypeScript nested quote TS2305 for generated getDb/getSql imports', () => {
  assert.match(helper, /Module\\s\+\['"\]\+\[\\"\]\?@\\\/lib\\\/server\\\/db/)
  assert.match(helper, /has no exported member\\s\+\['"\]\(get\(\?:Sql\|Db\)\)\['"\]/)
})

test('exports a locally declared missing DB helper or aliases the exported sibling', () => {
  assert.match(helper, /export \$\{asyncPrefix \|\| ""\}function \$\{helper\}/)
  assert.match(helper, /export \$\{declaration\} \$\{helper\}/)
  assert.match(helper, /export const \$\{helper\} = \$\{sibling\}/)
})

test('runs robust DB helper contract repair before later build repairs', () => {
  assert.match(repair, /repairMissingGeneratedDbHelper/)
  assert.match(repair, /db-helper-nested-quote-contract/)
  assert.match(repair, /repairMissingGeneratedDbHelper\(files, logs\)/)
})
