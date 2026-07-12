"use client"

import { AdminChatBuildStatus } from "@/components/786-admin/admin-chat-build-status"
import { AdminChatPublishController } from "@/components/786-admin/admin-chat-publish-controller"
import { AdminChatPublishingOverviewLink } from "@/components/786-admin/admin-chat-publishing-overview-link"

export function AdminChatToolbarCleanup() {
  return (
    <>
      <AdminChatPublishController />
      <AdminChatPublishingOverviewLink />
      <AdminChatBuildStatus />
    </>
  )
}
