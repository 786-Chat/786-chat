"use client"

import { AdminChatAiEditReview } from "@/components/786-admin/admin-chat-ai-edit-review"
import { AdminChatBuildStatus } from "@/components/786-admin/admin-chat-build-status"
import { AdminChatCollaboration } from "@/components/786-admin/admin-chat-collaboration"
import { AdminChatPublishController } from "@/components/786-admin/admin-chat-publish-controller"
import { AdminChatPublishingOverviewLink } from "@/components/786-admin/admin-chat-publishing-overview-link"
import { AdminChatRevisionHistory } from "@/components/786-admin/admin-chat-revision-history"
import { AdminChatTemplateGallery } from "@/components/786-admin/admin-chat-template-gallery"

export function AdminChatToolbarCleanup() {
  return (
    <>
      <AdminChatPublishController />
      <AdminChatPublishingOverviewLink />
      <AdminChatBuildStatus />
      <AdminChatRevisionHistory />
      <AdminChatAiEditReview />
      <AdminChatTemplateGallery />
      <AdminChatCollaboration />
    </>
  )
}
