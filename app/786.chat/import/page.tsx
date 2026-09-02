import { redirect } from "next/navigation"

import { ImportExistingProjectPage } from "@/components/786-chat/import-existing-project-page"
import { getSession } from "@/lib/auth"

export default async function ImportProjectPage() {
  const session = await getSession()
  if (!session?.email) {
    redirect("/login?next=%2F786.chat%2Fimport&error=session-expired")
  }
  return <ImportExistingProjectPage />
}
