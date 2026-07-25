import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

const NO_STORE = { "Cache-Control": "no-store" }
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_FILE_COUNT = 250
const MAX_FILE_BYTES = 500_000
const MAX_PROJECT_BYTES = 8_000_000

type RouteParams = { id: string } | Promise<{ id: string }>

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE })
}

function normalizeFiles(files: unknown): Record<string, string> {
  if (!files || typeof files !== "object" || Array.isArray(files)) return {}
  return Object.fromEntries(
    Object.entries(files as Record<string, unknown>).filter(
      ([path, value]) => typeof path === "string" && typeof value === "string"
    )
  ) as Record<string, string>
}

function validateFiles(files: unknown) {
  const normalized = normalizeFiles(files)
  const entries = Object.entries(normalized)
  if (entries.length === 0) return { error: "Project must contain at least one file" }
  if (entries.length > MAX_FILE_COUNT) return { error: `A project may contain at most ${MAX_FILE_COUNT} files` }

  let totalBytes = 0
  for (const [path, content] of entries) {
    if (!path || path.length > 240 || path.startsWith("/") || path.includes("..") || path.includes("\\")) {
      return { error: `Invalid file path: ${path || "(empty)"}` }
    }
    const bytes = Buffer.byteLength(content, "utf8")
    if (bytes > MAX_FILE_BYTES) return { error: `${path} is too large` }
    totalBytes += bytes
  }
  if (totalBytes > MAX_PROJECT_BYTES) return { error: "Project files are too large" }
  return { files: normalized }
}

function projectSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "786-chat-project"
}

function prepareBuildFiles(existingFiles: Record<string, string>, projectName: string) {
  const files = { ...existingFiles }
  const slug = projectSlug(projectName)

  if (!files["app/layout.tsx"]) {
    files["app/layout.tsx"] = `import type { Metadata } from "next"\nimport "./globals.css"\n\nexport const metadata: Metadata = {\n  title: ${JSON.stringify(projectName)},\n  description: "Built with 786 Chat AI",\n}\n\nexport default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  )\n}\n`
  }

  if (!files["app/globals.css"]) {
    files["app/globals.css"] = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n* { box-sizing: border-box; }\nhtml { scroll-behavior: smooth; }\nbody { margin: 0; min-height: 100vh; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }\nbutton, input, textarea, select { font: inherit; }\n`
  }

  if (!files["package.json"]) {
    files["package.json"] = JSON.stringify({
      name: slug,
      version: "1.0.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
        typecheck: "tsc --noEmit",
      },
      dependencies: {
        "@types/node": "latest",
        "@types/react": "latest",
        "@types/react-dom": "latest",
        next: "latest",
        react: "latest",
        "react-dom": "latest",
        "lucide-react": "latest",
      },
      devDependencies: {
        autoprefixer: "latest",
        postcss: "latest",
        tailwindcss: "latest",
        typescript: "latest",
      },
    }, null, 2) + "\n"
  }

  if (!files["tsconfig.json"]) {
    files["tsconfig.json"] = JSON.stringify({
      compilerOptions: {
        target: "ES2017",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    }, null, 2) + "\n"
  }

  if (!files["next.config.mjs"]) {
    files["next.config.mjs"] = `/** @type {import('next').NextConfig} */\nconst nextConfig = { reactStrictMode: true }\n\nexport default nextConfig\n`
  }

  if (!files["postcss.config.mjs"]) {
    files["postcss.config.mjs"] = `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }\n`
  }

  if (!files["tailwind.config.ts"]) {
    files["tailwind.config.ts"] = `import type { Config } from "tailwindcss"\n\nconst config: Config = {\n  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],\n  theme: { extend: {} },\n  plugins: [],\n}\n\nexport default config\n`
  }

  if (!files[".env.example"]) {
    files[".env.example"] = `# Add project secrets in your deployment dashboard.\n# Never commit real secret values.\nNEXT_PUBLIC_APP_NAME=${projectName.replace(/\n/g, " ")}\n`
  }

  if (!files["README.md"]) {
    files["README.md"] = `# ${projectName}\n\nGenerated with 786 Chat AI.\n\n## Run locally\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Validate\n\n\`\`\`bash\nnpm run typecheck\nnpm run build\n\`\`\`\n`
  }

  if (!files[".gitignore"]) {
    files[".gitignore"] = `.next\nnode_modules\n.env\n.env.local\n.vercel\n*.log\n`
  }

  return files
}

async function getProjectId(params: RouteParams) {
  const resolved = await Promise.resolve(params)
  const id = String(resolved.id || "").trim()
  return UUID_PATTERN.test(id) ? id : ""
}

async function requireProjectContext(params: RouteParams) {
  const session = await getSession()
  if (!session?.id) return { response: json({ error: "Unauthorized" }, 401) }
  const projectId = await getProjectId(params)
  if (!projectId) return { response: json({ error: "Invalid project id" }, 400) }
  return { session, projectId }
}

async function softDeleteProject(projectId: string, userId: string) {
  return sql`
    UPDATE projects
    SET deleted_at = NOW(), delete_after = NOW() + INTERVAL '7 days', updated_at = NOW()
    WHERE id = ${projectId}::uuid AND user_id = ${userId}::uuid AND deleted_at IS NULL
    RETURNING id
  `
}

