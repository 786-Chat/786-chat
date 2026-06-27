// Shared TypeScript types for the 786.Chat admin persistence layer.

export type AdminMessageRole = "user" | "assistant" | "system"

export type AdminMessage = {
  id: string
  role: AdminMessageRole
  content: string
  model: string | null
  reason: string | null
  created_at: string
}

// preview_state is a MERGED jsonb bag. Future systems own their own keys:
//   active_file, entry_path, theme, colors, animations, zoom, device,
//   preview_url, layout, panel_widths, workspace_state, …
export type AdminProjectPreviewState = {
  active_file?: string
  entry_path?: string
  [key: string]: unknown
}

export type AdminProjectMetadata = {
  model?: string
  provider?: string
  framework?: string
  kind?: string
  [key: string]: unknown
}

export type AdminProject = {
  id: string
  owner_email: string
  kind: string
  title: string
  description: string
  prompt: string
  preview_state: AdminProjectPreviewState
  metadata: AdminProjectMetadata
  created_at: string
  updated_at: string
}

export type AdminProjectListItem = AdminProject & {
  file_count: number
  message_count: number
}

export type AdminProjectFileMap = Record<string, string>

export type AdminProjectWithData = AdminProject & {
  files: AdminProjectFileMap
  messages: AdminMessage[]
}
