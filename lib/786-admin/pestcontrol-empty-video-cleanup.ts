const PEST_CONTROL_PROJECT_ID = "22c299f8-bf65-410f-9643-92a9776dbfca"

const EMPTY_BRANCH_LOGIN_VIDEO = /\{\s*activeTab\s*===\s*["']branch-login-video["']\s*&&\s*\(\s*\)\s*\}/g
const BRANCH_LOGIN_VIDEO_STATE = /\n\s*const\s*\[branchLoginVideoUrl,\s*setBranchLoginVideoUrl\]\s*=\s*useState\([^\n]*\);?/g
const BRANCH_LOGIN_VIDEO_EFFECT = /\n\s*\/\/ Load the admin-managed Branch Login marketing video\s*\n\s*useEffect\(\(\)\s*=>\s*\{\s*fetch\(['"]\/api\/public\/branch-login-media['"]\)[\s\S]*?\.catch\(\(\)\s*=>\s*setBranchLoginVideoUrl\(['"]['"]\)\);\s*\},\s*\[\]\);/g
const STATIC_LAST_AUDIT = /<span className="text-white font-semibold">20 Apr 2025<\/span>/g
const CURRENT_LAST_AUDIT = '<span className="text-white font-semibold">20 Apr {new Date().getFullYear()}</span>'
const MOBILE_SETTINGS_MARKER = "/* 786.Chat Pest Control mobile settings overflow guard */"
const MOBILE_SETTINGS_CSS = `

${MOBILE_SETTINGS_MARKER}
@media (max-width: 640px) {
  html, body, #root { max-width: 100%; overflow-x: hidden; }
  #root *, #root *::before, #root *::after { box-sizing: border-box; }
  #root .flex > *, #root .grid > * { min-width: 0; }
  #root input, #root select, #root textarea, #root button { max-width: 100%; }
  #root button, #root label, #root p, #root span:not(.ticker-track), #root h1, #root h2, #root h3, #root h4 { overflow-wrap: anywhere; }
  #root img, #root video, #root svg { max-width: 100%; }
}
`

const SETTINGS_CARD_TITLE = 'className="text-white flex items-center justify-between"'
const SETTINGS_CARD_TITLE_MOBILE = 'className="text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"'
const SETTINGS_HEADER_ACTIONS = 'className="flex items-center space-x-2"'
const SETTINGS_HEADER_ACTIONS_MOBILE = 'className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto"'
const RESET_BUTTON_CLASS = 'className="border-orange-500 text-orange-300 hover:bg-orange-500/10"'
const RESET_BUTTON_CLASS_MOBILE = 'className="border-orange-500 text-orange-300 hover:bg-orange-500/10 w-full sm:w-auto whitespace-normal"'
const SAVE_BRANCH_CLASS = 'className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"'
const SAVE_BRANCH_CLASS_MOBILE = 'className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 w-full sm:w-auto whitespace-normal"'
const RATING_ROW = 'className="flex items-center space-x-3"'
const RATING_ROW_MOBILE = 'className="flex flex-col sm:flex-row gap-3 sm:items-center"'
const RATING_ACTIONS = 'className="flex space-x-2"'
const RATING_ACTIONS_MOBILE = 'className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"'
const RATING_SEND_CLASS = 'className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"'
const RATING_SEND_CLASS_MOBILE = 'className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 w-full sm:w-auto whitespace-normal h-auto min-h-9 text-center"'

export function removePestControlEmptyBranchVideoJsx(projectId: string, files: Record<string, string>): Record<string, string> {
  if (projectId !== PEST_CONTROL_PROJECT_ID) return files
  let changed = false
  const next = { ...files }

  const adminPath = "client/src/pages/AdminDashboard.tsx"
  const adminSource = next[adminPath]
  if (adminSource) {
    let cleanedAdmin = adminSource.replace(EMPTY_BRANCH_LOGIN_VIDEO, "")
    cleanedAdmin = cleanedAdmin
      .replace(SETTINGS_CARD_TITLE, SETTINGS_CARD_TITLE_MOBILE)
      .replace(SETTINGS_HEADER_ACTIONS, SETTINGS_HEADER_ACTIONS_MOBILE)
      .replace(RESET_BUTTON_CLASS, RESET_BUTTON_CLASS_MOBILE)
      .replace(SAVE_BRANCH_CLASS, SAVE_BRANCH_CLASS_MOBILE)
      .replace(RATING_ROW, RATING_ROW_MOBILE)
      .replace(RATING_ACTIONS, RATING_ACTIONS_MOBILE)
      .replace(RATING_SEND_CLASS, RATING_SEND_CLASS_MOBILE)
    if (cleanedAdmin !== adminSource) { next[adminPath] = cleanedAdmin; changed = true }
  }

  const branchLoginPath = "client/src/pages/BranchLogin.tsx"
  const branchLoginSource = next[branchLoginPath]
  if (branchLoginSource) {
    const cleanedBranchLogin = branchLoginSource.replace(BRANCH_LOGIN_VIDEO_EFFECT, "").replace(BRANCH_LOGIN_VIDEO_STATE, "")
    if (cleanedBranchLogin !== branchLoginSource) { next[branchLoginPath] = cleanedBranchLogin; changed = true }
  }

  const branchDashboardPath = "client/src/pages/BranchDashboard.tsx"
  const branchDashboardSource = next[branchDashboardPath]
  if (branchDashboardSource) {
    const cleanedBranchDashboard = branchDashboardSource.replace(STATIC_LAST_AUDIT, CURRENT_LAST_AUDIT)
    if (cleanedBranchDashboard !== branchDashboardSource) { next[branchDashboardPath] = cleanedBranchDashboard; changed = true }
  }

  const cssPath = "client/src/index.css"
  const cssSource = next[cssPath]
  if (cssSource && !cssSource.includes(MOBILE_SETTINGS_MARKER)) { next[cssPath] = `${cssSource}${MOBILE_SETTINGS_CSS}`; changed = true }

  return changed ? next : files
}
