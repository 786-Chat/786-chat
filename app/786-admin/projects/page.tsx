"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Box,
  ChevronDown,
  Grid3X3,
  Link2,
  List,
  MoreVertical,
  Search,
  ShieldCheck,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"

const ADMIN_EMAIL = "mujeeb@job4u.com"

const projects = [
  {
    name: "Food Safety Hub",
    age: "4 days ago",
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80",
    locked: false,
  },
  {
    name: "AttachmentAnalyzer",
    age: "last week",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80",
    locked: false,
  },
  {
    name: "Food Data Miner",
    age: "2 weeks ago",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
    locked: false,
  },
  {
    name: "FoodSafetyMenu",
    age: "last month",
    image:
      "https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=900&q=80",
    locked: false,
  },
  {
    name: "Language Tutor",
    age: "last month",
    image:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=900&q=80",
    locked: true,
  },
  {
    name: "Roblox Builder",
    age: "2 months ago",
    image:
      "https://images.unsplash.com/photo-1556438064-2d7646166914?auto=format&fit=crop&w=900&q=80",
    locked: false,
  },
  {
    name: "RestaurantContractPortal",
    age: "2 months ago",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
    locked: false,
  },
]

export default function SevenEightSixProjectsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [search, setSearch] = useState("")

  const isAdmin = useMemo(
    () => user?.email?.toLowerCase().trim() === ADMIN_EMAIL,
    [user]
  )

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/786-admin/login")
    }
  }, [isAdmin, isLoading, router])

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f5f3] text-slate-900">
        Loading Projects
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f6f5f3] px-5 py-10 text-slate-950 lg:px-16">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Grid3X3 className="h-6 w-6" />
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        </div>

        <button
          onClick={() => router.push("/786-admin/dashboard")}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Back Dashboard
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64 max-w-full">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="h-9 rounded-md border-slate-300 bg-white pr-9"
            />
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>

          <button className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-800 hover:bg-white">
            Any status
            <ChevronDown className="h-4 w-4" />
          </button>

          <button className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-800 hover:bg-white">
            Any artifact type
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50">
            <Box className="h-4 w-4" />
            All projects
            <ChevronDown className="h-4 w-4" />
          </button>
          <button className="rounded-md border border-slate-300 bg-white p-2 shadow-sm hover:bg-slate-50">
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button className="rounded-md border border-slate-300 bg-white p-2 shadow-sm hover:bg-slate-50">
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {filteredProjects.map((project) => (
          <article
            key={project.name}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative h-40 overflow-hidden bg-slate-900">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${project.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
              <div className="absolute bottom-3 left-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-700 shadow-sm">
                <Box className="h-4 w-4" />
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="truncate text-sm font-medium text-slate-950">{project.name}</h2>
                <div className="flex items-center gap-2 text-slate-500">
                  <Link2 className="h-4 w-4" />
                  <MoreVertical className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                {project.locked ? "Locked" : ""} {project.locked ? "·" : ""} {project.age}
              </p>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
