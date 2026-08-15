import type {
  BuilderBuild,
  BuilderDeploymentLifecycle,
  BuilderDeploymentResult,
  BuilderMessage,
  BuilderProject,
  BuilderProjectSummary,
  BuilderRevision,
  GenerationRequest,
  GenerationResult,
} from "./contracts"
import {
  normalizeVisualEditorState,
  type VisualEditorState,
} from "@/lib/786-chat/visual-editor"

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
  metadata?: Record<string, unknown>
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
    metadata: project.metadata || {},
    visualEditor: normalizeVisualEditorState(project.metadata?.visual_editor),
  }
}

export async function saveVisualEditorState(input: {
  projectId: string
  state: VisualEditorState
  label: string
}) {
  const response = await fetch(
    `/api/786-chat/projects/${input.projectId}/visual-editor`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: input.state, label: input.label }),
    },
  )
  const payload = (await response.json().catch(() => ({}))) as {
    project?: StoredProject
    state?: VisualEditorState
    error?: string
  }
  if (!response.ok || !payload.project) {
    throw new Error(payload.error || "Visual edit could not be saved.")
  }
  return toProject(payload.project)
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
  const MAX_GENERATION_CONTINUATIONS = 60
  const MAX_RETRIES_PER_CONTINUATION = 2
  let continuationToken: string | undefined
  let continuationRetryCount = 0
  let payload: Partial<GenerationResult> & {
    success?: boolean
    validation?: { errors?: string[] }
    continuationRequired?: boolean
    continuationToken?: string
    retryableContinuation?: boolean
    continuationRetryCount?: number
    error?: string
  } = {}
  for (let round = 0; round <= MAX_GENERATION_CONTINUATIONS; round++) {
    const response = await fetch("/api/786-chat/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(continuationToken
        ? { continuationToken, continuationRetryCount }
        : { ...request, mode: "auto" }),
    })
    payload = (await response.json().catch(() => ({}))) as typeof payload
    if (!response.ok || !payload.success) {
      if (
        continuationToken &&
        payload.retryableContinuation === true &&
        continuationRetryCount < MAX_RETRIES_PER_CONTINUATION
      ) {
        continuationRetryCount = Math.max(
          continuationRetryCount + 1,
          Number(payload.continuationRetryCount || 0),
        )
        continue
      }
      const validationErrors = payload.validation?.errors?.filter(Boolean) || []
      const detail = validationErrors.length ? ` Missing: ${validationErrors.slice(0, 4).join("; ")}` : ""
      throw new Error(`${errorMessage(payload, "Project generation failed.")}${detail}`)
    }
    continuationRetryCount = 0
    if (!payload.continuationRequired) break
    if (!payload.continuationToken || round === MAX_GENERATION_CONTINUATIONS) throw new Error("Project generation exceeded its safe continuation limit.")
    continuationToken = payload.continuationToken
  }
  if (!payload.project) throw new Error("Project generation ended before the complete project was validated.")
  return {
    generationId: payload.generationId,
    response: payload.response || `Created ${payload.project.title}`,
    model: payload.model || null,
    reason: payload.reason || null,
    usage: payload.usage,
    providerAttempts: payload.providerAttempts,
    providerFailoverUsed: payload.providerFailoverUsed,
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
          generation_id: input.generated.generationId,
          model: input.generated.model,
          usage: input.generated.usage,
          provider_attempts: input.generated.providerAttempts,
          provider_failover_used: input.generated.providerFailoverUsed,
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
        revision_label: `Before AI edit: ${input.userPrompt.slice(0, 100)}`,
        revision_source: "ai-edit",
        record_generation_job: true,
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

export async function saveBuilderCodeEdit(input: {
  project: BuilderProject
  path: string
  content: string
}) {
  const files = { ...input.project.files, [input.path]: input.content }
  const response = await fetch(`/api/786-chat/projects/${input.project.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: input.project.prompt,
      files,
      preview_state: input.project.previewState,
      metadata: input.project.metadata,
      revision_label: `Before code edit: ${input.path}`,
      revision_source: "code-editor",
      record_generation_job: false,
    }),
  })
  const payload = (await response.json().catch(() => ({}))) as { project?: StoredProject }
  if (!response.ok || !payload.project) {
    throw new Error(errorMessage(payload, "Code edit could not be saved."))
  }
  return toProject(payload.project)
}

export async function undoBuilderProject(projectId: string, message = "Undo the last change") {
  const response = await fetch(`/api/786-chat/projects/${projectId}/revisions/undo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  })
  const payload = (await response.json().catch(() => ({}))) as {
    project?: StoredProject
    restoredRevision?: BuilderRevision
  }
  if (!response.ok || !payload.project || !payload.restoredRevision) {
    throw new Error(errorMessage(payload, "The last change could not be undone."))
  }
  return {
    project: toProject(payload.project),
    messages: (payload.project.messages || []).map(toMessage),
    restoredRevision: payload.restoredRevision,
  }
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
    const validation = payload.validation as { errors?: Array<{ message?: string; path?: string }> } | undefined
    const detail = validation?.errors?.length
      ? ` Missing: ${validation.errors.slice(0, 4).map((issue) =>
          `${issue.path ? `${issue.path}: ` : ""}${issue.message || "Invalid build input"}`,
        ).join("; ")}`
      : ""
    throw new Error(`${payload.error || "Project could not be queued for build."}${detail}`)
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

export async function deleteBuilderProject(projectId: string) {
  const response = await fetch(`/api/786-chat/projects/${projectId}`, {
    method: "DELETE",
  })
  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean
    error?: string
  }
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "Project could not be deleted.")
  }
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

async function deploymentAction(
  projectId: string,
  body: Record<string, unknown>,
): Promise<BuilderDeploymentResult> {
  const response = await fetch(`/api/786-chat/projects/${projectId}/deploy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const payload = (await response.json().catch(() => ({}))) as
    Partial<BuilderDeploymentResult> & { error?: string }
  if (!response.ok || !payload.url || !payload.domain) {
    throw new Error(payload.error || "Deployment action failed.")
  }
  return payload as BuilderDeploymentResult
}

export async function loadBuilderDeploymentLifecycle(
  projectId: string,
): Promise<BuilderDeploymentLifecycle> {
  const response = await fetch(`/api/786-chat/projects/${projectId}/deploy`, {
    cache: "no-store",
  })
  const payload = (await response.json().catch(() => ({}))) as
    Partial<BuilderDeploymentLifecycle> & { error?: string }
  if (!response.ok) throw new Error(payload.error || "Deployment history could not be loaded.")
  return {
    deployment: payload.deployment || null,
    domains: payload.domains || [],
    history: payload.history || [],
  }
}

export async function deployBuilderProject(input: {
  projectId: string
  addressType: "path" | "subdomain" | "custom"
  addressValue: string
}) {
  return deploymentAction(input.projectId, {
    action: "deploy",
    addressType: input.addressType,
    addressValue: input.addressValue,
  })
}

export async function redeployBuilderProject(projectId: string) {
  return deploymentAction(projectId, { action: "redeploy" })
}

export async function rollbackBuilderDeployment(projectId: string, version: number) {
  return deploymentAction(projectId, { action: "rollback", version })
}

export async function refreshBuilderDomain(projectId: string, domainId: string) {
  return deploymentAction(projectId, { action: "refresh-domain", domainId })
}
