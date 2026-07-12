import { validateGeneratedProject } from "./build-validation"
import { sql } from "./db"

export type AdminProjectDeployment = {
  id: string
  project_id: string
  slug: string
  title: string
  status: "live" | "failed"
  published_html: string
  files: Record<string, string>
  version: number
  published_at: string
  updated_at: string
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54)
}

function scopePublishedHtml(html: string, slug: string): string {
  const base = `/p/${slug}`
  let next = html

  next = next.replace(
    "try { history.replaceState({ previewRoute: path }, '', path) } catch (_) {}",
    `try { history.replaceState({ previewRoute: path }, '', '${base}' + (path === '/' ? '' : path)) } catch (_) {}`,
  )

  next = next.replace(
    "__renderRoute('/')",
    `__renderRoute((function(){ var current = window.location.pathname || '/'; var base = '${base}'; if (current === base) return '/'; if (current.indexOf(base + '/') === 0) return current.slice(base.length) || '/'; return '/'; })())`,
  )

  return next
}

export async function ensurePublishingSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS admin_project_deployments (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id     UUID NOT NULL UNIQUE REFERENCES admin_projects(id) ON DELETE CASCADE,
      slug           TEXT NOT NULL UNIQUE,
      title          TEXT NOT NULL,
      status         TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live','failed')),
      published_html TEXT NOT NULL,
      files          JSONB NOT NULL DEFAULT '{}'::jsonb,
      version        INTEGER NOT NULL DEFAULT 1,
      published_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_admin_project_deployments_slug
      ON admin_project_deployments (slug)
  `
}

export async function publishProject(input: {
  projectId: string
  ownerEmail: string
  publishedHtml: string
}): Promise<AdminProjectDeployment> {
  await ensurePublishingSchema()

  const projects = (await sql`
    SELECT id, title
    FROM admin_projects
    WHERE id = ${input.projectId}
      AND owner_email = ${normalizeEmail(input.ownerEmail)}
    LIMIT 1
  `) as unknown as Array<{ id: string; title: string }>

  const project = projects[0]
  if (!project) throw new Error("Project not found")

  const files = (await sql`
    SELECT path, content
    FROM admin_project_files
    WHERE project_id = ${input.projectId}
    ORDER BY path ASC
  `) as unknown as Array<{ path: string; content: string }>

  const fileMap: Record<string, string> = {}
  for (const file of files) fileMap[file.path] = file.content

  const validation = validateGeneratedProject(fileMap)
  if (!validation.valid) {
    const details = validation.errors
      .slice(0, 5)
      .map((issue) => `${issue.path ? `${issue.path}: ` : ""}${issue.message}`)
      .join("; ")
    throw new Error(`Cannot publish: project validation failed. ${details}`)
  }

  const rawHtml = input.publishedHtml.trim()
  if (!rawHtml || !rawHtml.includes("<!doctype html>") || !rawHtml.includes('id="root"')) {
    throw new Error("Cannot publish: the current preview snapshot is invalid")
  }

  const base = slugify(project.title) || "project"
  const slug = `${base}-${project.id.slice(0, 8).toLowerCase()}`
  const html = scopePublishedHtml(rawHtml, slug)
  const filesJson = JSON.stringify(fileMap)

  const rows = (await sql`
    INSERT INTO admin_project_deployments
      (project_id, slug, title, status, published_html, files, version, published_at, updated_at)
    VALUES
      (${project.id}, ${slug}, ${project.title}, 'live', ${html}, ${filesJson}::jsonb, 1, NOW(), NOW())
    ON CONFLICT (project_id)
    DO UPDATE SET
      slug = EXCLUDED.slug,
      title = EXCLUDED.title,
      status = 'live',
      published_html = EXCLUDED.published_html,
      files = EXCLUDED.files,
      version = admin_project_deployments.version + 1,
      published_at = NOW(),
      updated_at = NOW()
    RETURNING id, project_id, slug, title, status, published_html, files,
              version, published_at, updated_at
  `) as unknown as AdminProjectDeployment[]

  await sql`
    UPDATE admin_projects
    SET metadata = metadata || ${JSON.stringify({
      published: true,
      published_slug: slug,
      published_url: `/p/${slug}`,
      validation_passed: true,
    })}::jsonb,
        updated_at = NOW()
    WHERE id = ${project.id}
  `

  return rows[0]
}

export async function getProjectDeploymentStatus(
  projectId: string,
  ownerEmail: string,
): Promise<Pick<AdminProjectDeployment, "slug" | "status" | "version" | "published_at"> | null> {
  await ensurePublishingSchema()

  const rows = (await sql`
    SELECT d.slug, d.status, d.version, d.published_at
    FROM admin_project_deployments d
    INNER JOIN admin_projects p ON p.id = d.project_id
    WHERE d.project_id = ${projectId}
      AND p.owner_email = ${normalizeEmail(ownerEmail)}
    LIMIT 1
  `) as unknown as Array<Pick<AdminProjectDeployment, "slug" | "status" | "version" | "published_at">>

  return rows[0] ?? null
}

export async function getLiveDeploymentBySlug(slug: string): Promise<AdminProjectDeployment | null> {
  await ensurePublishingSchema()

  const rows = (await sql`
    SELECT id, project_id, slug, title, status, published_html, files,
           version, published_at, updated_at
    FROM admin_project_deployments
    WHERE slug = ${slug.toLowerCase().trim()}
      AND status = 'live'
    LIMIT 1
  `) as unknown as AdminProjectDeployment[]

  return rows[0] ?? null
}
