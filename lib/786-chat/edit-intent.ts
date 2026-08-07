export type ApplicationEditKind =
  | "undo"
  | "header-colour"
  | "booking-form"
  | "database-table"
  | "general"

export type ApplicationEditIntent = {
  kind: ApplicationEditKind
  requestedTable: string | null
}

const RESERVED_DATABASE_WORDS = new Set([
  "exists",
  "exist",
  "fields",
  "field",
  "schema",
  "database",
  "table",
  "tables",
  "statement",
  "statements",
  "syntax",
  "column",
  "columns",
  "postgresql",
  "sql",
])

function databaseTableName(prompt: string) {
  const match = prompt.match(
    /\b(?:create|add|make)\s+(?:a\s+|an\s+)?(?:database\s+)?table\s*:?\s*(?:called|named)?\s*([a-z][a-z0-9_]*)\b/i,
  )
  if (!match?.[1]) return null
  const value = match[1]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
  if (RESERVED_DATABASE_WORDS.has(value)) return null
  return value || null
}

function hasExplicitDatabaseTableCreation(prompt: string) {
  return /\b(?:create|add|make)\s+(?:a\s+|an\s+)?(?:database\s+)?table\s*:?\s*(?:called|named)?\s*[a-z][a-z0-9_]*\s*(?=\n|\r|\(|\bwith\b|\bfields?\b|$)/i.test(prompt)
}

export function isUndoApplicationEdit(prompt: string) {
  return /^(?:please\s+)?(?:undo|undo\s+(?:the\s+)?last\s+change|revert\s+(?:the\s+)?last\s+change|go\s+back\s+one\s+change)[.!\s]*$/i
    .test(prompt.trim())
}

export function classifyApplicationEdit(prompt: string): ApplicationEditIntent {
  if (isUndoApplicationEdit(prompt)) return { kind: "undo", requestedTable: null }
  if (/\b(?:change|set|update|make)\b[\s\S]{0,80}\bheader\b[\s\S]{0,80}\bcolou?r\b|\bheader\b[\s\S]{0,40}\bcolou?r\b/i.test(prompt)) {
    return { kind: "header-colour", requestedTable: null }
  }
  if (/\b(?:add|create|build|make)\b[\s\S]{0,60}\b(?:booking|appointment)\b[\s\S]{0,30}\bform\b|\bbooking\s+form\b/i.test(prompt)) {
    return { kind: "booking-form", requestedTable: null }
  }
  if (hasExplicitDatabaseTableCreation(prompt)) {
    return { kind: "database-table", requestedTable: databaseTableName(prompt) }
  }
  return { kind: "general", requestedTable: null }
}

export function applicationEditBrief(
  intent: ApplicationEditIntent,
  editingExistingProject: boolean,
) {
  if (!editingExistingProject) return []
  const common = [
    "Application edit mode: preserve every unrelated route, component, style, data contract and visual-editor state.",
    "Return only files that must change, but return complete replacement content for each changed file.",
    "Keep Code, Design, preview and revision history compatible with the edited project.",
  ]
  if (intent.kind === "header-colour") {
    return [
      ...common,
      "Targeted header edit: change the real header/navigation colour requested by the user and do not recolour unrelated sections.",
    ]
  }
  if (intent.kind === "booking-form") {
    return [
      ...common,
      "Booking edit: add a real accessible booking form with labelled fields, validation, submit handling, success/error states and responsive layout.",
      "If bookings must persist, include the server API and PostgreSQL schema required to store them; do not simulate a successful save.",
    ]
  }
  if (intent.kind === "database-table") {
    return [
      ...common,
      ...(intent.requestedTable
        ? [`Database edit: create the PostgreSQL table ${intent.requestedTable} in sql/schema.sql using CREATE TABLE IF NOT EXISTS.`]
        : ["Database edit: create only the table explicitly named by the user. Do not invent a fallback table name."]),
      "Include a UUID primary key, created_at and updated_at timestamps, useful indexes and foreign keys where relationships exist.",
      "Keep DATABASE_URL and database operations server-only. Add tenant ownership fields and guards when the project is tenant-scoped.",
    ]
  }
  return common
}
