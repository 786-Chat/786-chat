"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  FileText,
  FilePlus,
  FileX,
  Search,
  FolderOpen,
  Database,
  Loader2,
  Check,
  X,
  Rocket,
  Undo2,
} from "lucide-react"

// Map a tool name to a friendly label + icon
function toolMeta(toolName: string) {
  switch (toolName) {
    case "write_file":
      return { label: "Editing file", Icon: FilePlus, color: "text-cyan-400" }
    case "read_file":
      return { label: "Reading file", Icon: FileText, color: "text-blue-400" }
    case "delete_file":
      return { label: "Deleting file", Icon: FileX, color: "text-red-400" }
    case "list_files":
      return { label: "Listing files", Icon: FolderOpen, color: "text-amber-400" }
    case "search_code":
      return { label: "Searching code", Icon: Search, color: "text-purple-400" }
    case "get_database_info":
      return { label: "Reading database", Icon: Database, color: "text-emerald-400" }
    case "query_database":
      return { label: "Querying database", Icon: Database, color: "text-emerald-400" }
    default:
      return { label: toolName, Icon: FileText, color: "text-white/60" }
  }
}

export interface ToolPart {
  type: string // e.g. "tool-write_file"
  state?: string // "input-streaming" | "input-available" | "output-available" | "output-error"
  input?: { path?: string; query?: string; message?: string }
  output?: { success?: boolean; error?: string; path?: string; message?: string }
}

// Pull a human-readable target (file path or query) out of a tool part
function getTarget(part: ToolPart): string | undefined {
  return (
    part.input?.path ||
    part.output?.path ||
    part.input?.query ||
    undefined
  )
}

function DeployStatus({ path }: { path: string }) {
  // After a write/delete, show a deploy progress indicator.
  // GitHub commit -> Vercel build -> live, roughly 1-2 minutes.
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06] px-2.5 py-1.5">
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <Rocket className="h-3.5 w-3.5 text-cyan-400" />
      </motion.div>
      <span className="text-[11px] text-cyan-300/90">
        Deploying to mujeebproai.com — live in 1-2 minutes
      </span>
    </div>
  )
}

export function ToolActivity({ parts }: { parts: ToolPart[] }) {
  if (!parts || parts.length === 0) return null

  return (
    <div className="mt-1 mb-1 flex flex-col gap-1.5">
      {parts.map((part, i) => {
        const toolName = part.type.replace(/^tool-/, "")
        const { label, Icon, color } = toolMeta(toolName)
        const target = getTarget(part)
        const isRunning =
          part.state === "input-streaming" || part.state === "input-available"
        const hasOutput = part.state === "output-available"
        const failed =
          part.state === "output-error" || part.output?.success === false
        const isWriteOrDelete =
          (toolName === "write_file" || toolName === "delete_file") &&
          hasOutput &&
          !failed

        return (
          <motion.div
            key={`${part.type}-${i}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className={`flex-shrink-0 ${color}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="text-[12px] font-medium text-white/80">{label}</span>
              {target && (
                <code className="truncate rounded bg-black/30 px-1.5 py-0.5 text-[11px] text-cyan-300/90">
                  {target}
                </code>
              )}
              <span className="ml-auto flex-shrink-0">
                {isRunning && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" />
                )}
                {hasOutput && !failed && (
                  <Check className="h-3.5 w-3.5 text-green-400" />
                )}
                {failed && <X className="h-3.5 w-3.5 text-red-400" />}
              </span>
            </div>

            {failed && (part.output?.error || part.state === "output-error") && (
              <p className="mt-1 text-[11px] text-red-400/80">
                {part.output?.error || "Something went wrong with this action."}
              </p>
            )}

            {isWriteOrDelete && target && <DeployStatus path={target} />}
          </motion.div>
        )
      })}
    </div>
  )
}
