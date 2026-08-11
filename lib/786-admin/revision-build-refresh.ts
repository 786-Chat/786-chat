export async function queueRevisionRebuild(input: {
  request: Request
  projectId: string
}) {
  const { POST: queueBuild } = await import("@/app/api/786-admin/projects/[id]/build/route")
  const buildRequest = new Request(
    new URL(`/api/786-admin/projects/${encodeURIComponent(input.projectId)}/build`, input.request.url),
    {
      method: "POST",
      headers: input.request.headers,
      body: JSON.stringify({ confirm: true }),
    },
  )
  return queueBuild(buildRequest, { params: Promise.resolve({ id: input.projectId }) })
}
