import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'

const source = fs.readFileSync('lib/786-chat/deterministic-build-repair.ts', 'utf8')

test('repairs Neon query method on getSql/getDb call expressions', () => {
  assert.match(source, /get\(\?:Db\|Sql\)/)
  assert.match(source, /\.query\\s\*\\\(/)
  assert.match(source, /\$1\(/)
})
