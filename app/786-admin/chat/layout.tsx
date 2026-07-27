import type { ReactNode } from "react"
import { AdminChatLogoutController } from "@/components/786-admin/admin-chat-logout-controller"
import { AdminChatSafeThemeController } from "@/components/786-admin/admin-chat-safe-theme-controller"
import { AdminChatUrlHeaderController } from "@/components/786-admin/admin-chat-url-header-controller"
import { AdminChatSidebarCleanup } from "@/components/786-admin/admin-chat-sidebar-cleanup"
import { AdminChatRecentProjects } from "@/components/786-admin/admin-chat-recent-projects"

export default function AdminChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-chat-route contents">
      {children}
      <AdminChatLogoutController />
      <AdminChatSafeThemeController />
      <AdminChatUrlHeaderController />
      <AdminChatSidebarCleanup />
      <AdminChatRecentProjects />
      <style>{`
        .admin-chat-route section > div.absolute.bottom-0 > p.mt-3 {
          display: none !important;
        }
      `}</style>
    </div>
  )
}
