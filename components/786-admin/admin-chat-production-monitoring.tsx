"use client"

import { useEffect } from "react"

const BUTTON_ID = "admin-chat-production-monitoring-button"
const DIALOG_ID = "admin-chat-production-monitoring-dialog"

type HealthPayload = {
  status?: string
  service?: string
  timestamp?: string
  uptimeSeconds?: number
  latencyMs?: number
  checks?: Record<string, unknown>
}

function esc(value: unknown) { return String(value ?? "").replace(/[<>&]/g, "") }
function closeDialog() { document.getElementById(DIALOG_ID)?.remove() }
function button(label: string, primary = false) {
  const el = document.createElement("button")
  el.type = "button"
  el.textContent = label
  Object.assign(el.style, {
    border: primary ? "1px solid rgba(16,185,129,.65)" : "1px solid rgba(255,255,255,.13)",
    background: primary ? "linear-gradient(135deg,#059669,#0f766e)" : "rgba(255,255,255,.07)",
    color: "white", padding: "9px 12px", borderRadius: "12px", fontWeight: "800", cursor: "pointer",
  })
  return el
}

async function getHealth(path: string): Promise<{ ok: boolean; data: HealthPayload }> {
  const response = await fetch(path, { cache: "no-store", credentials: "include" })
  const data = await response.json().catch(() => ({})) as HealthPayload
  return { ok: response.ok, data }
}

async function openDialog() {
  closeDialog()
  const overlay = document.createElement("div")
  overlay.id = DIALOG_ID
  Object.assign(overlay.style, { position: "fixed", inset: "0", zIndex: "2147483647", display: "grid", placeItems: "center", padding: "18px", background: "rgba(2,6,23,.84)", backdropFilter: "blur(16px)" })
  const card = document.createElement("section")
  Object.assign(card.style, { width: "min(940px,100%)", maxHeight: "calc(100vh - 36px)", overflow: "auto", padding: "22px", borderRadius: "24px", border: "1px solid rgba(16,185,129,.35)", background: "linear-gradient(145deg,rgba(7,12,29,.99),rgba(6,35,32,.99))", color: "white", boxShadow: "0 32px 110px rgba(0,0,0,.75)", fontFamily: "system-ui,sans-serif" })
  const header = document.createElement("div")
  Object.assign(header.style, { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" })
  const title = document.createElement("div")
  title.innerHTML = '<h2 style="margin:0;font-size:22px">Production monitoring</h2><p style="margin:5px 0 0;color:#a7c7c0;font-size:13px">Live service status and production dependency readiness.</p>'
  const close = button("Close")
  close.onclick = closeDialog
  header.append(title, close)
  const body = document.createElement("div")
  body.innerHTML = '<div style="margin-top:18px;color:#a7c7c0">Running health checks…</div>'
  card.append(header, body)
  overlay.append(card)
  overlay.onclick = (event) => { if (event.target === overlay) closeDialog() }
  document.body.append(overlay)

  try {
    const [live, ready] = await Promise.all([getHealth("/api/health/live"), getHealth("/api/health/ready")])
    body.replaceChildren()
    const summary = document.createElement("div")
    Object.assign(summary.style, { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "10px", margin: "18px 0" })
    const cards: Array<[string, unknown, boolean]> = [
      ["Service", live.data.service || ready.data.service || "786.chat", live.ok],
      ["Liveness", live.data.status || (live.ok ? "alive" : "unavailable"), live.ok],
      ["Readiness", ready.data.status || (ready.ok ? "ready" : "not_ready"), ready.ok],
      ["Uptime", typeof live.data.uptimeSeconds === "number" ? `${live.data.uptimeSeconds}s` : "—", live.ok],
      ["Readiness latency", typeof ready.data.latencyMs === "number" ? `${ready.data.latencyMs}ms` : "—", ready.ok],
    ]
    for (const [label, value, ok] of cards) {
      const item = document.createElement("div")
      item.innerHTML = `<div style="color:#94a3b8;font-size:12px">${esc(label)}</div><strong style="display:block;margin-top:6px;font-size:19px;color:${ok ? "#a7f3d0" : "#fecaca"}">${esc(value)}</strong>`
      Object.assign(item.style, { padding: "14px", borderRadius: "15px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" })
      summary.append(item)
    }
    body.append(summary)

    const checks = ready.data.checks || {}
    const list = document.createElement("div")
    Object.assign(list.style, { display: "grid", gap: "9px" })
    for (const [key, value] of Object.entries(checks)) {
      const good = value === "ok" || value === "configured" || typeof value === "number"
      const row = document.createElement("div")
      row.innerHTML = `<div><strong>${esc(key.replace(/([A-Z])/g, " $1"))}</strong><div style="margin-top:4px;color:#9fb0c8;font-size:12px">${esc(value)}</div></div><span style="padding:5px 9px;border-radius:999px;background:${good ? "rgba(16,185,129,.18)" : "rgba(239,68,68,.18)"};color:${good ? "#a7f3d0" : "#fecaca"};font-size:12px;font-weight:800">${good ? "OK" : "Needs attention"}</span>`
      Object.assign(row.style, { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", padding: "13px", borderRadius: "14px", background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.08)" })
      list.append(row)
    }
    body.append(list)

    const actions = document.createElement("div")
    Object.assign(actions.style, { display: "flex", flexWrap: "wrap", gap: "9px", marginTop: "16px" })
    const refresh = button("Refresh checks", true)
    refresh.onclick = () => void openDialog()
    const liveJson = button("Open liveness JSON")
    liveJson.onclick = () => window.open("/api/health/live", "_blank", "noopener,noreferrer")
    const readyJson = button("Open readiness JSON")
    readyJson.onclick = () => window.open("/api/health/ready", "_blank", "noopener,noreferrer")
    actions.append(refresh, liveJson, readyJson)
    body.append(actions)
  } catch (error) {
    body.innerHTML = `<div style="margin-top:18px;padding:18px;border-radius:16px;background:rgba(127,29,29,.22);color:#fecaca">${esc(error instanceof Error ? error.message : "Could not run health checks")}</div>`
  }
}

function installButton() {
  const header = document.querySelector<HTMLElement>("main > div > section:last-of-type > header")
  if (!header || document.getElementById(BUTTON_ID)) return
  const el = button("Monitoring")
  el.id = BUTTON_ID
  el.title = "Production health and readiness"
  Object.assign(el.style, { height: "42px", padding: "0 14px", borderRadius: "14px", border: "1px solid rgba(16,185,129,.35)", background: "rgba(5,150,105,.16)", color: "#ecfdf5" })
  el.onclick = () => void openDialog()
  header.append(el)
}

export function AdminChatProductionMonitoring() {
  useEffect(() => {
    installButton()
    const timer = window.setInterval(installButton, 700)
    const observer = new MutationObserver(installButton)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => { window.clearInterval(timer); observer.disconnect(); document.getElementById(BUTTON_ID)?.remove(); closeDialog() }
  }, [])
  return null
}
