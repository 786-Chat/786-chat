import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("merged generated repair sync handles diverged preview branches from their generated base", async () => {
  const source = await read("lib/786-admin/generated-main-repair-sync.ts")

  assert.match(source, /if \(status === "diverged"\)/)
  assert.match(source, /firstParentSha\(latest\.github_commit_sha\)/)
  assert.match(source, /compareAgainstMain\(parentSha\)/)
  assert.match(source, /Compared from the generated build base because the preview branch diverged from main/)
})