async function restoreProject(projectId: string, userId: string) {
  const rows = await sql`
    UPDATE projects
    SET deleted_at = NULL, delete_after = NULL, updated_at = NOW()
    WHERE id = ${projectId}::uuid AND user_id = ${userId}::uuid
      AND deleted_at IS NOT NULL AND (delete_after IS NULL OR delete_after > NOW())
    RETURNING id
  `
  return rows.length ? json({ success: true, restored: true }) : json({ error: "Project not found or recovery period expired" }, 404)
}

async function permanentlyDeleteProject(projectId: string, userId: string) {
  const rows = await sql`
    DELETE FROM projects
    WHERE id = ${projectId}::uuid AND user_id = ${userId}::uuid AND deleted_at IS NOT NULL
    RETURNING id
  `
  return rows.length ? json({ success: true, permanentlyDeleted: true }) : json({ error: "Project not found in Recover Projects" }, 404)
}

export async function GET(_request: Request, { params }: { params: RouteParams }) {
  const context = await requireProjectContext(params)
  if ("response" in context) return context.response
  try {
    const rows = await sql`
      SELECT id, name, description, domain, custom_domain, status, template, files,
             created_at, updated_at, deleted_at, delete_after
      FROM projects
      WHERE id = ${context.projectId}::uuid AND user_id = ${context.session.id}::uuid
      LIMIT 1
    `
    if (!rows.length) return json({ error: "Project not found" }, 404)
    const project = rows[0]
    const files = normalizeFiles(project.files)
    return json({
      success: true,
      project: {
        id: project.id,
        name: project.name || "AI Project",
        description: project.description || "",
        domain: project.domain || null,
        custom_domain: project.custom_domain || null,
        status: project.status || "active",
        template: project.template || "custom",
        files,
        fileCount: Object.keys(files).length,
        buildReady: Boolean(files["package.json"] && files["app/page.tsx"] && files["app/layout.tsx"]),
        created_at: project.created_at,
        updated_at: project.updated_at,
        deleted_at: project.deleted_at,
        delete_after: project.delete_after,
      },
    })
  } catch (error) {
    console.error("Get project error:", error)
    return json({ error: "Failed to get project" }, 500)
  }
}

export async function DELETE(request: Request, { params }: { params: RouteParams }) {
  const context = await requireProjectContext(params)
  if ("response" in context) return context.response
  try {
    const permanent = new URL(request.url).searchParams.get("permanent") === "true"
    if (permanent) return permanentlyDeleteProject(context.projectId, context.session.id)
    const rows = await softDeleteProject(context.projectId, context.session.id)
    return rows.length ? json({ success: true, deleted: true }) : json({ error: "Project not found" }, 404)
  } catch (error) {
    console.error("Delete project error:", error)
    return json({ error: "Failed to delete project" }, 500)
  }
}

async function handleAction(request: Request, params: RouteParams) {
  const context = await requireProjectContext(params)
  if ("response" in context) return context.response
  try {
    const body = await request.json().catch(() => ({}))

    if (body?.action === "saveFiles") {
      const validated = validateFiles(body.files)
      if ("error" in validated) return json({ error: validated.error }, 400)
      const rows = await sql`
        UPDATE projects
        SET files = ${JSON.stringify(validated.files)}::jsonb, updated_at = NOW()
        WHERE id = ${context.projectId}::uuid
          AND user_id = ${context.session.id}::uuid
          AND deleted_at IS NULL
        RETURNING id, updated_at
      `
      return rows.length
        ? json({ success: true, saved: true, updated_at: rows[0].updated_at, fileCount: Object.keys(validated.files).length })
        : json({ error: "Project not found" }, 404)
    }

    if (body?.action === "prepareBuildFiles") {
      const rows = await sql`
        SELECT id, name, files
        FROM projects
        WHERE id = ${context.projectId}::uuid
          AND user_id = ${context.session.id}::uuid
          AND deleted_at IS NULL
        LIMIT 1
      `
      if (!rows.length) return json({ error: "Project not found" }, 404)

      const currentFiles = normalizeFiles(rows[0].files)
      if (!currentFiles["app/page.tsx"] && !currentFiles["app/page.jsx"]) {
        return json({ error: "Project is missing app/page.tsx" }, 400)
      }

      const preparedFiles = prepareBuildFiles(currentFiles, String(rows[0].name || "AI Project"))
      const validated = validateFiles(preparedFiles)
      if ("error" in validated) return json({ error: validated.error }, 400)

      const updated = await sql`
        UPDATE projects
        SET files = ${JSON.stringify(validated.files)}::jsonb, updated_at = NOW()
        WHERE id = ${context.projectId}::uuid
          AND user_id = ${context.session.id}::uuid
          AND deleted_at IS NULL
        RETURNING id, updated_at
      `

      return json({
        success: true,
        prepared: true,
        files: validated.files,
        fileCount: Object.keys(validated.files).length,
        updated_at: updated[0]?.updated_at,
      })
    }

    if (body?.action === "delete") {
      const rows = await softDeleteProject(context.projectId, context.session.id)
      return rows.length ? json({ success: true, deleted: true }) : json({ error: "Project not found" }, 404)
    }
    if (body?.action === "restore") return restoreProject(context.projectId, context.session.id)
    if (body?.action === "deleteForever" || body?.action === "permanentDelete") {
      return permanentlyDeleteProject(context.projectId, context.session.id)
    }
    return json({ error: "Invalid action" }, 400)
  } catch (error) {
    console.error("Project action error:", error)
    return json({ error: "Failed to update project" }, 500)
  }
}

export async function POST(request: Request, { params }: { params: RouteParams }) {
  return handleAction(request, params)
}

export async function PATCH(request: Request, { params }: { params: RouteParams }) {
  return handleAction(request, params)
}
