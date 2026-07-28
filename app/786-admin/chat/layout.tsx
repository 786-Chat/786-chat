import type { ReactNode } from "react"
import { AdminChatLogoutController } from "@/components/786-admin/admin-chat-logout-controller"
import { AdminChatSafeThemeController } from "@/components/786-admin/admin-chat-safe-theme-controller"
import { AdminChatUrlHeaderController } from "@/components/786-admin/admin-chat-url-header-controller"
import { AdminChatSidebarCleanup } from "@/components/786-admin/admin-chat-sidebar-cleanup"
import { AdminChatResilientFetchBridge } from "@/components/786-admin/admin-chat-resilient-fetch-bridge"
import { AdminChatStalePreviewReset } from "@/components/786-admin/admin-chat-stale-preview-reset"

export default function AdminChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-chat-route contents">
      {children}
      <AdminChatResilientFetchBridge />
      <AdminChatLogoutController />
      <AdminChatSafeThemeController />
      <AdminChatStalePreviewReset />
      <AdminChatUrlHeaderController />
      <AdminChatSidebarCleanup />
      <style>{`
        .admin-chat-route section > div.absolute.bottom-0 > p.mt-3 {
          display: none !important;
        }
      `}</style>
    </div>
  )
}
