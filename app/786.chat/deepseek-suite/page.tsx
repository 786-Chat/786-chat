import { redirect } from "next/navigation"

import { DeepSeekSuite } from "@/components/786-chat/deepseek-suite"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"

export default async function DeepSeekSuitePage() {
  const session = await getSession()
  if (!session?.email) redirect("/login?next=%2F786.chat%2Fdeepseek-suite")
  if (!isAdminUser(session.email)) redirect("/786.chat/projects")

  return <DeepSeekSuite />
}
