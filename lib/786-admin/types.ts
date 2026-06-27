export type AdminMessageRole = "user" | "assistant" | "system"

export type AdminProjectPreviewState = Record<string, unknown>
export type AdminProjectMetadata = Record<string, unknown>
export type AdminProjectFileMap = Record<string, string>

export type AdminProject = {
  id: string
  owner_email: string
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

export type AdminMessage = {
  id: string
  role: AdminMessageRole
  content: string
  model?: string | null
  reason?: string | null
  created_at: string
}

export type AdminProjectWithData = AdminProject & {
  files: AdminProjectFileMap
  messages: AdminMessage[]
}
