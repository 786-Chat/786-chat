"use client"

import { useEffect } from "react"

export function AdminChatSidebarCleanup() {
  useEffect(() => {
    const hideDuplicate = () => {
      const aside = document.querySelector("main aside")
      if (!aside) return
      const chatButtons = Array.from(aside.querySelectorAll<HTMLButtonElement>('button[title="Chat"]'))
      const duplicate = chatButtons.find((button) => button.closest(".space-y-5"))
      if (duplicate) duplicate.style.display = "none"
    }

    hideDuplicate()
    const observer = new MutationObserver(hideDuplicate)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
