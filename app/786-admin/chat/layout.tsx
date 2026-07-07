import type { ReactNode } from "react"
import { AdminChatSafeThemeController } from "@/components/786-admin/admin-chat-safe-theme-controller"
import { AdminChatUrlHeaderController } from "@/components/786-admin/admin-chat-url-header-controller"

export default function AdminChatLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AdminChatSafeThemeController />
      <AdminChatUrlHeaderController />
    </>
  )
}
