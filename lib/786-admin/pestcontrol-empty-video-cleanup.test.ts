import { describe, expect, it } from "vitest"
import { removePestControlEmptyBranchVideoJsx } from "./pestcontrol-empty-video-cleanup"

const PROJECT_ID = "22c299f8-bf65-410f-9643-92a9776dbfca"

describe("removePestControlEmptyBranchVideoJsx", () => {
  it("removes the invalid empty branch-login-video conditional", () => {
    const source = `before\n{activeTab === "branch-login-video" && (\n  \n)}\nafter`
    const files = removePestControlEmptyBranchVideoJsx(PROJECT_ID, {
      "client/src/pages/AdminDashboard.tsx": source,
    })
    expect(files["client/src/pages/AdminDashboard.tsx"]).toBe("before\n\nafter")
  })

  it("does not change other projects", () => {
    const source = `{activeTab === "branch-login-video" && (\n)}`
    const files = removePestControlEmptyBranchVideoJsx("other-project", {
      "client/src/pages/AdminDashboard.tsx": source,
    })
    expect(files["client/src/pages/AdminDashboard.tsx"]).toBe(source)
  })
})
