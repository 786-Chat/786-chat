import type {
  BuilderBuild,
  BuilderDeploymentResult,
  BuilderMessage,
  BuilderProject,
  BuilderProjectSummary,
  BuilderRevision,
  GenerationRequest,
  GenerationResult,
} from "./contracts"

type StoredMessage = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  model?: string | null
  reason?: string | null
}

type StoredProject = {
  id: string
  title: string
  description: string
  prompt: string
  files?: Record<string, string>
  preview_state?: Record<string, unknown>
  messages?: StoredMessage[]
}

function errorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const value = (payload as { error?: unknown }).error
    if (typeof value === "string" && value.trim()) return value
  }
  return fallback
}

function toMessage(message: StoredMessage): BuilderMessage {
  return {
    id: message.id,
    role: message.role === "user" ? "user" : "assistant",
    content: message.content,
    model: message.model,
    reason: message.reason,
  }
}

function toProject(project: StoredProject): BuilderProject {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    prompt: project.prompt,
    files: project.files || {},
    previewState: project.preview_state || {},
  }
}

export async function loadBuilderProject(projectId: string) {
  const response = await fetch(`/api/786-chat/projects/${projectId}`, {
    cache: "no-store",
  })
  const payload = (await response.json().catch(() => ({}))) as {
    project?: StoredProject
  }
  if (!response.ok || !payload.project) {
    throw new Error(errorMessage(payload, "Could not load this project."))
  }
  return {
    project: toProject(payload.project),
    messages: (payload.project.messages || []).map(toMessage),
  }
}

export async function generateBuilderProject(request: GenerationRequest) {
  const response = await fetch("/api/786-chat/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...request, mode: "auto" }),
  })
  const payload = (await response.json().catch(() => ({}))) as Partial<GenerationResult> & {
    success?: boolean
    validation?: { errors?: string[] }
  }
  if (!response.ok || !payload.success || !payload.project) {
    const validationErrors = payload.validation?.errors?.filter(Boolean) || []
    const detail = validationErrors.length
      ? ` Missing: ${validationErrors.slice(0, 4).join("; ")}`
      : ""
    throw new Error(`${errorMessage(payload, "Project generation failed.")}${detail}`)
  }
  return {
    response: payload.response || `Created ${payload.project.title}`,
    model: payload.model || null,
    reason: payload.reason || null,
    specification: payload.specification as Record<string, unknown> | undefined,
    plan: payload.plan as Record<string, unknown> | undefined,
    validation: payload.validation as Record<string, unknown> | undefined,
    project: payload.project,
  } satisfies GenerationResult
}

export async function saveBuilderProject(input: {
  currentProjectId: string | null
  userPrompt: string
  generated: GenerationResult
}) {
  const activeFile = input.generated.project.files["app/page.tsx"]
    ? "app/page.tsx"
    : Object.keys(input.generated.project.files)[0] || "app/page.tsx"
  const response = await fetch(
    input.currentProjectId
      ? `/api/786-chat/projects/${input.currentProjectId}`
      : "/api/786-chat/projects",
    {
      method: input.currentProjectId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(!input.currentProjectId
          ? {
              title: input.generated.project.title,
              description: input.generated.project.description,
            }
          : {}),
        prompt: input.userPrompt,
        files: input.generated.project.files,
        preview_state: { active_file: activeFile, entry_path: "app/page.tsx" },
        metadata: {
          model: input.generated.model,
          specification: input.generated.specification,
          plan: input.generated.plan,
          validation: input.generated.validation,
        },
        messages: [
          { role: "user", content: input.userPrompt },
          {
            role: "assistant",
            content: input.generated.response,
            model: input.generated.model,
            reason: input.generated.reason,
          },
        ],
      }),
    },
  )
  const payload = (await response.json().catch(() => ({}))) as {
    project?: StoredProject
  }
  if (!response.ok || !payload.project) {
    throw new Error(errorMessage(payload, "Generated files could not be saved."))
  }
  return toProject(payload.project)
}

export async function queueBuilderBuild(projectId: string) {
  const response = await fetch(`/api/786-chat/projects/${projectId}/build`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirm: true }),
  })
  const payload = (await response.json().catch(() => ({}))) as {
    build?: BuilderBuild
    validation?: unknown
    error?: string
  }
  if (!response.ok || !payload.build) {
    throw new Error(payload.error || "Project could not be queued for build.")
  }
  return payload.build
}

export async function loadBuilderBuild(projectId: string) {
  const response = await fetch(`/api/786-chat/projects/${projectId}/build`, {
    cache: "no-store",
  })
  const payload = (await response.json().catch(() => ({}))) as {
    build?: BuilderBuild | null
    error?: string
  }
  if (!response.ok) throw new Error(payload.error || "Build status could not be loaded.")
  return payload.build || null
}

export async function listBuilderProjects(): Promise<BuilderProjectSummary[]> {
  const response = await fetch("/api/786-chat/projects", { cache: "no-store" })
  const payload = (await response.json().catch(() => ({}))) as {
    projects?: BuilderProjectSummary[]
    error?: string
  }
  if (!response.ok) throw new Error(payload.error || "Projects could not be loaded.")
  return payload.projects || []
}

export async function listBuilderRevisions(projectId: string): Promise<BuilderRevision[]> {
  const response = await fetch(`/api/786-chat/projects/${projectId}/revisions`, {
    cache: "no-store",
  })
  const payload = (await response.json().catch(() => ({}))) as {
    revisions?: BuilderRevision[]
    error?: string
  }
  if (!response.ok) throw new Error(payload.error || "Revisions could not be loaded.")
  return payload.revisions || []
}

export async function createBuilderRevision(projectId: string, label = "Manual checkpoint") {
  const response = await fetch(`/api/786-chat/projects/${projectId}/revisions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label, source: "manual" }),
  })
  const payload = (await response.json().catch(() => ({}))) as {
    revision?: BuilderRevision
    error?: string
  }
  if (!response.ok || !payload.revision) {
    throw new Error(payload.error || "Revision could not be created.")
  }
  return payload.revision
}

export async function restoreBuilderRevision(projectId: string, revisionId: string) {
  const response = await fetch(
    `/api/786-chat/projects/${projectId}/revisions/${revisionId}/restore`,
    { method: "POST" },
  )
  const payload = (await response.json().catch(() => ({}))) as {
    project?: StoredProject
    error?: string
  }
  if (!response.ok || !payload.project) {
    throw new Error(payload.error || "Revision could not be restored.")
  }
  return {
    project: toProject(payload.project),
    messages: (payload.project.messages || []).map(toMessage),
  }
}

export async function deployBuilderProject(input: {
  projectId: string
  addressType: "path" | "subdomain" | "custom"
  addressValue: string
}): Promise<BuilderDeploymentResult> {
  const response = await fetch(`/api/786-chat/projects/${input.projectId}/deploy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      addressType: input.addressType,
      addressValue: input.addressValue,
    }),
  })
  const payload = (await response.json().catch(() => ({}))) as
    Partial<BuilderDeploymentResult> & { error?: string }
  if (!response.ok || !payload.url || !payload.domain) {
    throw new Error(payload.error || "Verified deployment could not be created.")
  }
  return payload as BuilderDeploymentResult
}
