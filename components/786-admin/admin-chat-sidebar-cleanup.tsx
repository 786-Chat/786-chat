"use client"

import { useEffect } from "react"

export function AdminChatSidebarCleanup() {
  useEffect(() => {
    const cleanAndWireSidebar = () => {
      const aside = document.querySelector("main aside")
      if (!aside) return

      const chatButtons = Array.from(aside.querySelectorAll<HTMLButtonElement>('button[title="Chat"]'))
      const duplicate = chatButtons.find((button) => button.closest(".space-y-5"))
      if (duplicate) duplicate.style.display = "none"

      const projectButton = Array.from(aside.querySelectorAll<HTMLButtonElement>("button")).find((button) => {
        const title = button.getAttribute("title")?.trim().toLowerCase()
        const text = button.textContent?.trim().toLowerCase()
        return title === "projects" || text === "projects"
      })

      if (projectButton && projectButton.dataset.projectsWired !== "true") {
        projectButton.dataset.projectsWired = "true"
        projectButton.addEventListener("click", (event) => {
          event.preventDefault()
          event.stopPropagation()
          window.location.href = "/786-admin/projects"
        })
      }
    }

    cleanAndWireSidebar()
    const observer = new MutationObserver(cleanAndWireSidebar)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
