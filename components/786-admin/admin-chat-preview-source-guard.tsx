"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

function stripGeneratedModuleLines(srcDoc: string): string {
  let next = srcDoc

  // Generated React is executed inside a runtime string, so module imports can
  // appear as escaped lines inside JSON: \nimport { X } from 'lucide-react' // comment\n.
  next = next.replace(
    /\\n[ \t]*import[ \t]+(?:type[ \t]+)?[^\\n]*?[ \t]+from[ \t]+["'][^"']+["'][ \t]*;?[ \t]*(?:\/\/[^\\n]*)?(?=\\n)/g,
    "\\n"
  )
  next = next.replace(
    /\\n[ \t]*import[ \t]+["'][^"']+["'][ \t]*;?[ \t]*(?:\/\/[^\\n]*)?(?=\\n)/g,
    "\\n"
  )
  next = next.replace(
    /\\n[ \t]*export[ \t]+(?:\*|\{[^}]*\})[^\\n]*?[ \t]+from[ \t]+["'][^"']+["'][ \t]*;?[ \t]*(?:\/\/[^\\n]*)?(?=\\n)/g,
    "\\n"
  )

  // Also protect against raw multiline srcdoc text.
  next = next.replace(
    /^[ \t]*import\s+(?:type\s+)?[\s\S]*?\s+from\s+["'][^"']+["']\s*;?\s*(?:\/\/[^\r\n]*)?$/gm,
    ""
  )
  next = next.replace(
    /^[ \t]*import\s+["'][^"']+["']\s*;?\s*(?:\/\/[^\r\n]*)?$/gm,
    ""
  )
  next = next.replace(
    /^[ \t]*export\s+(?:\*|\{[^}]*\})[\s\S]*?\s+from\s+["'][^"']+["']\s*;?\s*(?:\/\/[^\r\n]*)?$/gm,
    ""
  )

  return next
}

export function AdminChatPreviewSourceGuard() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    const patchPreviewIframes = () => {
      const iframes = Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe"))

      for (const iframe of iframes) {
        const title = iframe.getAttribute("title") || ""
        if (!/preview/i.test(title)) continue

        const current = iframe.getAttribute("srcdoc") || iframe.srcdoc || ""
        if (!current || !current.includes("var source =")) continue

        const patched = stripGeneratedModuleLines(current)
        if (patched === current) continue

        iframe.setAttribute("srcdoc", patched)
        iframe.srcdoc = patched
      }
    }

    patchPreviewIframes()
    const observer = new MutationObserver(patchPreviewIframes)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["srcdoc"],
    })

    return () => observer.disconnect()
  }, [pathname])

  return null
}
