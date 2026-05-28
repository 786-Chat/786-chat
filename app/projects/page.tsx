"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, FolderOpen, ArrowRight, Loader2, Globe, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Project {
  id: string
  name: string
  description: string | null
  domain: string | null
  custom_domain: string | null
  status: string
  is_default: boolean
  created_at: string
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newProject, setNewProject] = useState({ name: "", description: "" })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects")
      const data = await res.json()
      setProjects(data.projects || [])
      
      // If user has no projects, show create dialog
      if (!data.projects || data.projects.length === 0) {
        setShowCreateDialog(true)
      }
      
      // If user has only one project, go directly to it
      if (data.projects && data.projects.length === 1) {
        router.push(`/dashboard?project=${data.projects[0].id}`)
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async () => {
    if (!newProject.name.trim()) return
    
    setCreating(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject)
      })
      const data = await res.json()
      if (data.project) {
        setShowCreateDialog(false)
        router.push(`/dashboard?project=${data.project.id}`)
      }
    } catch (error) {
      console.error("Failed to create project:", error)
    } finally {
      setCreating(false)
    }
  }

  const selectProject = (projectId: string) => {
    router.push(`/dashboard?project=${projectId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080d] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#08080d] via-[#0d0d18] to-[#08080d]">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/mujeebproai-logo.png" alt="MujeebProAI" className="w-10 h-10 rounded-full" />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              MujeebProAI
            </span>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Your Projects</h1>
          <p className="text-white/50">Select a project to continue working on it</p>
        </div>

        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
              <FolderOpen className="w-10 h-10 text-cyan-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No projects yet</h2>
            <p className="text-white/50 mb-6">Create your first project to get started</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => selectProject(project.id)}
                className="group cursor-pointer"
              >
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-[#12121a] to-[#0d0d14] border border-white/[0.08] hover:border-cyan-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                  {project.is_default && (
                    <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium">
                      Default
                    </div>
                  )}
                  
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                    <FolderOpen className="w-6 h-6 text-purple-400" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                    {project.name}
                  </h3>
                  
                  {project.description && (
                    <p className="text-white/50 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-white/40">
                    {project.custom_domain && (
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {project.custom_domain}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(project.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center text-cyan-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    Open Project
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#12121a] border-white/[0.08]">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Project</DialogTitle>
            <DialogDescription className="text-white/50">
              Give your project a name and description to get started
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/70">Project Name</Label>
              <Input
                id="name"
                placeholder="My Awesome App"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white/70">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What are you building?"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="border-white/10 text-white/70 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={createProject}
              disabled={creating || !newProject.name.trim()}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
