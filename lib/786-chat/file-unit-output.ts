import { z } from "zod"

const FileUnitSchema = z.object({
  path: z.string().min(1),
  content: z.string().refine((value) => value.trim().length > 0, "File content must not be empty"),
}).strict()

export function fileUnitTargetFromPrompt(prompt: string) {
  if (!/\bFILE-LEVEL FULL-STACK GENERATION\b/i.test(prompt)) return null
  const match = /Required system files \(return every file in this unit\):\s*([^\n,]+)/i.exec(prompt)
  return match?.[1]?.trim() || null
}

export function parseFileUnitOutput(text: string, expectedPath: string) {
  let value: unknown
  try { value = JSON.parse(text.trim()) } catch { throw new Error("File unit JSON response could not be parsed or validated.") }
  const parsed = FileUnitSchema.safeParse(value)
  if (!parsed.success) throw new Error("File unit JSON response could not be parsed or validated.")
  if (parsed.data.path !== expectedPath) throw new Error(`File unit returned the wrong path; expected ${expectedPath}.`)
  return parsed.data
}
