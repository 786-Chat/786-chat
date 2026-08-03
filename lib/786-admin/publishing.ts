import { createHash } from "node:crypto";
import { sql } from "./db";

export type AdminProjectDeployment = {
  id: string;
  project_id: string;
  slug: string;
  title: string;
  status: "live" | "failed";
  published_html: string;
  runtime_url: string | null;
  build_id: string | null;
  files: Record<string, string>;
  version: number;
  published_at: string;
  updated_at: string;
};

export type AdminProjectDeploymentVersion = {
  id: string;
  project_id: string;
  deployment_id: string;
  build_id: string | null;
  version: number;
  action: "deploy" | "redeploy" | "rollback";
  status: "live" | "failed";
  runtime_url: string | null;
  source_version: string;
  restored_version: number | null;
  published_at: string;
};

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54);
}

function scopePublishedHtml(html: string, slug: string): string {
  const base = `/p/${slug}`;
  let next = html;
  next = next.replace(
    "try { history.replaceState({ previewRoute: path }, '', path) } catch (_) {}",
    `try { history.replaceState({ previewRoute: path }, '', '${base}' + (path === '/' ? '' : path)) } catch (_) {}`,
  );
  next = next.replace(
    "__renderRoute('/')",
    `__renderRoute((function(){ var current = window.location.pathname || '/'; var base = '${base}'; if (current === base) return '/'; if (current.indexOf(base + '/') === 0) return current.slice(base.length) || '/'; return '/'; })())`,
  );
  return next;
}

