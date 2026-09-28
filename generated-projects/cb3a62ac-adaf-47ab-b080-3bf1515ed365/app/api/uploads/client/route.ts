export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireUser } from "@/lib/server/auth";

const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/gif"];

export async function POST(request: Request) {
  let user: any;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const expectedPrefix = `documents/${user.id}/`;
        if (!pathname.startsWith(expectedPrefix)) {
          throw new Error("Invalid upload path");
        }
        return {
          allowedContentTypes: allowedTypes,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to prepare upload" },
      { status: 400 },
    );
  }
}
