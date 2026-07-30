import type { AdminProjectPreviewState } from "@/lib/786-admin/types"
import type { VisualEditorState } from "@/lib/786-chat/visual-editor"

export type BuilderDevice =
  | "desktop"
  | "laptop"
  | "tablet"
  | "mobile"
  | "custom"

export type BuilderMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  model?: string | null
  reason?: string | null
}

export type BuilderProject = {
  id: string
  title: string
  description: string
  prompt: string
  files: Record<string, string>
  previewState: AdminProjectPreviewState
  metadata: Record<string, unknown>
  visualEditor: VisualEditorState
}

export type BuilderProjectSummary = {
  id: string
  title: string
  description: string
  updated_at: string
  file_count: number
  message_count: number
}

export type BuilderRevision = {
  id: string
  label: string
  source: string
  created_at: string
}

export type BuilderDeploymentResult = {
  url: string
  requestedUrl: string
  fallbackUrl: string
  domain: {
    address_type: "path" | "subdomain" | "custom"
    status: string
    dns_status: string
    ssl_status: string
    dns_records?: Array<{ type: string; name: string; value: string }>
  }
}

export type BuilderBuild = {
  id: string
  project_id: string
  status: "queued" | "running" | "passed" | "failed" | "cancelled"
  logs: string
  error_message: string | null
  deployment_url: string | null
}

export type BuilderAttachment = {
  id: string
  name: string
  mediaType: string
  url: string
  size: number
}

export type GenerationRequest = {
  message: string
  projectId?: string
  attachments: Array<Pick<BuilderAttachment, "name" | "mediaType" | "url">>
  existing?: {
    title: string
    description: string
    fileTree: string[]
    keyFiles: Record<string, string>
  }
}

export type GenerationResult = {
  response: string
  model: string | null
  reason: string | null
  specification?: Record<string, unknown>
  plan?: Record<string, unknown>
  validation?: Record<string, unknown>
  project: {
    title: string
    description: string
    files: Record<string, string>
  }
}

export const BUILDER_DEVICES: Record<
  BuilderDevice,
  { label: string; width: number | null; height: number | null }
> = {
  desktop: { label: "Desktop · Fill screen", width: null, height: null },
  laptop: { label: "Laptop · 1366 × 768", width: 1366, height: 768 },
  tablet: { label: "Tablet · 768 × 1024", width: 768, height: 1024 },
  mobile: { label: "Mobile · 393 × 852", width: 393, height: 852 },
  custom: { label: "Custom size", width: 960, height: 720 },
}
