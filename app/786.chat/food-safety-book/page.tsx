import { redirect } from "next/navigation"

import { FoodSafetyTemplateLauncher } from "@/components/786-chat/food-safety-template-launcher"
import { getSession } from "@/lib/auth"

export default async function FoodSafetyBookTemplatePage() {
  const session = await getSession()

  if (!session?.email) {
    redirect("/login?next=%2F786.chat%2Ffood-safety-book&error=session-expired")
  }

  return <FoodSafetyTemplateLauncher />
}
