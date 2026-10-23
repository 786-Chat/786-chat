import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("isolated builder mints short-lived GitHub App installation credentials", async () => {
  const auth = await read("lib/786-admin/github-repository-token.ts")
  assert.match(auth, /GITHUB_APP_ID/)
  assert.match(auth, /GITHUB_APP_PRIVATE_KEY/)
  assert.match(auth, /appJwt/)
  assert.match(auth, /sign\("RSA-SHA256"/)
  assert.match(auth, /\/installation/)
  assert.match(auth, /\/access_tokens/)
  assert.match(auth, /repositories: \[repoName\]/)
  assert.match(auth, /expiresAt - Date\.now\(\) > 120000/)
  assert.match(auth, /GITHUB_BUILD_TOKEN/)
  assert.doesNotMatch(auth, /console\.log\s*\(/)
})

test("builder dispatch and publisher use short-lived GitHub App credentials", async () => {
  const dispatcher = await read("lib/786-admin/build-runner.ts")
  const publisher = await read("lib/786-admin/github-project-publisher.ts")
  const recovery = await read("lib/786-admin/published-source-recovery.ts")
  const repairSync = await read("lib/786-admin/generated-main-repair-sync.ts")
  assert.match(dispatcher, /await githubRepositoryToken\(repository\)/)
  assert.match(dispatcher, /actions\/workflows\/\$\{workflow\}\/dispatches/)
  assert.match(publisher, /await githubRepositoryToken\(repository\)/)
  assert.match(recovery, /await githubRepositoryToken\(repository\(\)\)/)
  assert.match(repairSync, /await githubRepositoryToken\(repository\(\)\)/)
})
