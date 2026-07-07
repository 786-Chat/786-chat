"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const fallbackPreviewHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  html,body{margin:0;min-height:100%;background:#070b12;color:#cbd5e1;font-family:Inter,system-ui,-apple-system,sans-serif}
  body{display:grid;place-items:center;padding:32px}
  .card{max-width:520px;border:1px solid rgba(103,232,249,.24);background:linear-gradient(135deg,rgba(15,23,42,.94),rgba(30,15,55,.84));border-radius:22px;padding:24px;box-shadow:0 30px 90px rgba(0,0,0,.42)}
  h1{margin:0 0 10px;color:#fff;font-size:18px}
  p{margin:0;color:#94a3b8;font-size:14px;line-height:1.6}
</style>
</head>
<body>
  <main class="card">
    <h1>Preview protected</h1>
    <p>The generated project tried to open a real 786.Chat route inside Preview. The route was blocked so the admin workspace cannot duplicate inside the iframe.</p>
  </main>
</body>
</html>`

const lastSafePreviewByIframe = new WeakMap<HTMLIFrameElement, string>()

function isPreviewIframe(iframe: HTMLIFrameElement): boolean {
  return /preview/i.test(iframe.getAttribute("title") || "")
}

function hardenPreviewIframe(iframe: HTMLIFrameElement): void {
  if (!isPreviewIframe(iframe)) return
  const sandbox = iframe.getAttribute("sandbox") || ""
  if (!sandbox.includes("allow-same-origin")) {
    iframe.setAttribute("sandbox", `${sandbox} allow-same-origin`.trim())
  }
}

function containsAdminWorkspace(html: string): boolean {
  if (!html) return false
  const lowered = html.toLowerCase()
  return (
    lowered.includes("/786-admin/chat") ||
    lowered.includes("ask 786.chat to build a real project") ||
    lowered.includes("admin-chat-browser-bar") ||
    lowered.includes("admin-chat-real-theme-menu") ||
    (lowered.includes("editing project") && lowered.includes("changes save")) ||
    (lowered.includes("new chat") && lowered.includes("786.chat") && lowered.includes("preview") && lowered.includes("publish"))
  )
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/786-admin/chat" || pathname.startsWith("/786-admin/")
}

function rememberSafePreview(iframe: HTMLIFrameElement): void {
  const srcdoc = iframe.getAttribute("srcdoc") || iframe.srcdoc || ""
  if (!srcdoc || containsAdminWorkspace(srcdoc)) return
  lastSafePreviewByIframe.set(iframe, srcdoc)
}

function iframeHasAdminSrc(iframe: HTMLIFrameElement): boolean {
  const raw = iframe.getAttribute("src") || ""
  if (!raw) return false
  try {
    const url = new URL(raw, window.location.origin)
    return url.origin === window.location.origin || isAdminPath(url.pathname)
  } catch {
    return raw.includes("/786-admin/") || raw.startsWith("/")
  }
}

function iframeHasRealAppNavigation(iframe: HTMLIFrameElement): boolean {
  try {
    const href = iframe.contentWindow?.location?.href || ""
    if (!href || href === "about:blank" || href === "about:srcdoc") return false
    const url = new URL(href)
    return url.origin === window.location.origin
  } catch {
    return false
  }
}

function iframeHasAdminLoadedPath(iframe: HTMLIFrameElement): boolean {
  try {
    const href = iframe.contentWindow?.location?.href || ""
    if (!href || href === "about:blank" || href === "about:srcdoc") return false
    const url = new URL(href, window.location.origin)
    return isAdminPath(url.pathname)
  } catch {
    return false
  }
}

function resetIframe(iframe: HTMLIFrameElement): void {
  const lastSafe = lastSafePreviewByIframe.get(iframe)
  iframe.removeAttribute("src")
  iframe.srcdoc = lastSafe || fallbackPreviewHtml
}

function inspectIframe(iframe: HTMLIFrameElement): void {
  if (!isPreviewIframe(iframe)) return
  hardenPreviewIframe(iframe)

  const srcdoc = iframe.getAttribute("srcdoc") || iframe.srcdoc || ""
  if (srcdoc && !containsAdminWorkspace(srcdoc)) rememberSafePreview(iframe)

  if (iframeHasAdminSrc(iframe) || iframeHasAdminLoadedPath(iframe) || iframeHasRealAppNavigation(iframe)) {
    resetIframe(iframe)
    return
  }

  if (containsAdminWorkspace(srcdoc)) resetIframe(iframe)
}

export function AdminChatPreviewContainmentGuard() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    const inspectAll = () => {
      for (const iframe of Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe"))) {
        inspectIframe(iframe)
      }
    }

    const onLoad = (event: Event) => {
      const target = event.target
      if (target instanceof HTMLIFrameElement) inspectIframe(target)
    }

    inspectAll()
    document.addEventListener("load", onLoad, true)

    const observer = new MutationObserver(inspectAll)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "srcdoc", "sandbox"],
    })

    const timer = window.setInterval(inspectAll, 150)

    return () => {
      observer.disconnect()
      document.removeEventListener("load", onLoad, true)
      window.clearInterval(timer)
    }
  }, [pathname])

  return null
}
