"use client"

import { useState } from "react"
import { SettingsLayout } from "@/components/settings/settings-layout"
import { motion } from "framer-motion"
import {
  Users,
  UserPlus,
  Mail,
  Crown,
  Shield,
  Trash2,
  MoreHorizontal,
  Check,
  Loader2,
  Copy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"

interface Collaborator {
  id: string
  name: string
  email: string
  role: "owner" | "admin" | "member" | "viewer"
  avatar?: string
  status: "active" | "pending"
  joinedAt?: string
}

const roleColors: Record<string, string> = {
  owner: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  admin: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  member: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  viewer: "bg-slate-500/10 text-slate-500 border-slate-500/20",
}

const roleIcons: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: Users,
  viewer: Users,
}

export default function CollaboratorsPage() {
  const { user } = useAuth()
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [isInviting, setIsInviting] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Mock collaborators - in real app, fetch from API
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: "1",
      name: user?.name || "You",
      email: user?.email || "",
      role: "owner",
      status: "active",
      joinedAt: "2024-01-01",
    },
  ])

  const handleInvite = async () => {
    if (!inviteEmail) return
    
    setIsInviting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setCollaborators([
      ...collaborators,
      {
        id: Date.now().toString(),
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: inviteRole as Collaborator["role"],
        status: "pending",
      },
    ])
    
    setInviteEmail("")
    setIsInviting(false)
    setInviteDialogOpen(false)
  }

  const handleRemove = (id: string) => {
    setCollaborators(collaborators.filter(c => c.id !== id))
  }

  const handleRoleChange = (id: string, newRole: string) => {
    setCollaborators(collaborators.map(c => 
      c.id === id ? { ...c, role: newRole as Collaborator["role"] } : c
    ))
  }

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/workspace-123`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold">Collaborators</h1>
            <p className="text-muted-foreground">Manage who has access to this workspace</p>
          </div>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a Collaborator</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your workspace. They will receive an email with instructions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin - Full access</SelectItem>
                      <SelectItem value="member">Member - Can edit</SelectItem>
                      <SelectItem value="viewer">Viewer - Read only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={!inviteEmail || isInviting}>
                  {isInviting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Invite Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Invite Link
              </CardTitle>
              <CardDescription>Share this link to invite people to your workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/invite/workspace-123`}
                  className="font-mono text-sm"
                />
                <Button variant="outline" onClick={copyInviteLink}>
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Members */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Team Members
              </CardTitle>
              <CardDescription>{collaborators.length} member{collaborators.length !== 1 ? "s" : ""}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collaborators.map((collaborator) => {
                  const RoleIcon = roleIcons[collaborator.role]
                  return (
                    <div
                      key={collaborator.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={collaborator.avatar} />
                          <AvatarFallback>
                            {collaborator.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{collaborator.name}</p>
                            {collaborator.status === "pending" && (
                              <Badge variant="outline" className="text-xs">
                                Pending
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{collaborator.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={roleColors[collaborator.role]}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {collaborator.role.charAt(0).toUpperCase() + collaborator.role.slice(1)}
                        </Badge>
                        
                        {collaborator.role !== "owner" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRoleChange(collaborator.id, "admin")}>
                                Make Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRoleChange(collaborator.id, "member")}>
                                Make Member
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRoleChange(collaborator.id, "viewer")}>
                                Make Viewer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => handleRemove(collaborator.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Permissions Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Role Permissions
              </CardTitle>
              <CardDescription>What each role can do in this workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                  <div>Permission</div>
                  <div className="text-center">Admin</div>
                  <div className="text-center">Member</div>
                  <div className="text-center">Viewer</div>
                </div>
                {[
                  { name: "View content", admin: true, member: true, viewer: true },
                  { name: "Edit content", admin: true, member: true, viewer: false },
                  { name: "Manage sites", admin: true, member: true, viewer: false },
                  { name: "Invite members", admin: true, member: false, viewer: false },
                  { name: "Manage billing", admin: true, member: false, viewer: false },
                  { name: "Delete workspace", admin: false, member: false, viewer: false },
                ].map((perm) => (
                  <div key={perm.name} className="grid grid-cols-4 gap-4 text-sm py-2">
                    <div>{perm.name}</div>
                    <div className="text-center">
                      {perm.admin ? <Check className="w-4 h-4 mx-auto text-green-500" /> : <span className="text-muted-foreground">-</span>}
                    </div>
                    <div className="text-center">
                      {perm.member ? <Check className="w-4 h-4 mx-auto text-green-500" /> : <span className="text-muted-foreground">-</span>}
                    </div>
                    <div className="text-center">
                      {perm.viewer ? <Check className="w-4 h-4 mx-auto text-green-500" /> : <span className="text-muted-foreground">-</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </SettingsLayout>
  )
}
