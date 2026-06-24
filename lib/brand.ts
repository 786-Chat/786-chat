export const BRAND_NAME = "786.chat"
export const PLATFORM_DOMAIN = "786.chat"
export const OLD_PLATFORM_DOMAIN = "mujeebproai.com"
export const OWNER_EMAIL = "mujeeb@job4u.com"

export const GITHUB_REPO = "mujeebpro123/mujeebproai"

export const OWNER_EMAILS = [OWNER_EMAIL] as const

export function isOwnerEmail(email?: string | null) {
  return Boolean(email && OWNER_EMAILS.includes(email.toLowerCase() as typeof OWNER_EMAILS[number]))
}