function sourceVersion(files: Record<string, string>) {
  const canonical = Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, content]) => `${path}\0${content}`)
    .join("\0");
  return createHash("sha256").update(canonical).digest("hex");
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
      runtime_url    TEXT,
      build_id       UUID REFERENCES admin_project_builds(id) ON DELETE SET NULL,
      files          JSONB NOT NULL DEFAULT '{}'::jsonb,
      version        INTEGER NOT NULL DEFAULT 1,
      published_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    ALTER TABLE admin_project_deployments
      ADD COLUMN IF NOT EXISTS runtime_url TEXT,
      ADD COLUMN IF NOT EXISTS build_id UUID REFERENCES admin_project_builds(id) ON DELETE SET NULL
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_admin_project_deployments_slug
      ON admin_project_deployments (slug)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS admin_project_deployment_versions (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id       UUID NOT NULL REFERENCES admin_projects(id) ON DELETE CASCADE,
      deployment_id    UUID NOT NULL REFERENCES admin_project_deployments(id) ON DELETE CASCADE,
      build_id         UUID REFERENCES admin_project_builds(id) ON DELETE SET NULL,
      version          INTEGER NOT NULL,
      action           TEXT NOT NULL CHECK (action IN ('deploy','redeploy','rollback')),
      status           TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live','failed')),
      title            TEXT NOT NULL,
      slug             TEXT NOT NULL,
      runtime_url      TEXT,
      published_html   TEXT NOT NULL DEFAULT '',
      files            JSONB NOT NULL DEFAULT '{}'::jsonb,
      source_version   TEXT NOT NULL,
      restored_version INTEGER,
      published_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (project_id, version)
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_admin_project_deployment_versions_project
      ON admin_project_deployment_versions (project_id, version DESC)
  `;
  await sql`
    INSERT INTO admin_project_deployment_versions
      (project_id, deployment_id, build_id, version, action, status, title, slug,
       runtime_url, published_html, files, source_version, published_at)
    SELECT d.project_id, d.id, d.build_id, d.version, 'deploy', d.status, d.title, d.slug,
           d.runtime_url, d.published_html, d.files, md5(d.files::text), d.published_at
    FROM admin_project_deployments d
    WHERE NOT EXISTS (
      SELECT 1
      FROM admin_project_deployment_versions v
      WHERE v.project_id = d.project_id
    )
    ON CONFLICT (project_id, version) DO NOTHING
  `;
}

async function ownedProject(projectId: string, ownerEmail: string) {
  const rows = (await sql`
    SELECT id, title
    FROM admin_projects
    WHERE id = ${projectId}
      AND owner_email = ${normalizeEmail(ownerEmail)}
    LIMIT 1
  `) as unknown as Array<{ id: string; title: string }>;
  return rows[0] ?? null;
}

async function projectFiles(projectId: string) {
  const rows = (await sql`
    SELECT path, content
    FROM admin_project_files
    WHERE project_id = ${projectId}
    ORDER BY path ASC
  `) as unknown as Array<{ path: string; content: string }>;
  return Object.fromEntries(rows.map((file) => [file.path, file.content]));
}

async function recordDeploymentVersion(
  deployment: AdminProjectDeployment,
  action: AdminProjectDeploymentVersion["action"],
  restoredVersion: number | null = null,
) {
  await sql`
    INSERT INTO admin_project_deployment_versions
      (project_id, deployment_id, build_id, version, action, status, title, slug,
       runtime_url, published_html, files, source_version, restored_version, published_at)
    VALUES
      (${deployment.project_id}, ${deployment.id}, ${deployment.build_id}, ${deployment.version},
       ${action}, ${deployment.status}, ${deployment.title}, ${deployment.slug},
       ${deployment.runtime_url}, ${deployment.published_html}, ${JSON.stringify(deployment.files)}::jsonb,
       ${sourceVersion(deployment.files)}, ${restoredVersion}, ${deployment.published_at})
    ON CONFLICT (project_id, version) DO NOTHING
  `;
}

export async function publishCompiledProject(input: {
  projectId: string;
  ownerEmail: string;
  action?: "deploy" | "redeploy";
}): Promise<AdminProjectDeployment> {
  await ensurePublishingSchema();
  const project = await ownedProject(input.projectId, input.ownerEmail);
  if (!project) throw new Error("Project not found");

  const files = await projectFiles(project.id);
  const version = sourceVersion(files);
  const builds = (await sql`
    SELECT id, deployment_url
    FROM admin_project_builds
    WHERE project_id = ${project.id}
      AND status = 'passed'
      AND source_version = ${version}
      AND deployment_url IS NOT NULL
    ORDER BY completed_at DESC NULLS LAST, created_at DESC
    LIMIT 1
  `) as unknown as Array<{ id: string; deployment_url: string }>;
  const build = builds[0];
  if (!build)
    throw new Error(
      "Deploy requires a passed build for the current project files.",
    );

  const base = slugify(project.title) || "project";
  const slug = `${base}-${project.id.slice(0, 8).toLowerCase()}`;
  const rows = (await sql`
    INSERT INTO admin_project_deployments
      (project_id, slug, title, status, published_html, runtime_url, build_id,
       files, version, published_at, updated_at)
    VALUES
      (${project.id}, ${slug}, ${project.title}, 'live', '', ${build.deployment_url},
       ${build.id}, ${JSON.stringify(files)}::jsonb, 1, NOW(), NOW())
    ON CONFLICT (project_id)
    DO UPDATE SET
      slug = EXCLUDED.slug,
      title = EXCLUDED.title,
      status = 'live',
      published_html = '',
      runtime_url = EXCLUDED.runtime_url,
      build_id = EXCLUDED.build_id,
      files = EXCLUDED.files,
      version = admin_project_deployments.version + 1,
      published_at = NOW(),
      updated_at = NOW()
    RETURNING id, project_id, slug, title, status, published_html, runtime_url,
              build_id, files, version, published_at, updated_at
  `) as unknown as AdminProjectDeployment[];
  await recordDeploymentVersion(rows[0], input.action ?? "deploy");
  return rows[0];
}

export async function publishProject(input: {
  projectId: string;
  ownerEmail: string;
  publishedHtml: string;
}): Promise<AdminProjectDeployment> {
  await ensurePublishingSchema();
  const project = await ownedProject(input.projectId, input.ownerEmail);
  if (!project) throw new Error("Project not found");

  const fileMap = await projectFiles(project.id);
  const hasHomePage = Object.keys(fileMap).some((path) =>
    /^(src\/)?app\/page\.(tsx?|jsx?)$/.test(path),
  );
  if (!hasHomePage)
    throw new Error("Cannot publish: app/page.tsx was not found");
  const rawHtml = input.publishedHtml.trim();
  if (
    !rawHtml ||
    !rawHtml.includes("<!doctype html>") ||
    !rawHtml.includes('id="root"')
  ) {
    throw new Error("Cannot publish: the current preview snapshot is invalid");
  }

  const base = slugify(project.title) || "project";
  const slug = `${base}-${project.id.slice(0, 8).toLowerCase()}`;
  const html = scopePublishedHtml(rawHtml, slug);
  const rows = (await sql`
    INSERT INTO admin_project_deployments
      (project_id, slug, title, status, published_html, runtime_url, build_id, files, version, published_at, updated_at)
    VALUES
      (${project.id}, ${slug}, ${project.title}, 'live', ${html}, NULL, NULL,
       ${JSON.stringify(fileMap)}::jsonb, 1, NOW(), NOW())
    ON CONFLICT (project_id)
    DO UPDATE SET
      slug = EXCLUDED.slug,
      title = EXCLUDED.title,
      status = 'live',
      published_html = EXCLUDED.published_html,
      runtime_url = NULL,
      build_id = NULL,
      files = EXCLUDED.files,
      version = admin_project_deployments.version + 1,
      published_at = NOW(),
      updated_at = NOW()
    RETURNING id, project_id, slug, title, status, published_html, runtime_url,
              build_id, files, version, published_at, updated_at
  `) as unknown as AdminProjectDeployment[];

  await recordDeploymentVersion(rows[0], "deploy");
  await sql`
    UPDATE admin_projects
    SET metadata = metadata || ${JSON.stringify({
      published: true,
      published_slug: slug,
      published_url: `/p/${slug}`,
    })}::jsonb,
        updated_at = NOW()
    WHERE id = ${project.id}
  `;
  return rows[0];
}

export async function getProjectDeployment(
  projectId: string,
  ownerEmail: string,
): Promise<AdminProjectDeployment | null> {
  await ensurePublishingSchema();
  const rows = (await sql`
    SELECT d.id, d.project_id, d.slug, d.title, d.status, d.published_html,
           d.runtime_url, d.build_id, d.files, d.version, d.published_at, d.updated_at
    FROM admin_project_deployments d
    INNER JOIN admin_projects p ON p.id = d.project_id
    WHERE d.project_id = ${projectId}
      AND p.owner_email = ${normalizeEmail(ownerEmail)}
    LIMIT 1
  `) as unknown as AdminProjectDeployment[];
  return rows[0] ?? null;
}

export async function getProjectDeploymentStatus(
  projectId: string,
  ownerEmail: string,
) {
  const deployment = await getProjectDeployment(projectId, ownerEmail);
  if (!deployment) return null;
  return {
    slug: deployment.slug,
    status: deployment.status,
    version: deployment.version,
    published_at: deployment.published_at,
  };
}

export async function listProjectDeploymentVersions(input: {
  projectId: string;
  ownerEmail: string;
  limit?: number;
}): Promise<AdminProjectDeploymentVersion[]> {
  await ensurePublishingSchema();
  const safeLimit = Math.min(Math.max(input.limit ?? 30, 1), 100);
  return (await sql`
    SELECT v.id, v.project_id, v.deployment_id, v.build_id, v.version, v.action,
           v.status, v.runtime_url, v.source_version, v.restored_version, v.published_at
    FROM admin_project_deployment_versions v
    INNER JOIN admin_projects p ON p.id = v.project_id
    WHERE v.project_id = ${input.projectId}
      AND p.owner_email = ${normalizeEmail(input.ownerEmail)}
    ORDER BY v.version DESC
    LIMIT ${safeLimit}
  `) as unknown as AdminProjectDeploymentVersion[];
}

export async function rollbackProjectDeployment(input: {
  projectId: string;
  ownerEmail: string;
  version: number;
}): Promise<AdminProjectDeployment> {
  await ensurePublishingSchema();
  const snapshots = (await sql`
    SELECT v.*
    FROM admin_project_deployment_versions v
    INNER JOIN admin_projects p ON p.id = v.project_id
    WHERE v.project_id = ${input.projectId}
      AND v.version = ${input.version}
      AND p.owner_email = ${normalizeEmail(input.ownerEmail)}
    LIMIT 1
  `) as unknown as Array<
    AdminProjectDeploymentVersion & {
      title: string;
      slug: string;
      published_html: string;
      files: Record<string, string>;
    }
  >;
  const snapshot = snapshots[0];
  if (!snapshot) throw new Error("Deployment version not found.");

  const rows = (await sql`
    UPDATE admin_project_deployments d
    SET title = ${snapshot.title},
        status = 'live',
        published_html = ${snapshot.published_html},
        runtime_url = ${snapshot.runtime_url},
        build_id = ${snapshot.build_id},
        files = ${JSON.stringify(snapshot.files)}::jsonb,
        version = d.version + 1,
        published_at = NOW(),
        updated_at = NOW()
    FROM admin_projects p
    WHERE d.project_id = ${input.projectId}
      AND p.id = d.project_id
      AND p.owner_email = ${normalizeEmail(input.ownerEmail)}
    RETURNING d.id, d.project_id, d.slug, d.title, d.status, d.published_html,
              d.runtime_url, d.build_id, d.files, d.version, d.published_at, d.updated_at
  `) as unknown as AdminProjectDeployment[];
  if (!rows[0]) throw new Error("Active deployment not found.");
  await recordDeploymentVersion(rows[0], "rollback", snapshot.version);
  return rows[0];
}

export async function getLiveDeploymentBySlug(
  slug: string,
): Promise<AdminProjectDeployment | null> {
  await ensurePublishingSchema();
  const rows = (await sql`
    SELECT id, project_id, slug, title, status, published_html, runtime_url, build_id, files,
           version, published_at, updated_at
    FROM admin_project_deployments
    WHERE slug = ${slug.toLowerCase().trim()}
      AND status = 'live'
    LIMIT 1
  `) as unknown as AdminProjectDeployment[];
  return rows[0] ?? null;
}

export async function getLiveDeploymentByHostname(
  hostname: string,
): Promise<AdminProjectDeployment | null> {
  await ensurePublishingSchema();
  const rows = (await sql`
    SELECT p.id, p.project_id, p.slug, p.title, p.status, p.published_html,
           p.runtime_url, p.build_id, p.files, p.version, p.published_at, p.updated_at
    FROM admin_project_deployments p
    INNER JOIN admin_project_domains d ON d.deployment_id = p.id
    WHERE LOWER(d.hostname) = ${hostname.toLowerCase().trim()}
      AND d.status = 'active'
      AND d.dns_status = 'verified'
      AND d.ssl_status = 'active'
      AND p.status = 'live'
    LIMIT 1
  `) as unknown as AdminProjectDeployment[];
  return rows[0] ?? null;
}
