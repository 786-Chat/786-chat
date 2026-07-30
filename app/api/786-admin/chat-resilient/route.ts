// Compatibility wrapper. All generation uses the authenticated canonical route.
import { POST as canonicalPost } from "@/app/api/786-chat/generate/route"

export const runtime = "nodejs"
export const maxDuration = 60
export const POST = canonicalPost
