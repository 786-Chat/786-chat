"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const STYLE_ID = "admin-project-card-identity-style"

const PALETTES = [
  { border: "#22d3ee", glow: "rgba(34,211,238,.22)", card: "linear-gradient(145deg,#071922,#0c1726 55%,#101827)", hero: "linear-gradient(135deg,rgba(34,211,238,.42),rgba(59,130,246,.25),rgba(139,92,246,.22))", icon: "linear-gradient(135deg,#67e8f9,#3b82f6)", chip: "rgba(34,211,238,.16)", text: "#cffafe" },
  { border: "#f59e0b", glow: "rgba(245,158,11,.22)", card: "linear-gradient(145deg,#1c1308,#1b1010 55%,#101827)", hero: "linear-gradient(135deg,rgba(245,158,11,.45),rgba(249,115,22,.28),rgba(190,24,93,.24))", icon: "linear-gradient(135deg,#fbbf24,#f97316)", chip: "rgba(245,158,11,.16)", text: "#fef3c7" },
  { border: "#a78bfa", glow: "rgba(167,139,250,.22)", card: "linear-gradient(145deg,#160d28,#121229 55%,#101827)", hero: "linear-gradient(135deg,rgba(167,139,250,.42),rgba(139,92,246,.28),rgba(236,72,153,.22))", icon: "linear-gradient(135deg,#c4b5fd,#8b5cf6)", chip: "rgba(167,139,250,.16)", text: "#ede9fe" },
  { border: "#34d399", glow: "rgba(52,211,153,.22)", card: "linear-gradient(145deg,#071a14,#0b1a19 55%,#101827)", hero: "linear-gradient(135deg,rgba(52,211,153,.42),rgba(20,184,166,.28),rgba(34,211,238,.20))", icon: "linear-gradient(135deg,#6ee7b7,#14b8a6)", chip: "rgba(52,211,153,.16)", text: "#d1fae5" },
  { border: "#fb7185", glow: "rgba(251,113,133,.22)", card: "linear-gradient(145deg,#210d16,#1d101a 55%,#101827)", hero: "linear-gradient(135deg,rgba(251,113,133,.42),rgba(236,72,153,.28),rgba(249,115,22,.20))", icon: "linear-gradient(135deg,#fda4af,#ec4899)", chip: "rgba(251,113,133,.16)", text: "#ffe4e6" },
  { border: "#60a5fa", glow: "rgba(96,165,250,.22)", card: "linear-gradient(145deg,#081426,#0c1530 55%,#101827)", hero: "linear-gradient(135deg,rgba(96,165,250,.42),rgba(79,70,229,.28),rgba(168,85,247,.20))", icon: "linear-gradient(135deg,#93c5fd,#4f46e5)", chip: "rgba(96,165,250,.16)", text: "#dbeafe" },
  { border: "#f472b6", glow: "rgba(244,114,182,.22)", card: "linear-gradient(145deg,#220d20,#1b1020 55%,#101827)", hero: "linear-gradient(135deg,rgba(244,114,182,.42),rgba(217,70,239,.28),rgba(139,92,246,.20))", icon: "linear-gradient(135deg,#f9a8d4,#d946ef)", chip: "rgba(244,114,182,.16)", text: "#fce7f3" },
  { border: "#a3e635", glow: "rgba(163,230,53,.20)", card: "linear-gradient(145deg,#111b08,#111a13 55%,#101827)", hero: "linear-gradient(135deg,rgba(163,230,53,.38),rgba(34,197,94,.26),rgba(20,184,166,.20))", icon: "linear-gradient(135deg,#bef264,#22c55e)", chip: "rgba(163,230,53,.14)", text: "#ecfccb" },
]

function hashText(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0)
}

function installStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = `
    [data-project-identity] {
      border-color: var(--project-border) !important;
      background: var(--project-card) !important;
      box-shadow: 0 0 55px rgba(0,0,0,.22), 0 0 32px var(--project-glow) !important;
    }
    [data-project-identity] > div > div:first-child > div:first-child {
      background: var(--project-icon) !important;
    }
    [data-project-identity] > div > div:first-child > span {
      border-color: var(--project-border) !important;
      background: var(--project-chip) !important;
      color: var(--project-text) !important;
    }
    [data-project-identity] [data-project-preview-hero] {
      background: var(--project-hero) !important;
    }
    [data-project-identity] h2 {
      text-shadow: 0 0 18px var(--project-glow);
    }
  `
  document.head.appendChild(style)
}

function applyProjectIdentities() {
  const cards = Array.from(document.querySelectorAll<HTMLElement>("main article"))
  for (const card of cards) {
    const title = card.querySelector("h2")?.textContent?.trim()
    if (!title) continue

    const palette = PALETTES[hashText(title) % PALETTES.length]
    card.dataset.projectIdentity = String(hashText(title) % PALETTES.length)
    card.style.setProperty("--project-border", palette.border)
    card.style.setProperty("--project-glow", palette.glow)
    card.style.setProperty("--project-card", palette.card)
    card.style.setProperty("--project-hero", palette.hero)
    card.style.setProperty("--project-icon", palette.icon)
    card.style.setProperty("--project-chip", palette.chip)
    card.style.setProperty("--project-text", palette.text)

    const previewHero = card.querySelector<HTMLElement>("div.mb-5 > div.relative.h-24")
    if (previewHero) previewHero.dataset.projectPreviewHero = "true"
  }
}

export function AdminProjectCardIdentity() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/projects") return

    installStyles()
    applyProjectIdentities()

    let scheduled = false
    const observer = new MutationObserver(() => {
      if (scheduled) return
      scheduled = true
      window.requestAnimationFrame(() => {
        scheduled = false
        applyProjectIdentities()
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [pathname])

  return null
}
