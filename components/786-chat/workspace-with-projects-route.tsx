"use client"

import { useRouter } from "next/navigation"
import type { MouseEvent as ReactMouseEvent } from "react"

import { ProjectDomainManager } from "./project-domain-manager"
import { SevenEightSixWorkspace } from "./workspace"

export function WorkspaceWithProjectsRoute() {
  const router = useRouter()

  function handleClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement | null
    const button = target?.closest("button")
    if (!button || button.textContent?.trim() !== "Projects") return

    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
    router.push("/786.chat/projects")
  }

  return (
    <div className="h-screen" onClickCapture={handleClickCapture}>
      <SevenEightSixWorkspace />
      <ProjectDomainManager />
    </div>
  )
}
