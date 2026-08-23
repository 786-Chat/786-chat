import { redirect } from "next/navigation"

import { ProjectsGallery } from "@/components/786-chat/projects-gallery"
import { getSession } from "@/lib/auth"

export default async function ProjectsPage() {
  const session = await getSession()

  if (!session?.email) {
    redirect("/login?next=%2F786.chat%2Fprojects&error=session-expired")
  }

  return <ProjectsGallery />
}
