const PEST_CONTROL_PROJECT_ID = "22c299f8-bf65-410f-9643-92a9776dbfca"

const EMPTY_BRANCH_LOGIN_VIDEO = /\{\s*activeTab\s*===\s*["']branch-login-video["']\s*&&\s*\(\s*\)\s*\}/g
const BRANCH_LOGIN_VIDEO_STATE = /\n\s*const\s*\[branchLoginVideoUrl,\s*setBranchLoginVideoUrl\]\s*=\s*useState\([^\n]*\);?/g
const BRANCH_LOGIN_VIDEO_EFFECT = /\n\s*\/\/ Load the admin-managed Branch Login marketing video\s*\n\s*useEffect\(\(\)\s*=>\s*\{\s*fetch\(['"]\/api\/public\/branch-login-media['"]\)[\s\S]*?\.catch\(\(\)\s*=>\s*setBranchLoginVideoUrl\(['"]['"]\)\);\s*\},\s*\[\]\);/g

export function removePestControlEmptyBranchVideoJsx(
  projectId: string,
  files: Record<string, string>,
): Record<string, string> {
  if (projectId !== PEST_CONTROL_PROJECT_ID) return files

  let changed = false
  const next = { ...files }

  const adminPath = "client/src/pages/AdminDashboard.tsx"
  const adminSource = next[adminPath]
  if (adminSource) {
    const cleanedAdmin = adminSource.replace(EMPTY_BRANCH_LOGIN_VIDEO, "")
    if (cleanedAdmin !== adminSource) {
      next[adminPath] = cleanedAdmin
      changed = true
    }
  }

  const branchLoginPath = "client/src/pages/BranchLogin.tsx"
  const branchLoginSource = next[branchLoginPath]
  if (branchLoginSource) {
    const cleanedBranchLogin = branchLoginSource
      .replace(BRANCH_LOGIN_VIDEO_EFFECT, "")
      .replace(BRANCH_LOGIN_VIDEO_STATE, "")
    if (cleanedBranchLogin !== branchLoginSource) {
      next[branchLoginPath] = cleanedBranchLogin
      changed = true
    }
  }

  return changed ? next : files
}
