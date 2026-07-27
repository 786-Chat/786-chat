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
import { AdminChatRealCodeEditor } from "@/components/786-admin/admin-chat-real-code-editor"
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
      document.getElementById("admin-chat-revision-history-button")?.remove()

      const header = document.querySelector<HTMLElement>("main header")
      hideElement(header?.querySelector<HTMLButtonElement>('button[title="Preview"]') ?? null)

      const sidebar = document.querySelector<HTMLElement>("main aside")
      const chatButtons = Array.from(
        sidebar?.querySelectorAll<HTMLButtonElement>('button[title="Chat"]') ?? [],
      )

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

  if (!pathname || !pathname.startsWith(ADMIN_CHAT_PATH)) return null

  return (
    <>
      <AdminChatHeaderCleanup />
      <AdminChatPublishController />
      <AdminChatPublishingOverviewLink />
      <AdminChatBuildStatus />
      <AdminChatAiEditReview />
      <AdminChatRealCodeEditor />
      <AdminChatTemplateGallery />
      <AdminChatCollaboration />
      <AdminChatDeploymentCenter />
      <AdminChatProductionMonitoring />
    </>
  )
}
