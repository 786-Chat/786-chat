import fs from "node:fs"

const layout = fs.readFileSync("app/786-admin/chat/layout.tsx", "utf8")
const controller = fs.readFileSync("components/786-admin/admin-chat-stale-preview-reset-v2.tsx", "utf8")

const checks = [
  [layout.includes("AdminChatStalePreviewResetV2"), "layout mounts the React-native stale preview reset"],
  [controller.includes("button.click()"), "controller triggers the page's New Chat React action"],
  [controller.includes("localStorage.removeItem(ACTIVE_PROJECT_ID_KEY)"), "controller clears stale active project storage"],
  [controller.includes("if (!response.ok || !payload?.project?.id)"), "controller handles missing project API responses"],
  [controller.includes("if (!projectId)"), "controller handles stale iframe state with no stored project ID"],
]

for (const [passed, message] of checks) {
  if (!passed) throw new Error(`FAILED: ${message}`)
  console.log(`PASS: ${message}`)
}
