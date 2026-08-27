import type { AdminProjectBuild } from "./build-jobs"

const DEFAULT_REPOSITORY = "786-Chat/786-chat"
const DEFAULT_BASE_BRANCH = "main"
const MAX_SYNC_FILES = 80

type CompareFile = {
  filename?: unknown
  previous_filename?: unknown
  status?: unknown
}

type ComparePayload = {
  status?: unknown
  files?: CompareFile[]
}

type ContentPayload = {
  type?: unknown
  encoding?: unknown
  content?: unknown
}

export type MergedGeneratedRepairDelta = {
  checked: boolean
  updates: Record<string, string>
  deletes: string[]
  reason: string
}

function token(): string | null {
  return process.env.GITHUB_BUILD_TOKEN?.trim() || null
}

function repository(): string {
  return process.env.GITHUB_BUILD_REPOSITORY?.trim() || DEFAULT_REPOSITORY
}

function baseBranch(): string {
  return process.env.GITHUB_GENERATED_BASE_BRANCH?.trim() || DEFAULT_BASE_BRANCH
}

function cleanProjectSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

async function githubJson<T>(path: string): Promise<T> {
  const auth = token()
  if (!auth) throw new Error("GITHUB_BUILD_TOKEN is not configured")

  const response = await fetch(`https://api.github.com/repos/${repository()}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${auth}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(
      `GitHub repair sync failed (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`,
    )
  }

  return (await response.json()) as T
}

async function fetchMainTextFile(path: string): Promise<string> {
  const payload = await githubJson<ContentPayload>(
    `/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(baseBranch())}`,
  )

  if (payload.type !== "file" || payload.encoding !== "base64" || typeof payload.content !== "string") {
    throw new Error(`GitHub repair sync could not read ${path}`)
  }

  return Buffer.from(payload.content.replace(/\s/g, ""), "base64").toString("utf8")
}

function projectRelativePath(projectPrefix: string, filename: string): string | null {
  if (!filename.startsWith(projectPrefix)) return null
  const relative = filename.slice(projectPrefix.length)
  if (!relative || relative === ".786-chat-build.json") return null
  return relative
}

/**
 * Detect merged manual repairs for one generated project without overwriting newer
 * builder edits. The database remains canonical whenever it has changed since the
 * latest successfully published build. Only when the database source version still
 * exactly matches that published build do we import project-scoped changes that were
 * later merged into the repository's generated-project directory.
 */
export async function mergedGeneratedRepairDelta(input: {
  projectId: string
  currentSourceVersion: string
  latestBuild: AdminProjectBuild | null
}): Promise<MergedGeneratedRepairDelta> {
  const latest = input.latestBuild
  if (!latest || latest.status !== "passed" || !latest.github_commit_sha) {
    return { checked: false, updates: {}, deletes: [], reason: "No successful published build to compare." }
  }

  if (latest.source_version !== input.currentSourceVersion) {
    return {
      checked: false,
      updates: {},
      deletes: [],
      reason: "Builder files are newer than the last published build; merged GitHub files were not imported.",
    }
  }

  if (!token()) {
    return { checked: false, updates: {}, deletes: [], reason: "GitHub build token is unavailable." }
  }

  try {
    const compare = await githubJson<ComparePayload>(
      `/compare/${encodeURIComponent(latest.github_commit_sha)}...${encodeURIComponent(baseBranch())}`,
    )
    const status = typeof compare.status === "string" ? compare.status : "unknown"

    if (status === "identical" || !Array.isArray(compare.files) || compare.files.length === 0) {
      return { checked: true, updates: {}, deletes: [], reason: "No merged generated-project repairs found." }
    }

    if (status !== "ahead") {
      return {
        checked: true,
        updates: {},
        deletes: [],
        reason: `Merged repair sync skipped because repository comparison state is ${status}.`,
      }
    }

    const segment = cleanProjectSegment(input.projectId) || "project"
    const prefix = `generated-projects/${segment}/`
    const projectFiles = compare.files.filter((file) =>
      typeof file.filename === "string" && file.filename.startsWith(prefix),
    )

    if (projectFiles.length === 0) {
      return { checked: true, updates: {}, deletes: [], reason: "No merged repairs changed this generated project." }
    }

    if (projectFiles.length > MAX_SYNC_FILES) {
      return {
        checked: true,
        updates: {},
        deletes: [],
        reason: `Merged repair sync skipped because ${projectFiles.length} project files changed; safe limit is ${MAX_SYNC_FILES}.`,
      }
    }

    const updates: Record<string, string> = {}
    const deleteSet = new Set<string>()

    for (const file of projectFiles) {
      if (typeof file.filename !== "string") continue
      const relative = projectRelativePath(prefix, file.filename)
      if (!relative) continue
      const fileStatus = typeof file.status === "string" ? file.status : "modified"

      if (fileStatus === "removed") {
        deleteSet.add(relative)
        continue
      }

      if (fileStatus === "renamed" && typeof file.previous_filename === "string") {
        const previousRelative = projectRelativePath(prefix, file.previous_filename)
        if (previousRelative && previousRelative !== relative) deleteSet.add(previousRelative)
      }

      updates[relative] = await fetchMainTextFile(file.filename)
    }

    return {
      checked: true,
      updates,
      deletes: [...deleteSet].filter((path) => !(path in updates)),
      reason: `Found ${Object.keys(updates).length} merged file update(s) and ${deleteSet.size} deletion(s) for this project.`,
    }
  } catch (error) {
    return {
      checked: false,
      updates: {},
      deletes: [],
      reason: error instanceof Error ? error.message : "Merged generated repair sync failed.",
    }
  }
}
