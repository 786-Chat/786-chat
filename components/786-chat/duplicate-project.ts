export async function duplicateBuilderProject(projectId: string) {
  const response = await fetch(`/api/786-chat/projects/${projectId}/duplicate`, {
    method: "POST",
  })
  const payload = (await response.json().catch(() => ({}))) as {
    project?: { id: string; title: string }
    error?: string
  }

  if (!response.ok || !payload.project) {
    throw new Error(payload.error || "Project could not be duplicated.")
  }

  return {
    projectId: payload.project.id,
    title: payload.project.title,
  }
}
