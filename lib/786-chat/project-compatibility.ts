import "server-only"

import { randomUUID } from "node:crypto"

import { sql, transaction } from "@/lib/786-admin/db"

type PackageManifest = Record<string, unknown> & {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

type TypeScriptConfig = Record<string, unknown> & {
  compilerOptions?: Record<string, unknown>
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

export function normalizePortableTypeScriptConfig(files: Record<string, string>) {
  const source = files["tsconfig.json"]
  if (!source) return { ...files }

  const normalized = { ...files }
  try {
    const parsed = JSON.parse(source) as TypeScriptConfig
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return normalized
    const compilerOptions =
      parsed.compilerOptions && typeof parsed.compilerOptions === "object" && !Array.isArray(parsed.compilerOptions)
        ? { ...parsed.compilerOptions }
        : {}

    compilerOptions.target = "ES2017"
    compilerOptions.downlevelIteration = true
    parsed.compilerOptions = compilerOptions
    normalized["tsconfig.json"] = `${JSON.stringify(parsed, null, 2)}\n`
    return normalized
  } catch {
    // Some imported/generated tsconfig files contain comments. Keep those files intact
    // and make the two compatibility edits textually instead of rejecting them.
    let next = source
    if (/"target"\s*:\s*"[^"]+"/i.test(next)) {
      next = next.replace(/"target"\s*:\s*"[^"]+"/i, '"target": "ES2017"')
    } else {
      next = next.replace(/"compilerOptions"\s*:\s*\{/i, (match) => `${match}\n    "target": "ES2017",`)
    }

    if (/"downlevelIteration"\s*:/i.test(next)) {
      next = next.replace(/"downlevelIteration"\s*:\s*(?:true|false)/i, '"downlevelIteration": true')
    } else {
      next = next.replace(/"compilerOptions"\s*:\s*\{/i, (match) => `${match}\n    "downlevelIteration": true,`)
    }

    normalized["tsconfig.json"] = next
    return normalized
  }
}

export function normalizePortablePostCss(files: Record<string, string>) {
  const normalized = normalizePortableTypeScriptConfig(files)
  const manifest = parsePackageManifest(normalized["package.json"])
  if (!manifest) return normalized

  const dependencies = { ...(manifest.dependencies || {}) }
  const devDependencies = { ...(manifest.devDependencies || {}) }
  const tailwindVersion = dependencies.tailwindcss || devDependencies.tailwindcss
  const tailwindMajor = dependencyMajor(tailwindVersion)
  if (!tailwindMajor) return normalized

  const hasPostCssConfig = Boolean(
    normalized["postcss.config.js"] ||
    normalized["postcss.config.cjs"] ||
    normalized["postcss.config.mjs"],
  )
  const hasTailwindConfig = Boolean(
    normalized["tailwind.config.js"] ||
    normalized["tailwind.config.cjs"] ||
    normalized["tailwind.config.mjs"] ||
    normalized["tailwind.config.ts"],
  )
  let packageChanged = false
  const ensureDevDependency = (name: string, version: string) => {
    if (dependencies[name] || devDependencies[name]) return
    devDependencies[name] = version
    packageChanged = true
  }

  if (tailwindMajor >= 4) {
    if (!hasPostCssConfig) {
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
    }
  } else {
    if (!hasPostCssConfig) {
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

    if (!hasTailwindConfig) {
      normalized["tailwind.config.cjs"] = [
        "/** @type {import('tailwindcss').Config} */",
        "module.exports = {",
        "  content: [",
        "    \"./app/**/*.{js,ts,jsx,tsx,mdx}\",",
        "    \"./pages/**/*.{js,ts,jsx,tsx,mdx}\",",
        "    \"./components/**/*.{js,ts,jsx,tsx,mdx}\",",
        "    \"./src/**/*.{js,ts,jsx,tsx,mdx}\",",
        "  ],",
        "  theme: { extend: {} },",
        "  plugins: [],",
        "}",
        "",
      ].join("\n")
    }
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

  if (normalized["tsconfig.json"] && normalized["tsconfig.json"] !== input.files["tsconfig.json"]) {
    migrations.push("typescript-es2017-iteration")
  }

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

  if (
    !input.files["tailwind.config.js"] &&
    !input.files["tailwind.config.cjs"] &&
    !input.files["tailwind.config.mjs"] &&
    !input.files["tailwind.config.ts"] &&
    normalized["tailwind.config.cjs"]
  ) {
    migrations.push("local-tailwind-config")
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
