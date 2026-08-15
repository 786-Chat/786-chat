import { z } from "zod"

const FileUnitSchema = z.object({
  path: z.string().min(1),
  content: z.string().min(1),
}).strict()

export type FileUnitOutput = z.infer<typeof FileUnitSchema>

export function requestedFilePathFromPrompt(prompt: string) {
  const match = prompt.match(/Required system files \(return every file in this unit\):\s*([^\n,]+)/i)
  return match?.[1]?.trim() || ""
}

export function parseFileUnitOutput(text: string, expectedPath: string): FileUnitOutput {
  if (!expectedPath) throw new Error("File-level generation is missing its requested target path.")
  const trimmed = text.trim()
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    throw new Error("Provider file-unit JSON response could not be parsed or validated.")
  }

  let value: unknown
  try {
    value = JSON.parse(trimmed)
  } catch {
    throw new Error("Provider file-unit JSON response could not be parsed or validated.")
  }

  const parsed = FileUnitSchema.safeParse(value)
  if (!parsed.success) {
    throw new Error("Provider file-unit JSON response could not be parsed or validated.")
  }
  if (parsed.data.path !== expectedPath) {
    throw new Error(`Provider file-unit path mismatch. Expected ${expectedPath}.`)
  }
  if (!parsed.data.content.trim()) {
    throw new Error("Provider file-unit content was empty.")
  }
  return parsed.data
}
