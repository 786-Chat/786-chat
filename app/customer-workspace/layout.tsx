import type { ReactNode } from "react"

import { RecentChatDock } from "@/components/customer-workspace/recent-chat-dock"
import { WorkspaceCommandPalette } from "@/components/customer-workspace/workspace-command-palette"

export default function CustomerWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <RecentChatDock />
      <WorkspaceCommandPalette />
    </>
  )
}
