"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { AdminChatPublishController } from "@/components/786-admin/admin-chat-publish-controller"
import { AdminChatPublishingOverviewLink } from "@/components/786-admin/admin-chat-publishing-overview-link"

const STYLE_ID = "admin-chat-toolbar-cleanup-style"
const MENU_ID = "admin-chat-device-menu"

type DevicePreset = {
  label: string
  width: number | null
  height: number | null
  base: "Desktop" | "Tablet" | "iPad" | "Mobile"
  radius: string
  border: string
}

const DEVICES: DevicePreset[] = [
  { label: "Full Preview", width: null, height: null, base: "Desktop", radius: "0", border: "0" },
  { label: "Desktop", width: null, height: null, base: "Desktop", radius: "0", border: "0" },
  { label: "Laptop", width: 1366, height: 768, base: "Desktop", radius: "22px", border: "10px solid #0f172a" },
  { label: "Tablet", width: 768, height: 900, base: "Tablet", radius: "30px", border: "10px solid #111827" },
  { label: "iPad Mini", width: 744, height: 1000, base: "Tablet", radius: "30px", border: "10px solid #111827" },
  { label: "iPad Pro", width: 1024, height: 1180, base: "iPad", radius: "30px", border: "10px solid #111827" },
  { label: "Surface Pro", width: 912, height: 1100, base: "iPad", radius: "30px", border: "10px solid #111827" },
  { label: "Galaxy Tab", width: 800, height: 1120, base: "Tablet", radius: "30px", border: "10px solid #111827" },
  { label: "Galaxy Fold", width: 430, height: 932, base: "Mobile", radius: "24px", border: "9px solid #111827" },
  { label: "iPhone 7 Plus", width: 414, height: 736, base: "Mobile", radius: "38px", border: "10px solid #111827" },
  { label: "iPhone 13", width: 390, height: 844, base: "Mobile", radius: "38px", border: "10px solid #111827" },
  { label: "iPhone 15", width: 393, height: 852, base: "Mobile", radius: "38px", border: "10px solid #111827" },
  { label: "iPhone 16", width: 393, height: 852, base: "Mobile", radius: "38px", border: "10px solid #111827" },
  { label: "iPhone 16 Pro Max", width: 440, height: 956, base: "Mobile", radius: "38px", border: "10px solid #111827" },
  { label: "Pixel 9", width: 412, height: 915, base: "Mobile", radius: "38px", border: "10px solid #111827" },
  { label: "Galaxy S25", width: 412, height: 915, base: "Mobile", radius: "38px", border: "10px solid #111827" },
  { label: "Custom Width", width: 480, height: 860, base: "Mobile", radius: "38px", border: "10px solid #111827" },
]

function selectNativeDevice(base: DevicePreset["base"]) {
  document.querySelector<HTMLButtonElement>(`button[title="${base} preview"]`)?.click()
}

function resizePreview(device: DevicePreset) {
  selectNativeDevice(device.base)
  setTimeout(() => {
    const iframe = document.querySelector<HTMLIFrameElement>('section:last-of-type iframe')
    const frame = iframe?.parentElement
    if (!iframe || !frame) return
    frame.style.width = device.width ? `${device.width}px` : "100%"
    frame.style.height = device.height ? `min(${device.height}px, calc(100vh - 118px))` : "100%"
    frame.style.maxWidth = device.width ? "calc(100vw - 520px)" : "100%"
    frame.style.maxHeight = device.height ? "calc(100vh - 118px)" : "100%"
    frame.style.border = device.border
    frame.style.borderRadius = device.radius
    frame.style.overflow = "hidden"
    frame.style.background = "#fff"
    frame.style.boxShadow = device.width ? "0 28px 90px rgba(0,0,0,.58)" : "none"
    iframe.style.borderRadius = device.width ? `calc(${device.radius} - 10px)` : "0"
  }, 120)
}

function closeMenu() {
  document.getElementById(MENU_ID)?.remove()
}

function openMenu(anchor: HTMLButtonElement) {
  closeMenu()
  const rect = anchor.getBoundingClientRect()
  const menu = document.createElement("div")
  menu.id = MENU_ID
  menu.style.cssText = `position:fixed;top:${rect.bottom + 10}px;right:${Math.max(18, window.innerWidth - rect.right)}px;z-index:2147483647;width:260px;max-height:min(520px,calc(100vh - 120px));overflow:auto;padding:10px;border-radius:22px;border:1px solid rgba(139,92,246,.40);background:rgba(2,6,23,.98);box-shadow:0 28px 90px rgba(0,0,0,.72);backdrop-filter:blur(20px);`
  DEVICES.forEach((device) => {
    const option = document.createElement("button")
    option.type = "button"
    option.textContent = device.label
    option.style.cssText = "display:block;width:100%;margin:0 0 6px;padding:11px 12px;border-radius:15px;border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.90);color:white;cursor:pointer;font:800 13px system-ui;text-align:left;"
    option.onclick = () => {
      resizePreview(device)
      closeMenu()
    }
    menu.appendChild(option)
  })
  document.body.appendChild(menu)
}

export function AdminChatToolbarCleanup() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return
    document.getElementById(STYLE_ID)?.remove()
    const style = document.createElement("style")
    style.id = STYLE_ID
    style.textContent = `
      #admin-chat-browser-bar,
      #admin-chat-project-pages,
      main > div > section:last-of-type > header > div[class*="rounded-full"][class*="p-1"],
      main > div > section:last-of-type > header button[title="Desktop preview"],
      main > div > section:last-of-type > header button[title="Tablet preview"],
      main > div > section:last-of-type > header button[title="iPad preview"],
      main > div > section:last-of-type > header button[title="Mobile preview"] { display: none !important; }
    `
    document.head.appendChild(style)

    const timer = window.setInterval(() => {
      const preview = Array.from(document.querySelectorAll<HTMLButtonElement>("main > div > section:last-of-type > header button")).find((button) => button.textContent?.includes("Preview"))
      if (!preview || preview.dataset.deviceDropdown === "true") return
      preview.dataset.deviceDropdown = "true"
      preview.setAttribute("aria-haspopup", "menu")
      preview.append(" ▾")
      preview.addEventListener("click", () => setTimeout(() => openMenu(preview), 0))
    }, 400)

    return () => {
      window.clearInterval(timer)
      closeMenu()
      style.remove()
    }
  }, [pathname])

  return (
    <>
      <AdminChatPublishController />
      <AdminChatPublishingOverviewLink />
    </>
  )
}
