import { redirect } from "next/navigation"

import { DesignStudioOverlay } from "@/components/786-chat/design-studio-overlay"
import { SevenEightSixWorkspace } from "@/components/786-chat/workspace"
import { getSession } from "@/lib/auth"

export default async function SevenEightSixBuilderPage() {
  const session = await getSession()

  if (!session?.email) {
    redirect("/login?next=%2F786.chat&error=session-expired")
  }

  return (
    <>
      <SevenEightSixWorkspace />
      <DesignStudioOverlay />
    </>
  )
}
