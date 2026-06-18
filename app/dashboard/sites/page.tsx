"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Globe,
  Settings,
  ExternalLink,
  Loader2,
  Layout,
  Eye,
  EyeOff,
  MoreVertical,
  Pencil,
  MessageSquare,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

interface Site {
  id: string
  site_name: string
  subdomain: string
  custom_domain: string | null
  is_published: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  theme_name: string
  theme_slug: string
  theme_thumbnail: string
}

export default function MySitesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [sites, setSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingSiteId, setDeletingSiteId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard/sites")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await fetch("/api/customer/sites", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setSites(data.sites || [])
        }
      } catch (error) {
        console.error("Failed to fetch sites:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchSites()
    }
  }, [user])

  const togglePublish = async (siteId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/customer/sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !currentStatus }),
        credentials: "include",
      })

      if (res.ok) {
        setSites((prev) =>
          prev.map((site) =>
            site.id === siteId ? { ...site, is_published: !currentStatus } : site
          )
        )
      }
    } catch (error) {
      console.error("Failed to toggle publish:", error)
    }
  }

  const deleteSite = async (site: Site) => {
    const confirmed = window.confirm(
      `Delete "${site.site_name}"?\n\nThis will remove this website from My Sites. This action cannot be undone.`
    )

    if (!confirmed) return

    setDeletingSiteId(site.id)

    try {
      const res = await fetch(`/api/customer/sites/${site.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!res.ok) {
        throw new Error("Failed to delete site")
      }

      setSites((prev) => prev.filter((item) => item.id !== site.id))
    } catch (error) {
      console.error("Failed to delete site:", error)
      alert("Failed to delete this website. Please try again.")
    } finally {
      setDeletingSiteId(null)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Sites</h1>
              <p className="text-muted-foreground mt-1">
                Manage your websites built with MujeebProAI themes
              </p>
            </div>
            <Button asChild>
              <Link href="/themes">
                <Plus className="w-4 h-4 mr-2" />
                Create New Site
              </Link>
            </Button>
          </div>

          {sites.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Globe className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold mb-2">No sites yet</h2>
                <p className="text-muted-foreground mb-6">
                  Purchase a theme to create your first website
                </p>
                <Button asChild>
                  <Link href="/themes">Browse Themes</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sites.map((site, index) => (
                <motion.div
                  key={site.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative bg-muted">
                      {site.theme_thumbnail ? (
                        <img
                          src={site.theme_thumbnail}
                          alt={site.site_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Layout className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" asChild>
                          <Link href={`/dashboard/sites/${site.id}/chat`}>
                            <MessageSquare className="w-4 h-4 mr-1" />
                            AI Chat
                          </Link>
                        </Button>
                        <Button size="sm" variant="secondary" asChild>
                          <Link href={`/dashboard/sites/${site.id}/builder`}>
                            <Pencil className="w-4 h-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteSite(site)}
                          disabled={deletingSiteId === site.id}
                        >
                          {deletingSiteId === site.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                        {site.is_published && (
                          <Button size="sm" variant="outline" className="bg-white/10" asChild>
                            <a
                              href={`https://${site.subdomain}.mujeebproai.com`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>

                      <div className="absolute top-2 right-2">
                        <Badge variant={site.is_published ? "default" : "secondary"}>
                          {site.is_published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{site.site_name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {site.subdomain}.mujeebproai.com
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/sites/${site.id}/chat`}>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                AI Chat
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/sites/${site.id}/builder`}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit Site
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/sites/${site.id}/settings`}>
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => togglePublish(site.id, site.is_published)}>
                              {site.is_published ? (
                                <>
                                  <EyeOff className="w-4 h-4 mr-2" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Publish
                                </>
                              )}
                            </DropdownMenuItem>
                            {site.is_published && (
                              <DropdownMenuItem asChild>
                                <a
                                  href={`https://${site.subdomain}.mujeebproai.com`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View Live Site
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteSite(site)}
                              disabled={deletingSiteId === site.id}
                              className="text-red-500 focus:text-red-500"
                            >
                              {deletingSiteId === site.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 mr-2" />
                              )}
                              Delete Website
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">
                        Theme: {site.theme_name}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
