import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

const allowedContentTypes = [
  "image/gif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
  "audio/mpeg",
  "audio/wav",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "font/ttf",
  "font/woff",
  "font/woff2",
]

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = (await request.json()) as HandleUploadBody
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("imports/")) throw new Error("Invalid import asset path")
        return {
          allowedContentTypes,
          maximumSizeInBytes: 100 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: session.id, purpose: "project-import" }),
        }
      },
      onUploadCompleted: async () => {},
    })
    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to prepare import asset upload" },
      { status: 400 },
    )
  }
}
