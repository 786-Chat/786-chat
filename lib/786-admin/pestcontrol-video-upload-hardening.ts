const PEST_CONTROL_PROJECT_ID = "22c299f8-bf65-410f-9643-92a9776dbfca"
const APPROVED_CAT_DEVICE = "data:image/webp;base64,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"

function removeAdminVideoManager(source: string): string {
  let next = source
  const a = next.indexOf("function BranchLoginVideoManager() {")
  const b = next.indexOf("export default function AdminDashboard() {", Math.max(0, a))
  if (a >= 0 && b > a) next = next.slice(0, a) + next.slice(b)
  return next.replace(/\{\s*id:\s*["']branch-login-video["'][\s\S]*?\},?\s*/g, "").replace(/<BranchLoginVideoManager\s*\/>/g, "")
}

function removeBranchLoginVideoCard(source: string): string {
  let next = source
  const a = next.indexOf("        {/* Admin-managed Branch Login marketing video */}")
  const b = next.indexOf("        {/* Beautiful Login Form */}", Math.max(0, a))
  if (a >= 0 && b > a) next = next.slice(0, a) + next.slice(b)
  return next.replace(/\s*const\s*\[branchLoginVideoUrl,\s*setBranchLoginVideoUrl\]\s*=\s*useState\([^\n]*\);?/g, "")
}

function applyApprovedBranchLoginPresentation(source: string): string {
  let next = source
  next = next
    .replace("relative z-20 flex flex-col items-center justify-center max-w-7xl mx-auto w-full min-w-0 gap-4 py-6", "relative z-20 flex flex-col items-center justify-start max-w-sm mx-auto w-full min-w-0 gap-2 pt-16 sm:pt-14 pb-5 px-3")
    .replace("--cube-size: 148px;", "--cube-size: 112px;")
    .replace("@media (min-width: 640px) { .branch-login-cube-stage { --cube-size: 180px; margin-bottom: 38px; } }", "@media (min-width: 640px) { .branch-login-cube-stage { --cube-size: 126px; margin-bottom: 16px; } }")
    .replace("@media (min-width: 1024px) { .branch-login-cube-stage { --cube-size: 210px; margin-bottom: 44px; } }", "@media (min-width: 1024px) { .branch-login-cube-stage { --cube-size: 138px; margin-bottom: 18px; } }")
    .replace("margin: 8px auto 30px;", "margin: 4px auto 14px;")
    .replace("filter: drop-shadow(0 0 24px rgba(124,58,237,.45));", "filter: drop-shadow(0 0 24px rgba(34,197,94,.55));")
    .replace("border: 1px solid rgba(196,181,253,.6);", "border: 1px solid rgba(74,222,128,.75);")
    .replace("background: linear-gradient(145deg, rgba(15,23,42,.98), rgba(76,29,149,.9));", "background: linear-gradient(145deg, rgba(5,46,22,.98), rgba(22,101,52,.95));")
    .replace("background: #07111f;", "background: linear-gradient(145deg,#052e16,#166534);")
    .replace('className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border-purple-500/30 shadow-2xl"', 'className="w-full max-w-sm mx-auto bg-slate-800/60 backdrop-blur-xl border-purple-500/30 shadow-2xl"')
    .replace('className="text-center space-y-4"', 'className="text-center space-y-1 p-3 pb-2"')
    .replace('text-2xl sm:text-3xl font-bold', 'text-xl sm:text-2xl font-bold')
    .replace('Pest Control Services\n              </CardTitle>', 'Branch Login\n              </CardTitle>')
    .replace('className="self-center text-purple-400 hover:text-purple-300"', 'className="hidden"')
    .replace('className="space-y-6"', 'className="space-y-3"')
    .replace('className="mt-8 p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white text-center text-sm"', 'className="mt-3 p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white text-center text-xs"')
    .replace('className="mt-6 space-y-3"', 'className="mt-3 space-y-2"')
    .replace(/https:\/\/wa\.me\/\d+/g, "https://wa.me/447427070000")
    .replace(/\+44\s*7427?\s*070000|\+44\s*742\s*707\s*0000/g, "+44 7427 070000")

  const cardEnd = "        </Card>\n      </div>"
  if (!next.includes("branch-login-approved-cat-device") && next.includes(cardEnd)) {
    const visual = `        </Card>\n        <div className="branch-login-approved-cat-device w-full max-w-[270px] mx-auto -mt-1 flex justify-center" aria-label="Pest control device and cat">\n          <img src="${APPROVED_CAT_DEVICE}" alt="Black pest control device beside a calico cat" className="block w-full h-auto object-contain drop-shadow-2xl" />\n        </div>\n      </div>`
    next = next.replace(cardEnd, visual)
  }

  const footer = 'className="branch-login-approved-footer relative z-20 w-full text-center text-xs sm:text-sm text-slate-300 pb-3 pt-1 px-4"'
  next = next.replace(footer, 'className="branch-login-approved-footer absolute bottom-2 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm text-center text-[9px] sm:text-[10px] text-slate-300 px-4 pointer-events-none"')
  return next
}

function removeVideoRoutes(source: string): string {
  let next = source
  const markers = ["  // Admin-authorized client upload token route for Branch Login marketing video.", "  // Admin-only upload for Branch Login marketing video"]
  for (const marker of markers) {
    const a = next.indexOf(marker), b = next.indexOf("  // Admin logout endpoint", Math.max(0, a))
    if (a >= 0 && b > a) { next = next.slice(0, a) + next.slice(b); break }
  }
  return next
}

export function hardenPestControlVideoUpload(projectId: string, files: Record<string, string>): Record<string, string> {
  if (projectId !== PEST_CONTROL_PROJECT_ID) return files
  const next = { ...files }
  if (next["server/routes.ts"]) next["server/routes.ts"] = removeVideoRoutes(next["server/routes.ts"])
  if (next["client/src/pages/AdminDashboard.tsx"]) next["client/src/pages/AdminDashboard.tsx"] = removeAdminVideoManager(next["client/src/pages/AdminDashboard.tsx"])
  if (next["client/src/pages/BranchLogin.tsx"]) next["client/src/pages/BranchLogin.tsx"] = applyApprovedBranchLoginPresentation(removeBranchLoginVideoCard(next["client/src/pages/BranchLogin.tsx"]))
  return next
}
