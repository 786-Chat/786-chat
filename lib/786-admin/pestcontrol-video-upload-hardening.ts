const PEST_CONTROL_PROJECT_ID = "22c299f8-bf65-410f-9643-92a9776dbfca"

/**
 * Branch Login video was retired at the owner's request.
 * Keep this hardening step in the build pipeline so old saved/generated source
 * cannot reintroduce the sidebar item, uploader, video card, or video routes.
 */
function removeAdminVideoManager(source: string): string {
  let next = source

  // Remove the component itself when present.
  const componentStart = next.indexOf("function BranchLoginVideoManager() {")
  const dashboardStart = next.indexOf("export default function AdminDashboard() {", Math.max(0, componentStart))
  if (componentStart >= 0 && dashboardStart > componentStart) {
    next = next.slice(0, componentStart) + next.slice(dashboardStart)
  }

  // Remove common sidebar/menu entries and render cases left by older builds.
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

  // Remove the full card inserted by previous hardening versions.
  const cardMarker = "        {/* Admin-managed Branch Login marketing video */}"
  const formMarker = "        {/* Beautiful Login Form */}"
  const cardStart = next.indexOf(cardMarker)
  const formStart = next.indexOf(formMarker, Math.max(0, cardStart))
  if (cardStart >= 0 && formStart > cardStart) {
    next = next.slice(0, cardStart) + next.slice(formStart)
  }

  // Remove old conditional card variants as a fallback.
  next = next.replace(/\s*\{branchLoginVideoUrl\s*&&\s*\([\s\S]*?\)\}\s*(?=\{?\/\* Beautiful Login Form \*\/\}?)/g, "\n")

  // Remove public-media fetch/state when it only exists for the retired card.
  next = next
    .replace(/\s*const\s*\[branchLoginVideoUrl,\s*setBranchLoginVideoUrl\]\s*=\s*useState\([^\n]*\);?/g, "")
    .replace(/\s*useEffect\(\(\)\s*=>\s*\{\s*fetch\(["']\/api\/public\/branch-login-media["'][\s\S]*?\},\s*\[\]\s*\);?/g, "")

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
  if (next[branchLoginPath]) next[branchLoginPath] = removeBranchLoginVideoCard(next[branchLoginPath])

  return next
}
