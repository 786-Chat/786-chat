"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ADMIN_CHAT_PATH = "/786-admin/chat"

function isPreviewFrame(frame: HTMLIFrameElement): boolean {
  return /preview/i.test(frame.title || frame.getAttribute("title") || "")
}

function pruneCompiledProjectSource(source: string): string {
  const blockPattern = /(^|\n\n)(\/\/ ([^\n]+\.(?:tsx?|jsx?))\n[\s\S]*?)(?=\n\n\/\/ [^\n]+\.(?:tsx?|jsx?)\n|\nconst root =)/g

  return source.replace(blockPattern, (full, prefix: string, block: string, filePath: string) => {
    const normalized = String(filePath || "").replace(/^src\//, "")
    const isPage = /^app\/(?:.*\/)?page\.(?:tsx?|jsx?)$/i.test(normalized)
    const isRootPage = /^app\/page\.(?:tsx?|jsx?)$/i.test(normalized)
    const contaminated =
      /(?:^|\/)786-admin(?:\/|$)|admin-chat-/i.test(normalized) ||
      /SevenEightSixAdminChatPage|\/786-admin\/chat|Ask 786\.Chat|PremiumAdminBackground/i.test(block)

    // The preview compiler used to execute every route and every stale page in
    // one global scope. Keep the root page and reusable modules only.
    if (contaminated || (isPage && !isRootPage)) return prefix
    return full
  })
}

function pruneBabelSource(documentHtml: string): string {
  const match = documentHtml.match(/Babel\.transform\(("(?:\\.|[^"\\])*")\s*,\s*\{/)
  if (!match) return documentHtml

  try {
    const compiledSource = JSON.parse(match[1]) as string
    const prunedSource = pruneCompiledProjectSource(compiledSource)
    if (prunedSource === compiledSource) return documentHtml

    const safeLiteral = JSON.stringify(prunedSource)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026")
    return documentHtml.replace(match[1], safeLiteral)
  } catch {
    return documentHtml
  }
}

function cleanAdminPreviewOverrides(source: string): string {
  let next = source

  // The admin workspace theme must never flatten or recolour the generated
  // customer project. These rules were injected by the old preview renderer.
  next = next.replace(
    /#root>\*\{[^}]*border-radius\s*:\s*0\s*!important[^}]*box-shadow\s*:\s*none\s*!important[^}]*\}/gi,
    "",
  )
  next = next.replace(
    /#root\s*\{\s*filter\s*:\s*hue-rotate\([^)]*\)[^}]*\}/gi,
    "",
  )

  return pruneBabelSource(next)
}

function patchFrame(frame: HTMLIFrameElement) {
  if (!isPreviewFrame(frame)) return
  const current = frame.getAttribute("srcdoc") || frame.srcdoc || ""
  if (!current) return

  const cleaned = cleanAdminPreviewOverrides(current)
  if (cleaned === current) return
  frame.srcdoc = cleaned
}

export function AdminChatPreviewStyleIsolation() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== ADMIN_CHAT_PATH) return

    const inspect = () => {
      document.querySelectorAll<HTMLIFrameElement>("iframe").forEach(patchFrame)
    }

    inspect()
    const observer = new MutationObserver(inspect)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["srcdoc"],
    })
    const interval = window.setInterval(inspect, 600)

    return () => {
      window.clearInterval(interval)
      observer.disconnect()
    }
  }, [pathname])

  return null
}
