const PEST_CONTROL_PROJECT_ID = "22c299f8-bf65-410f-9643-92a9776dbfca"

const EMPTY_BRANCH_LOGIN_VIDEO = /\{\s*activeTab\s*===\s*["']branch-login-video["']\s*&&\s*\(\s*\)\s*\}/g

export function removePestControlEmptyBranchVideoJsx(
  projectId: string,
  files: Record<string, string>,
): Record<string, string> {
  if (projectId !== PEST_CONTROL_PROJECT_ID) return files

  const path = "client/src/pages/AdminDashboard.tsx"
  const source = files[path]
  if (!source) return files

  const cleaned = source.replace(EMPTY_BRANCH_LOGIN_VIDEO, "")
  if (cleaned === source) return files

  return { ...files, [path]: cleaned }
}
