// Compatibility wrapper. Compact/full selection belongs to the canonical provider controller.
import { POST as canonicalPost } from "@/app/api/786-chat/generate/route"

export const runtime = "nodejs"
export const maxDuration = 60
export const POST = canonicalPost
