import { getSql } from "./db"

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

// Check if user is blocked
export async function isUserBlocked(userId: string): Promise<{ blocked: boolean; reason: string | null }> {
  const sql = getSql()
  const result = await sql`
    SELECT is_blocked, block_reason FROM users WHERE id = ${userId}
  `
  if (result.length === 0) return { blocked: false, reason: null }
  return { 
    blocked: result[0].is_blocked === true, 
    reason: result[0].block_reason 
  }
}

// Check if user has unlimited messages
export async function hasUnlimitedMessages(userId: string): Promise<boolean> {
  const sql = getSql()
  const result = await sql`
    SELECT unlimited_messages, is_admin FROM users WHERE id = ${userId}
  `
  if (result.length === 0) return false
  return result[0].unlimited_messages === true || result[0].is_admin === true
}

// Block a user
export async function blockUser(userId: string, reason: string): Promise<void> {
  const sql = getSql()
  await sql`
    UPDATE users 
    SET is_blocked = true, block_reason = ${reason}, blocked_at = NOW()
    WHERE id = ${userId}
  `
}

// Unblock a user
export async function unblockUser(userId: string): Promise<void> {
  const sql = getSql()
  await sql`
    UPDATE users 
    SET is_blocked = false, block_reason = NULL, blocked_at = NULL
    WHERE id = ${userId}
  `
}

// Master access - admin can impersonate any user
export async function canMasterAccess(adminEmail: string | null | undefined): Promise<boolean> {
  return isAdmin(adminEmail)
}

// Get user by ID for master access
export async function getUserForMasterAccess(userId: string) {
  const sql = getSql()
  const result = await sql`
    SELECT id, email, name, plan, is_blocked, block_reason, created_at
    FROM users WHERE id = ${userId}
  `
  return result[0] || null
}
