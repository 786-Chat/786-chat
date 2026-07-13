import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import { persistProjectAtomic } from "@/lib/786-admin/projects"
import {
  ADMIN_PROJECT_TEMPLATES,
  getAdminProjectTemplate,
} from "@/lib/786-admin/project-templates"

async function requireAdminEmail(): Promise<string | null> {
  const session = await getSession()
  const email = session?.email
  if (!isAdminUser(email)) return null
  return email!.toLowerCase().trim()
}

export async function GET() {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return NextResponse.json({
    templates: ADMIN_PROJECT_TEMPLATES.map(({ files, ...template }) => ({
      ...template,
      file_count: Object.keys(files).length,
    })),
  })
}

export async function POST(request: Request) {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as {
    template_id?: unknown
    title?: unknown
  }
  const templateId = typeof body.template_id === "string" ? body.template_id : ""
  const template = getAdminProjectTemplate(templateId)
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 })
  }

  try {
    const project = await persistProjectAtomic(email, {
      title:
        typeof body.title === "string" && body.title.trim()
          ? body.title.trim().slice(0, 120)
          : template.name,
      description: template.description,
      prompt: template.prompt,
      kind: "786chat",
      metadata_patch: {
        template_id: template.id,
        template_name: template.name,
        created_from_template: true,
      },
      files: template.files,
      messages: [
        {
          role: "assistant",
          content: `Created from the ${template.name} template. Tell me what you want to customize.`,
          reason: "template-created",
        },
      ],
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Template creation failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
