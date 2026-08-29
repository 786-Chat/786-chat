import type { AdminProjectBuild } from "./build-jobs"
import { ensureBuildJobsSchema } from "./build-jobs"
import { sql, transaction } from "./db"

const DEFAULT_REPOSITORY = "786-Chat/786-chat"
const DEFAULT_BASE_BRANCH = "main"
const MAX_RECOVERY_FILES = 500
const BLOB_BATCH_SIZE = 12
const MAX_BUILD_CANDIDATES = 50

export const LAST_SUCCESSFUL_PUBLISHED_REVISION_ID = "last-successful-published"

const LAST_SUCCESSFUL_PUBLISHED_LABEL = "Recover last successful published source"

type GitTreeEntry = {
  path?: unknown
  type?: unknown
  sha?: unknown
}

type GitTreePayload = {
  tree?: GitTreeEntry[]
  truncated?: unknown
}

type GitBlobPayload = {
  encoding?: unknown
  content?: unknown
}

type GitComparePayload = {
  status?: unknown
}

type GitRefPayload = {
  object?: {
    sha?: unknown
  }
}

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

function githubToken(): string {
  const token = process.env.GITHUB_BUILD_TOKEN?.trim()
  if (!token) throw new Error("GITHUB_BUILD_TOKEN is not configured")
  return token
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
  const response = await fetch(`https://api.github.com/repos/${repository()}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${githubToken()}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(
      `GitHub published-source recovery failed (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`,
    )
  }

  return (await response.json()) as T
}

async function isCommitMergedIntoBase(commitSha: string): Promise<boolean> {
  try {
    const compare = await githubJson<GitComparePayload>(
      `/compare/${encodeURIComponent(commitSha)}...${encodeURIComponent(baseBranch())}`,
    )
    return compare.status === "ahead" || compare.status === "identical"
  } catch {
    return false
  }
}

async function getBaseBranchCommitSha(): Promise<string> {
  const refPath = baseBranch().split("/").map(encodeURIComponent).join("/")
  const ref = await githubJson<GitRefPayload>(`/git/ref/heads/${refPath}`)
  const sha = ref.object?.sha
  if (typeof sha !== "string" || !sha.trim()) {
    throw new Error("Accepted production branch commit could not be resolved")
  }
  return sha
}

export async function getLastSuccessfulPublishedBuild(
  projectId: string,
  ownerEmail: string,
): Promise<AdminProjectBuild | null> {
  await ensureBuildJobsSchema()
  const rows = (await sql`
    SELECT b.*
    FROM admin_project_builds b
    INNER JOIN admin_projects p ON p.id = b.project_id
    WHERE b.project_id = ${projectId}
      AND p.owner_email = ${normalizeEmail(ownerEmail)}
      AND b.status = 'passed'
      AND b.github_commit_sha IS NOT NULL
      AND b.deployment_url IS NOT NULL
    ORDER BY COALESCE(b.completed_at, b.updated_at, b.created_at) DESC, b.created_at DESC
    LIMIT ${MAX_BUILD_CANDIDATES}
  `) as unknown as AdminProjectBuild[]

  // A successful preview deployment is not necessarily an accepted/published project.
  // Ignore generated draft/unmerged preview commits so Restore can never recover a
  // rejected experiment such as a closed or unmerged generated PR.
  for (const build of rows) {
    if (build.github_commit_sha && await isCommitMergedIntoBase(build.github_commit_sha)) {
      return build
    }
  }

  return null
}

export function lastSuccessfulPublishedRevision(build: AdminProjectBuild) {
  return {
    id: LAST_SUCCESSFUL_PUBLISHED_REVISION_ID,
    label: LAST_SUCCESSFUL_PUBLISHED_LABEL,
    source: "published-recovery",
    created_at: build.completed_at || build.updated_at || build.created_at,
  }
}

function safeRelativePath(projectPrefix: string, repositoryPath: string): string | null {
  if (!repositoryPath.startsWith(projectPrefix)) return null
  const relative = repositoryPath.slice(projectPrefix.length)
  if (!relative || relative === ".786-chat-build.json") return null
  if (relative.startsWith("/") || relative.split("/").includes("..")) {
    throw new Error(`Unsafe published project path: ${repositoryPath}`)
  }
  return relative
}

async function readPublishedFiles(projectId: string, commitSha: string): Promise<Record<string, string>> {
  const tree = await githubJson<GitTreePayload>(
    `/git/trees/${encodeURIComponent(commitSha)}?recursive=1`,
  )

  if (tree.truncated === true) {
    throw new Error("Published source tree is too large to recover safely")
  }
  if (!Array.isArray(tree.tree)) {
    throw new Error("Published source tree could not be read")
  }

  const segment = cleanProjectSegment(projectId) || "project"
  const projectPrefix = `generated-projects/${segment}/`
  const entries = tree.tree.flatMap((entry) => {
    if (entry.type !== "blob" || typeof entry.path !== "string" || typeof entry.sha !== "string") return []
    const relative = safeRelativePath(projectPrefix, entry.path)
    return relative ? [{ relative, sha: entry.sha }] : []
  })

  if (!entries.length) {
    throw new Error("No published project files were found in the accepted production source")
  }
  if (entries.length > MAX_RECOVERY_FILES) {
    throw new Error(`Published source has ${entries.length} files; safe recovery limit is ${MAX_RECOVERY_FILES}`)
  }

  const files: Record<string, string> = {}
  for (let offset = 0; offset < entries.length; offset += BLOB_BATCH_SIZE) {
    const batch = entries.slice(offset, offset + BLOB_BATCH_SIZE)
    const contents = await Promise.all(batch.map(async (entry) => {
      const blob = await githubJson<GitBlobPayload>(`/git/blobs/${encodeURIComponent(entry.sha)}`)
      if (blob.encoding !== "base64" || typeof blob.content !== "string") {
        throw new Error(`Published source file could not be decoded: ${entry.relative}`)
      }
      return [entry.relative, Buffer.from(blob.content.replace(/\s/g, ""), "base64").toString("utf8")] as const
    }))
    for (const [path, content] of contents) files[path] = content
  }

  return files
}

async function replaceProjectFiles(projectId: string, files: Record<string, string>) {
  const queries: unknown[] = [
    sql`DELETE FROM admin_project_files WHERE project_id = ${projectId}`,
  ]

  for (const [path, content] of Object.entries(files)) {
    queries.push(sql`
      INSERT INTO admin_project_files (project_id, path, content, updated_at)
      VALUES (${projectId}, ${path}, ${content}, NOW())
    `)
  }

  queries.push(sql`
    UPDATE admin_projects
    SET updated_at = NOW()
    WHERE id = ${projectId}
  `)

  await transaction(queries)
}

export async function recoverLastSuccessfulPublishedSource(input: {
  projectId: string
  ownerEmail: string
}) {
  const build = await getLastSuccessfulPublishedBuild(input.projectId, input.ownerEmail)
  if (!build?.github_commit_sha) {
    throw new Error("No successful merged published build is available for recovery")
  }

  // Recover the current accepted base-branch project tree, not the newest preview
  // commit. This preserves merged manual repairs and prevents draft/unmerged preview
  // source from replacing the user's working project.
  const acceptedCommitSha = await getBaseBranchCommitSha()
  const files = await readPublishedFiles(input.projectId, acceptedCommitSha)
  await replaceProjectFiles(input.projectId, files)

  return {
    build,
    restoredRevision: lastSuccessfulPublishedRevision(build),
    restoredFileCount: Object.keys(files).length,
  }
}
