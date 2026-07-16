import type { ReactNode } from "react"

import { RecentChatDock } from "@/components/customer-workspace/recent-chat-dock"

export default function CustomerWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <RecentChatDock />
    </>
  )
}
