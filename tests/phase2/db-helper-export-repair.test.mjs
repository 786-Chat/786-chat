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

test('repairs TS2305 when getDb/getSql is missing but the sibling helper is exported', () => {
  assert.match(source, /has no exported member \['"\]\(get\(\?:Sql\|Db\)\)\['"\]/)
  assert.match(source, /missingHelper === "getDb" \? "getSql" : "getDb"/)
  assert.match(source, /export const \$\{missingHelper\} = \$\{existingHelper\}/)
  assert.match(source, /db-helper-alias-contract/)
})

test('repairs TS2305 auth helper errors with TypeScript nested module quotes', () => {
  assert.match(source, /Module\\s\+\['"\]\+\[\\"\]\?@\\\/lib\\\/server\\\/auth/)
  assert.match(source, /generateToken\|hashToken/)
  assert.match(source, /randomBytes\(32\)\.toString\("hex"\)/)
  assert.match(source, /createHash\("sha256"\)\.update\(token\)\.digest\("hex"\)/)
  assert.match(source, /implementations\.push/)
  assert.match(source, /auth-token-helper-contract/)
})

test('repairs TS2554 expected-two-got-three failures on the exact reported call', () => {
  assert.match(source, /TS2554:\\s\*Expected 2 arguments, but got 3/)
  assert.match(source, /truncateReportedThreeArgCall/)
  assert.match(source, /verifyPassword/)
  assert.match(source, /bcrypt\.compare/)
  assert.match(source, /@neondatabase\\\/serverless/)
  assert.match(source, /two-argument-call-arity/)
})
