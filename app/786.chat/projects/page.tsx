import Link from "next/link"
import { redirect } from "next/navigation"

import { ProjectsGallery } from "@/components/786-chat/projects-gallery"
import { getSession } from "@/lib/auth"

export default async function ProjectsPage() {
  const session = await getSession()

  if (!session?.email) {
    redirect("/login?next=%2F786.chat%2Fprojects&error=session-expired")
  }

  return (
    <div className="relative">
      <ProjectsGallery />
      <Link
        href="/786.chat/food-safety-book"
        className="fixed bottom-5 right-5 z-40 inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-300/30 bg-[#0b513d] px-4 text-sm font-black text-amber-100 shadow-2xl transition hover:-translate-y-0.5 hover:bg-[#126348]"
      >
        + Food Safety Book
      </Link>
    </div>
  )
}
