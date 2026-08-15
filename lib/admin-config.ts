const DEFAULT_ADMIN_EMAIL = "mujeeb@job4u.com"

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL)
  .replace(/\s+/g, "")
  .toLowerCase() || DEFAULT_ADMIN_EMAIL

export function isAdminUser(email: string | null | undefined): boolean {
  return Boolean(email && email.trim().toLowerCase() === ADMIN_EMAIL)
}

export const AGENT_CONFIG = {
  github: {
    owner: process.env.GITHUB_REPOSITORY_OWNER || "786-Chat",
    repo: process.env.GITHUB_REPOSITORY_NAME || "786-chat",
    branch: process.env.GITHUB_DEFAULT_BRANCH || "main",
  },
  vercel: {
    projectId: process.env.VERCEL_PROJECT_ID || "",
    teamId: process.env.VERCEL_TEAM_ID || "",
  },
} as const