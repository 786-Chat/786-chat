import type { AdminProjectPreviewState } from "@/lib/786-admin/types"
import type { VisualEditorState } from "@/lib/786-chat/visual-editor"

export type BuilderDevice =
  | "desktop"
  | "laptop"
  | "tablet"
  | "ipadPro"
  | "ipadAir"
  | "ipadMini"
  | "mobile"
  | "iphone17ProMax"
  | "iphone16ProMax"
  | "iphone16Pro"
  | "iphone16"
  | "iphone15ProMax"
  | "iphone15"
  | "iphone14"
  | "iphone13"
  | "iphoneSE"
  | "android"
  | "pixel9Pro"
  | "pixel9"
  | "pixel8"
  | "galaxyS25Ultra"
  | "galaxyS25"
  | "galaxyS24"
  | "galaxyA55"
  | "onePlus12"
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
  created_at: string
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

export type BuilderDeploymentDomain = {
  id: string
  address_type: "path" | "subdomain" | "custom"
  slug: string | null
  hostname: string | null
  is_primary: boolean
  status: string
  dns_status: string
  ssl_status: string
  dns_records?: Array<{ type: string; name: string; value: string; reason?: string }>
  error_message?: string | null
  verified_at?: string | null
  updated_at?: string
}

export type BuilderDeploymentVersion = {
  id: string
  version: number
  action: "deploy" | "redeploy" | "rollback"
  status: "live" | "failed"
  runtime_url: string | null
  build_id: string | null
  source_version: string
  restored_version: number | null
  published_at: string
}

export type BuilderDeploymentLifecycle = {
  deployment: {
    id: string
    slug: string
    status: "live" | "failed"
    version: number
    runtime_url: string | null
    build_id: string | null
    published_at: string
  } | null
  domains: BuilderDeploymentDomain[]
  history: BuilderDeploymentVersion[]
}

export type BuilderDeploymentResult = BuilderDeploymentLifecycle & {
  url: string
  requestedUrl: string
  fallbackUrl: string
  domain: BuilderDeploymentDomain
}

export type BuilderBuild = {
  id: string
  project_id: string
  status: "queued" | "running" | "passed" | "failed" | "cancelled"
  logs: string
  error_message: string | null
  deployment_url: string | null
  repair_status: "not_needed" | "pending" | "running" | "repaired" | "exhausted"
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
  generationId?: string
  response: string
  model: string | null
  reason: string | null
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    estimatedCostUsd: number
  }
  providerAttempts?: unknown[]
  providerFailoverUsed?: boolean
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
  ipadPro: { label: "iPad Pro 11 · 834 × 1194", width: 834, height: 1194 },
  ipadAir: { label: "iPad Air · 820 × 1180", width: 820, height: 1180 },
  ipadMini: { label: "iPad mini · 744 × 1133", width: 744, height: 1133 },
  mobile: { label: "Mobile · 393 × 852", width: 393, height: 852 },
  iphone17ProMax: { label: "iPhone 17 Pro Max · 440 × 956", width: 440, height: 956 },
  iphone16ProMax: { label: "iPhone 16 Pro Max · 440 × 956", width: 440, height: 956 },
  iphone16Pro: { label: "iPhone 16 Pro · 402 × 874", width: 402, height: 874 },
  iphone16: { label: "iPhone 16 · 393 × 852", width: 393, height: 852 },
  iphone15ProMax: { label: "iPhone 15 Pro Max · 430 × 932", width: 430, height: 932 },
  iphone15: { label: "iPhone 15 Pro · 393 × 852", width: 393, height: 852 },
  iphone14: { label: "iPhone 14 · 390 × 844", width: 390, height: 844 },
  iphone13: { label: "iPhone 13 · 390 × 844", width: 390, height: 844 },
  iphoneSE: { label: "iPhone SE · 375 × 667", width: 375, height: 667 },
  android: { label: "Android · 360 × 800", width: 360, height: 800 },
  pixel9Pro: { label: "Google Pixel 9 Pro · 412 × 915", width: 412, height: 915 },
  pixel9: { label: "Google Pixel 9 · 412 × 915", width: 412, height: 915 },
  pixel8: { label: "Google Pixel 8 · 412 × 915", width: 412, height: 915 },
  galaxyS25Ultra: { label: "Galaxy S25 Ultra · 412 × 915", width: 412, height: 915 },
  galaxyS25: { label: "Galaxy S25 · 360 × 780", width: 360, height: 780 },
  galaxyS24: { label: "Galaxy S24 · 360 × 780", width: 360, height: 780 },
  galaxyA55: { label: "Galaxy A55 · 412 × 915", width: 412, height: 915 },
  onePlus12: { label: "OnePlus 12 · 412 × 915", width: 412, height: 915 },
  custom: { label: "Custom size", width: 960, height: 720 },
}
