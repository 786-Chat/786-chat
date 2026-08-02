import "server-only"

import { randomUUID } from "node:crypto"

import { sql, transaction } from "@/lib/786-admin/db"

type PackageManifest = Record<string, unknown> & {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

function parsePackageManifest(source: string | undefined): PackageManifest | null {
  if (!source) return null
  try {
    const parsed = JSON.parse(source)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as PackageManifest
      : null
  } catch {
    return null
  }
}

function dependencyMajor(version: string | undefined): number | null {
  const match = version?.match(/\d+/)
  return match ? Number(match[0]) : null
}

export function normalizePortablePostCss(files: Record<string, string>) {
  if (
    files["postcss.config.js"] ||
    files["postcss.config.cjs"] ||
    files["postcss.config.mjs"]
  ) {
    return { ...files }
  }

  const manifest = parsePackageManifest(files["package.json"])
  if (!manifest) return { ...files }

  const dependencies = { ...(manifest.dependencies || {}) }
  const devDependencies = { ...(manifest.devDependencies || {}) }
  const tailwindVersion = dependencies.tailwindcss || devDependencies.tailwindcss
  const tailwindMajor = dependencyMajor(tailwindVersion)
  if (!tailwindMajor) return { ...files }

  const normalized = { ...files }
  let packageChanged = false
  const ensureDevDependency = (name: string, version: string) => {
    if (dependencies[name] || devDependencies[name]) return
    devDependencies[name] = version
    packageChanged = true
  }

  if (tailwindMajor >= 4) {
    ensureDevDependency("@tailwindcss/postcss", "^4.2.0")
    ensureDevDependency("postcss", "^8.5.0")
    normalized["postcss.config.mjs"] = [
      "const config = {",
      "  plugins: {",
      "    \"@tailwindcss/postcss\": {},",
      "  },",
      "}",
      "",
      "export default config",
      "",
    ].join("\n")
  } else {
    ensureDevDependency("autoprefixer", "^10.4.20")
    ensureDevDependency("postcss", "^8.4.41")
    normalized["postcss.config.cjs"] = [
      "module.exports = {",
      "  plugins: {",
      "    tailwindcss: {},",
      "    autoprefixer: {},",
      "  },",
      "}",
      "",
    ].join("\n")
  }

  if (packageChanged) {
    manifest.devDependencies = devDependencies
    normalized["package.json"] = `${JSON.stringify(manifest, null, 2)}\n`
    delete normalized["package-lock.json"]
  }

  return normalized
}

export function convertNextConfigTs(source: string): string {
  return source
    .replace(/^\s*import\s+type\s+\{\s*NextConfig\s*\}\s+from\s+["']next["'];?\s*$/gm, "")
    .replace(/(:\s*NextConfig|satisfies\s+NextConfig)(?=\s*[=;])/g, "")
    .trimStart()
}

export async function migrateUnsupportedNextConfig(input: {
  projectId: string
  ownerEmail: string
  files: Record<string, string>
}): Promise<boolean> {
  const normalized = normalizePortablePostCss(input.files)
  const migrations: string[] = []

  const source = normalized["next.config.ts"]
  if (source && !normalized["next.config.mjs"] && !normalized["next.config.js"]) {
    normalized["next.config.mjs"] = convertNextConfigTs(source)
    delete normalized["next.config.ts"]
    migrations.push("next-config-ts-to-mjs")
  }

  if (
    !input.files["postcss.config.js"] &&
    !input.files["postcss.config.cjs"] &&
    !input.files["postcss.config.mjs"] &&
    (
      normalized["postcss.config.cjs"] ||
      normalized["postcss.config.mjs"]
    )
  ) {
    migrations.push("local-postcss-config")
  }

  const changedEntries = Object.entries(normalized).filter(
    ([path, content]) => input.files[path] !== content,
  )
  const removedPaths = Object.keys(input.files).filter((path) => !(path in normalized))
  if (!changedEntries.length && !removedPaths.length) return false

  const revisionId = randomUUID()
  const ownerEmail = input.ownerEmail.toLowerCase().trim()
  const queries: unknown[] = [
    sql`
      INSERT INTO admin_project_revisions (
        id, project_id, owner_email, label, source, files,
        preview_state, metadata, created_at
      )
      SELECT
        ${revisionId}, p.id, p.owner_email,
        'Before automatic build compatibility migration',
        'build-compatibility',
        COALESCE(
          (SELECT jsonb_object_agg(f.path, f.content)
           FROM admin_project_files f WHERE f.project_id = p.id),
          '{}'::jsonb
        ),
        p.preview_state,
        ${JSON.stringify({ migrations })}::jsonb,
        NOW()
      FROM admin_projects p
      WHERE p.id = ${input.projectId}
        AND p.owner_email = ${ownerEmail}
    `,
  ]

  for (const path of removedPaths) {
    queries.push(sql`
      DELETE FROM admin_project_files
      WHERE project_id = ${input.projectId}
        AND path = ${path}
    `)
  }

  for (const [path, content] of changedEntries) {
    queries.push(sql`
      INSERT INTO admin_project_files (project_id, path, content, updated_at)
      VALUES (${input.projectId}, ${path}, ${content}, NOW())
      ON CONFLICT (project_id, path)
      DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
    `)
  }

  queries.push(sql`
    UPDATE admin_projects
    SET metadata = metadata || ${JSON.stringify({
      build_compatibility_migrated: true,
      migrations,
    })}::jsonb,
        updated_at = NOW()
    WHERE id = ${input.projectId}
      AND owner_email = ${ownerEmail}
  `)

  await transaction(queries)
  return true
}
