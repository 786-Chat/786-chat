"use client"

import { AdminChatPublishController } from "@/components/786-admin/admin-chat-publish-controller"
import { AdminChatPublishingOverviewLink } from "@/components/786-admin/admin-chat-publishing-overview-link"

/**
 * Keep only the existing publishing controllers mounted here.
 * The /786-admin/chat header must be rendered by the real chat page,
 * not by an overlay or DOM patch layer.
 */
export function AdminChatToolbarCleanup() {
  return (
    <>
      <AdminChatPublishController />
      <AdminChatPublishingOverviewLink />
    </>
  )
}
