"use client"

import { useEffect } from "react"
import { AdminChatAiEditReview } from "@/components/786-admin/admin-chat-ai-edit-review"
import { AdminChatBuildStatus } from "@/components/786-admin/admin-chat-build-status"
import { AdminChatCollaboration } from "@/components/786-admin/admin-chat-collaboration"
import { AdminChatDeploymentCenter } from "@/components/786-admin/admin-chat-deployment-center"
import { AdminChatProductionMonitoring } from "@/components/786-admin/admin-chat-production-monitoring"
import { AdminChatPublishController } from "@/components/786-admin/admin-chat-publish-controller"
import { AdminChatPublishingOverviewLink } from "@/components/786-admin/admin-chat-publishing-overview-link"
import { AdminChatTemplateGallery } from "@/components/786-admin/admin-chat-template-gallery"

function AdminChatHeaderCleanup() {
  useEffect(() => {
    if (!window.location.pathname.startsWith("/786-admin/chat")) return

    const cleanHeader = () => {
      // Keep revision snapshots in the backend, but do not show a separate
      // History control in the approved top toolbar.
      document.getElementById("admin-chat-revision-history-button")?.remove()

      const header = document.querySelector<HTMLElement>("main header")
      const duplicatePreviewButton = header?.querySelector<HTMLButtonElement>(
        'button[title="Preview"]',
      )

      // The device selector already opens Preview when a size is chosen, so
      // the standalone desktop/preview icon is a duplicate control.
      if (duplicatePreviewButton) {
        duplicatePreviewButton.style.display = "none"
        duplicatePreviewButton.setAttribute("aria-hidden", "true")
        duplicatePreviewButton.tabIndex = -1
      }
    }

    cleanHeader()
    const observer = new MutationObserver(cleanHeader)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      document.getElementById("admin-chat-revision-history-button")?.remove()
    }
  }, [])

  return null
}

export function AdminChatToolbarCleanup() {
  return (
    <>
      <AdminChatHeaderCleanup />
      <AdminChatPublishController />
      <AdminChatPublishingOverviewLink />
      <AdminChatBuildStatus />
      <AdminChatAiEditReview />
      <AdminChatTemplateGallery />
      <AdminChatCollaboration />
      <AdminChatDeploymentCenter />
      <AdminChatProductionMonitoring />
    </>
  )
}
