import { redirect } from "next/navigation"

import { BuilderPageManagerAccessBridge } from "@/components/786-chat/page-manager-access-bridge"
import { BuilderPageManagerOverlay } from "@/components/786-chat/page-manager-overlay"
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
      <BuilderPageManagerOverlay />
      <BuilderPageManagerAccessBridge />
    </>
  )
}
