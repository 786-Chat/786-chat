"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { AdminChatAiEditReview } from "@/components/786-admin/admin-chat-ai-edit-review"
import { AdminChatBuildStatus } from "@/components/786-admin/admin-chat-build-status"
import { AdminChatCollaboration } from "@/components/786-admin/admin-chat-collaboration"
import { AdminChatDeploymentCenter } from "@/components/786-admin/admin-chat-deployment-center"
import { AdminChatProductionMonitoring } from "@/components/786-admin/admin-chat-production-monitoring"
import { AdminChatPublishController } from "@/components/786-admin/admin-chat-publish-controller"
import { AdminChatPublishingOverviewLink } from "@/components/786-admin/admin-chat-publishing-overview-link"
import { AdminChatTemplateGallery } from "@/components/786-admin/admin-chat-template-gallery"

const ADMIN_CHAT_PATH = "/786-admin/chat"
const CLEANUP_ATTRIBUTE = "data-786-admin-cleanup"

function hideElement(element: HTMLElement | null) {
  if (!element) return
  element.style.display = "none"
  element.setAttribute("aria-hidden", "true")
  if (element instanceof HTMLButtonElement) element.tabIndex = -1
}

function AdminChatHeaderCleanup() {
  useEffect(() => {
    if (!window.location.pathname.startsWith(ADMIN_CHAT_PATH)) return

    const cleanWorkspace = () => {
      // Revision snapshots remain available in the backend, but the approved
      // toolbar does not show a separate History control.
      document.getElementById("admin-chat-revision-history-button")?.remove()

      const header = document.querySelector<HTMLElement>("main header")
      hideElement(header?.querySelector<HTMLButtonElement>('button[title="Preview"]') ?? null)

      const sidebar = document.querySelector<HTMLElement>("main aside")
      const chatButtons = Array.from(
        sidebar?.querySelectorAll<HTMLButtonElement>('button[title="Chat"]') ?? [],
      )

      // Keep the primary AI/chat icon and remove the old duplicate folder icon.
      chatButtons.slice(1).forEach(hideElement)

      const primaryChatButton = chatButtons[0]
      if (primaryChatButton && !primaryChatButton.hasAttribute(CLEANUP_ATTRIBUTE)) {
        primaryChatButton.setAttribute(CLEANUP_ATTRIBUTE, "true")
        primaryChatButton.addEventListener(
          "click",
          (event) => {
            event.preventDefault()
            event.stopPropagation()
            window.location.assign(ADMIN_CHAT_PATH)
          },
          { capture: true },
        )
      }

      // Provider/database implementation details are internal and must not be
      // shown in the production workspace.
      for (const paragraph of Array.from(document.querySelectorAll<HTMLParagraphElement>("main p"))) {
        const text = paragraph.textContent || ""
        if (
          text.includes("Text uses DeepSeek") ||
          text.includes("Gemini multimodal") ||
          text.includes("Projects save to Neon") ||
          text.includes("auto-save on")
        ) {
          hideElement(paragraph)
        }
      }
    }

    cleanWorkspace()
    const observer = new MutationObserver(cleanWorkspace)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => {
      observer.disconnect()
      document.getElementById("admin-chat-revision-history-button")?.remove()
    }
  }, [])

  return null
}

export function AdminChatToolbarCleanup() {
  const pathname = usePathname()

  // These controls use privileged /api/786-admin endpoints and must never
  // attach themselves to a customer's /dashboard workspace.
  if (!pathname.startsWith(ADMIN_CHAT_PATH)) return null

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
