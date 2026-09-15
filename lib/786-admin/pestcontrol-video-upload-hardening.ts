const PEST_CONTROL_PROJECT_ID = "22c299f8-bf65-410f-9643-92a9776dbfca"

/**
 * Branch Login video was retired at the owner's request.
 * Keep this hardening step in the build pipeline so old saved/generated source
 * cannot reintroduce the sidebar item, uploader, video card, or video routes.
 */
function removeAdminVideoManager(source: string): string {
  let next = source
  const componentStart = next.indexOf("function BranchLoginVideoManager() {")
  const dashboardStart = next.indexOf("export default function AdminDashboard() {", Math.max(0, componentStart))
  if (componentStart >= 0 && dashboardStart > componentStart) next = next.slice(0, componentStart) + next.slice(dashboardStart)
  next = next
    .replace(/\{\s*id:\s*["']branch-login-video["'][\s\S]*?\},?\s*/g, "")
    .replace(/<[^>]*onClick=\{\(\)\s*=>\s*setActiveTab\(["']branch-login-video["']\)[\s\S]*?<\/[^>]+>\s*/g, "")
    .replace(/\{activeTab\s*===\s*["']branch-login-video["']\s*&&\s*\(?\s*<BranchLoginVideoManager\s*\/>\s*\)?\s*\}/g, "")
    .replace(/case\s+["']branch-login-video["']\s*:\s*return\s*<BranchLoginVideoManager\s*\/>\s*;?/g, "")
    .replace(/<BranchLoginVideoManager\s*\/>/g, "")
  return next
}

function removeBranchLoginVideoCard(source: string): string {
  let next = source
  const cardMarker = "        {/* Admin-managed Branch Login marketing video */}"
  const formMarker = "        {/* Beautiful Login Form */}"
  const cardStart = next.indexOf(cardMarker)
  const formStart = next.indexOf(formMarker, Math.max(0, cardStart))
  if (cardStart >= 0 && formStart > cardStart) next = next.slice(0, cardStart) + next.slice(formStart)
  next = next.replace(/\s*\{branchLoginVideoUrl\s*&&\s*\([\s\S]*?\)\}\s*(?=\{?\/\* Beautiful Login Form \*\/\}?)/g, "\n")
  next = next
    .replace(/\s*const\s*\[branchLoginVideoUrl,\s*setBranchLoginVideoUrl\]\s*=\s*useState\([^\n]*\);?/g, "")
    .replace(/\s*useEffect\(\(\)\s*=>\s*\{\s*fetch\(["']\/api\/public\/branch-login-media["'][\s\S]*?\},\s*\[\]\s*\);?/g, "")
  return next
}

function applyApprovedBranchLoginPresentation(source: string): string {
  let next = source

  // Approved medium cube on every device, with green pest-control treatment.
  next = next
    .replace("--cube-size: 148px;", "--cube-size: 128px;")
    .replace("filter: drop-shadow(0 0 24px rgba(124,58,237,.45));", "filter: drop-shadow(0 0 24px rgba(34,197,94,.5));")
    .replace("border: 1px solid rgba(196,181,253,.6);", "border: 1px solid rgba(74,222,128,.7);")
    .replace("background: linear-gradient(145deg, rgba(15,23,42,.98), rgba(76,29,149,.9));", "background: linear-gradient(145deg, rgba(5,46,22,.98), rgba(22,101,52,.94));")
    .replace("box-shadow: inset 0 0 22px rgba(255,255,255,.08), 0 0 20px rgba(168,85,247,.35);", "box-shadow: inset 0 0 22px rgba(255,255,255,.1), 0 0 22px rgba(34,197,94,.45);")
    .replace("background: #07111f;", "background: linear-gradient(145deg, #052e16, #166534);")
    .replace("@media (min-width: 640px) { .branch-login-cube-stage { --cube-size: 180px; margin-bottom: 38px; } }", "@media (min-width: 640px) { .branch-login-cube-stage { --cube-size: 148px; margin-bottom: 32px; } }")
    .replace("@media (min-width: 1024px) { .branch-login-cube-stage { --cube-size: 210px; margin-bottom: 44px; } }", "@media (min-width: 1024px) { .branch-login-cube-stage { --cube-size: 160px; margin-bottom: 34px; } }")

  // Approved top-left identity. It is intentionally simple and responsive so it
  // does not alter the existing login/authentication behaviour.
  const mainMarker = "      {/* Main Content Container */}"
  if (!next.includes("branch-login-approved-brand") && next.includes(mainMarker)) {
    const brand = `      <div className="branch-login-approved-brand absolute top-4 left-4 sm:top-6 sm:left-6 z-30 max-w-[calc(100%-5rem)] text-left pointer-events-none">\n        <div className="flex items-center gap-2 text-white font-bold text-lg sm:text-xl"><span className="text-green-400 text-2xl">☘</span><span>Pest Control <span className="text-green-400">Services</span></span></div>\n        <p className="text-xs sm:text-sm text-slate-300 ml-8">A Cleaner, Safer Tomorrow</p>\n      </div>\n\n`
    next = next.replace(mainMarker, brand + mainMarker)
  }

  // Approved footer and WhatsApp number. Existing floating WhatsApp/help controls
  // remain functional; this only guarantees the requested contact and footer.
  const closeMarker = "    </div>\n  );\n}"
  if (!next.includes("branch-login-approved-footer") && next.includes(closeMarker)) {
    const footer = `      <footer className="branch-login-approved-footer relative z-20 w-full text-center text-xs sm:text-sm text-slate-300 pb-3 pt-1 px-4">\n        <div className="text-green-400 mb-1">☘</div>\n        <div className="font-medium text-slate-200">Pest Free Today | Healthier Tomorrow</div>\n        <div className="text-slate-400">pestcontrol.cat | www.pestcontrol.cat</div>\n      </footer>\n\n`
    next = next.replace(closeMarker, footer + closeMarker)
  }

  // Keep the requested WhatsApp destination stable even if imported source has an
  // older UK support number.
  next = next.replace(/https:\/\/wa\.me\/\d+/g, "https://wa.me/447427070000")
  next = next.replace(/\+44\s*742\s*707\s*0000/g, "+44 7427 070000")

  return next
}

function removeVideoRoutes(source: string): string {
  let next = source
  const startMarkers = [
    "  // Admin-authorized client upload token route for Branch Login marketing video.",
    "  // Admin-only upload for Branch Login marketing video",
  ]
  const endMarker = "  // Admin logout endpoint"
  for (const marker of startMarkers) {
    const start = next.indexOf(marker)
    const end = next.indexOf(endMarker, Math.max(0, start))
    if (start >= 0 && end > start) {
      next = next.slice(0, start) + next.slice(end)
      break
    }
  }
  return next
}

export function hardenPestControlVideoUpload(
  projectId: string,
  files: Record<string, string>,
): Record<string, string> {
  if (projectId !== PEST_CONTROL_PROJECT_ID) return files
  const next = { ...files }
  const routesPath = "server/routes.ts"
  const adminPath = "client/src/pages/AdminDashboard.tsx"
  const branchLoginPath = "client/src/pages/BranchLogin.tsx"
  if (next[routesPath]) next[routesPath] = removeVideoRoutes(next[routesPath])
  if (next[adminPath]) next[adminPath] = removeAdminVideoManager(next[adminPath])
  if (next[branchLoginPath]) {
    next[branchLoginPath] = applyApprovedBranchLoginPresentation(removeBranchLoginVideoCard(next[branchLoginPath]))
  }
  return next
}
