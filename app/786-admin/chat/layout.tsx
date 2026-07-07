import type { ReactNode } from "react"
import { AdminChatSafeThemeController } from "@/components/786-admin/admin-chat-safe-theme-controller"
import { AdminChatLogoutController } from "@/components/786-admin/admin-chat-logout-controller"

export default function AdminChatLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AdminChatSafeThemeController />
      <AdminChatLogoutController />
    </>
  )
}
