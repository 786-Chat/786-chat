import { redirect } from "next/navigation"

import { DeveloperContact } from "@/components/786-chat/developer-contact"
import { WorkspaceWithProjectsRoute } from "@/components/786-chat/workspace-with-projects-route"
import { getSession } from "@/lib/auth"

export default async function SevenEightSixBuilderPage() {
  const session = await getSession()

  if (!session?.email) {
    redirect("/login?next=%2F786.chat&error=session-expired")
  }

  return (
    <>
      <WorkspaceWithProjectsRoute />
      <DeveloperContact />
    </>
  )
}
