// Admin configuration
// Only this email gets access to Vercel AI Gateway + Agent Mode

export const ADMIN_EMAIL = "mujeeb@job4u.com"

export function isAdminUser(email: string | undefined): boolean {
  if (!email) return false
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

// Agent tools configuration
export const AGENT_CONFIG = {
  // GitHub repo for MujeebProAI
  github: {
    owner: "mujeebpro123",
    repo: "mujeebproai",
    branch: "main",
  },
  // Vercel project
  vercel: {
    projectId: "prj_0KcMrXwOTFJGHZ1GkVAF8lRRBMm2",
    teamId: "team_ramDdJPbDZUAmHzZhWYHvxEt",
  },
}
