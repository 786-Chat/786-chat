"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Github, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Zap,
  FileCode,
  GitBranch,
  Rocket
} from "lucide-react"

export default function AgentSettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [project, setProject] = useState<{
    github_username: string
    github_repo: string
    github_token: string
    connected: boolean
  } | null>(null)
  
  const [formData, setFormData] = useState({
    github_username: "",
    github_repo: "",
    github_token: ""
  })

  useEffect(() => {
    fetchProject()
  }, [])

  const fetchProject = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/agent/project")
      if (res.ok) {
        const data = await res.json()
        if (data.project) {
          setProject({
            github_username: data.project.github_username || "",
            github_repo: data.project.github_repo || "",
            github_token: data.project.github_token ? "••••••••" : "",
            connected: !!data.project.github_token
          })
          setFormData({
            github_username: data.project.github_username || "",
            github_repo: data.project.github_repo || "",
            github_token: ""
          })
        }
      }
    } catch (e) {
      console.error("Failed to fetch project:", e)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/agent/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        await fetchProject()
        alert("GitHub connected successfully! MujeebProAI can now edit your code.")
      } else {
        const error = await res.json()
        alert(error.message || "Failed to connect GitHub")
      }
    } catch (e) {
      alert("Failed to save settings")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-cyan-400" />
          Agent Mode Settings
        </h1>
        <p className="text-white/60">
          Connect your GitHub repository to enable MujeebProAI to edit your code directly.
        </p>
      </div>

      {/* Features Card */}
      <Card className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            What Agent Mode Can Do
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
              <FileCode className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div>
                <h4 className="text-white font-medium text-sm">Edit Code</h4>
                <p className="text-white/50 text-xs">Read, write, and modify files in your project</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
              <GitBranch className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <h4 className="text-white font-medium text-sm">Git Operations</h4>
                <p className="text-white/50 text-xs">Commit and push changes to GitHub</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
              <Rocket className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <h4 className="text-white font-medium text-sm">Deploy</h4>
                <p className="text-white/50 text-xs">Deploy your site to production</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card className="bg-[#14141f] border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub Connection
            {project?.connected ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 ml-2">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 ml-2">
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-white/50">
            Connect your GitHub repository to enable agent capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/70">GitHub Username</Label>
            <Input
              value={formData.github_username}
              onChange={(e) => setFormData({ ...formData, github_username: e.target.value })}
              placeholder="e.g., mujeebsardar"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-white/70">Repository Name</Label>
            <Input
              value={formData.github_repo}
              onChange={(e) => setFormData({ ...formData, github_repo: e.target.value })}
              placeholder="e.g., my-website"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-white/70 flex items-center gap-2">
              <Key className="w-4 h-4" />
              GitHub Personal Access Token
            </Label>
            <Input
              type="password"
              value={formData.github_token}
              onChange={(e) => setFormData({ ...formData, github_token: e.target.value })}
              placeholder={project?.connected ? "••••••••••••••••" : "ghp_xxxxxxxxxxxx"}
              className="bg-white/5 border-white/10 text-white"
            />
            <p className="text-xs text-white/40">
              Create a token at{" "}
              <a 
                href="https://github.com/settings/tokens/new?scopes=repo,workflow" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline inline-flex items-center gap-1"
              >
                github.com/settings/tokens
                <ExternalLink className="w-3 h-3" />
              </a>
              {" "}with repo and workflow permissions.
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !formData.github_username || !formData.github_repo}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : project?.connected ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Update Connection
              </>
            ) : (
              <>
                <Github className="w-4 h-4 mr-2" />
                Connect GitHub
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-[#14141f] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">How to Use Agent Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-white/70 text-sm">
          <p>1. Connect your GitHub repository above</p>
          <p>2. Go to the MujeebProAI chat dashboard</p>
          <p>3. Ask the AI to make changes like:</p>
          <div className="bg-white/5 rounded-lg p-3 font-mono text-xs space-y-2">
            <p className="text-cyan-400">{'"Change the header color to blue"'}</p>
            <p className="text-purple-400">{'"Add a contact form to the homepage"'}</p>
            <p className="text-green-400">{'"Fix the mobile navigation menu"'}</p>
          </div>
          <p>4. The AI will edit your code and deploy the changes automatically!</p>
        </CardContent>
      </Card>
    </div>
  )
}
