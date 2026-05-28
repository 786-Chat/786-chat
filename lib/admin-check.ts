// Admin email that can edit mujeebproai.com
export const ADMIN_EMAILS = [
  "mujeeb@job4u.com",
]

// Check if user is an admin
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

// Check if user can edit the main mujeebproai.com site
export function canEditMainSite(email: string | null | undefined): boolean {
  return isAdmin(email)
}

// Check if user can edit a specific project
export function canEditProject(userEmail: string | null | undefined, projectOwnerId: string, userId: string): boolean {
  // Admins can edit anything
  if (isAdmin(userEmail)) return true
  // Users can only edit their own projects
  return projectOwnerId === userId
}
