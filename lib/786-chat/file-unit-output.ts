import { z } from "zod"

const FileUnitSchema = z.object({
  path: z.string().min(1),
  content: z.string().refine((value) => value.trim().length > 0, "File content must not be empty"),
}).strict()

function cleanTarget(value: string | undefined) {
  return value?.trim().replace(/^[-`]+|[-`]+$/g, "") || null
}

export function fileUnitTargetFromPrompt(prompt: string) {
  if (!/\bFILE-LEVEL FULL-STACK GENERATION\b/i.test(prompt)) return null

  // The explicit Target file belongs to this single generation unit and is the
  // authoritative path. Validation-repair prompts may also carry a broader
  // "Required system files" list for the whole repair. Reading that broader list
  // here can make DeepSeek generate one file while completeness validation expects
  // another, causing false errors such as "Missing: lib/server/db.ts".
  const explicitTarget = cleanTarget(/Target file:\s*([^\n,]+)/i.exec(prompt)?.[1])
  if (explicitTarget) return explicitTarget

  // Backward compatibility for older file-unit prompts that predate Target file.
  return cleanTarget(/Required system files \(return every file in this unit\):\s*([^\n,]+)/i.exec(prompt)?.[1])
}

export function parseFileUnitOutput(text: string, expectedPath: string) {
  let value: unknown
  try { value = JSON.parse(text.trim()) } catch { throw new Error("File unit JSON response could not be parsed or validated.") }
  const parsed = FileUnitSchema.safeParse(value)
  if (!parsed.success) throw new Error("File unit JSON response could not be parsed or validated.")
  if (parsed.data.path !== expectedPath) throw new Error(`File unit returned the wrong path; expected ${expectedPath}.`)
  return parsed.data
}
