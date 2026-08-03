import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const workspace = await readFile("components/786-chat/workspace.tsx", "utf8")

test("canonical builder accepts pasted and selected images", () => {
  assert.match(workspace, /onPaste=\{handleImagePaste\}/)
  assert.match(workspace, /event\.clipboardData\.items/)
  assert.match(workspace, /imageInputRef\.current\?\.click\(\)/)
  assert.match(workspace, /accept="image\/png,image\/jpeg,image\/webp,image\/gif"/)
  assert.match(workspace, /fetch\("\/api\/upload"/)
  assert.match(workspace, /reader\.readAsDataURL\(file\)/)
})

test("canonical generation receives ready image attachments", () => {
  assert.match(workspace, /attachments: readyAttachments\.map/)
  assert.doesNotMatch(workspace, /attachments: \[\]/)
  assert.match(workspace, /Attached:/)
  assert.match(workspace, /Ctrl\+V to paste image/)
})
