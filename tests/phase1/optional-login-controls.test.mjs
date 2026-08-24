import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const specification = await readFile(new URL("../../lib/786-chat/specification.ts", import.meta.url), "utf8")

test("login only requires controls explicitly requested beyond core credentials", () => {
  assert.match(specification, /requiredComponents\.push\("email-input", "password-input", "submit-button"\)/)
  assert.match(specification, /remember\[ -\]\?me/)
  assert.match(specification, /requiredComponents\.push\("remember-me"\)/)
  assert.match(specification, /forgot\(\?:ten\)\?\[ -\]\?/)
  assert.match(specification, /requiredComponents\.push\("forgot-password-link"\)/)
  assert.doesNotMatch(
    specification,
    /requiredComponents\.push\("email-input", "password-input", "remember-me", "forgot-password-link", "submit-button"\)/,
  )
})
