export type WorkspaceRole = "customer" | "admin"

export type WorkspaceCapabilities = {
  role: WorkspaceRole
  projectsRoute: string
  settingsRoute: string
  loginRoute: string
  canManagePlatform: boolean
  canManageUsers: boolean
  canPublishMainSite: boolean
  canUseAdminModels: boolean
}

const CUSTOMER_CAPABILITIES: WorkspaceCapabilities = {
  role: "customer",
  projectsRoute: "/dashboard/projects",
  settingsRoute: "/dashboard/settings",
  loginRoute: "/login",
  canManagePlatform: false,
  canManageUsers: false,
  canPublishMainSite: false,
  canUseAdminModels: false,
}

const ADMIN_CAPABILITIES: WorkspaceCapabilities = {
  role: "admin",
  projectsRoute: "/786-admin/projects",
  settingsRoute: "/786-admin/settings",
  loginRoute: "/786-admin/login",
  canManagePlatform: true,
  canManageUsers: true,
  canPublishMainSite: true,
  canUseAdminModels: true,
}

export function getWorkspaceCapabilities(role: WorkspaceRole): WorkspaceCapabilities {
  return role === "admin" ? ADMIN_CAPABILITIES : CUSTOMER_CAPABILITIES
}

export function isAdminEmail(email?: string | null): boolean {
  return email?.trim().toLowerCase() === "mujeeb@job4u.com"
}
