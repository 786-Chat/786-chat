"use client"

import { useState } from "react"
import { SettingsLayout } from "@/components/settings/settings-layout"
import { motion } from "framer-motion"
import {
  Plug,
  Check,
  ExternalLink,
  Settings,
  Loader2,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface Integration {
  id: string
  name: string
  description: string
  icon: string
  connected: boolean
  category: "payment" | "marketing" | "analytics" | "communication"
}

const integrations: Integration[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Accept payments and manage subscriptions",
    icon: "💳",
    connected: true,
    category: "payment",
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Track website traffic and user behavior",
    icon: "📊",
    connected: false,
    category: "analytics",
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Email marketing and automation",
    icon: "📧",
    connected: false,
    category: "marketing",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Customer messaging and support",
    icon: "💬",
    connected: true,
    category: "communication",
  },
  {
    id: "twilio",
    name: "Twilio",
    description: "SMS notifications and alerts",
    icon: "📱",
    connected: false,
    category: "communication",
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect with 5000+ apps",
    icon: "⚡",
    connected: false,
    category: "marketing",
  },
]

const categoryLabels: Record<string, string> = {
  payment: "Payments",
  marketing: "Marketing",
  analytics: "Analytics",
  communication: "Communication",
}

export default function IntegrationsPage() {
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [integrationState, setIntegrationState] = useState<Record<string, boolean>>(
    Object.fromEntries(integrations.map(i => [i.id, i.connected]))
  )

  const handleConnect = async (id: string) => {
    setConnectingId(id)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIntegrationState(prev => ({ ...prev, [id]: !prev[id] }))
    setConnectingId(null)
  }

  const categories = Array.from(new Set(integrations.map(i => i.category)))

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">Connect third-party services to enhance your workspace</p>
        </motion.div>

        {/* Connected Count */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Plug className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {Object.values(integrationState).filter(Boolean).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Connected integrations</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <Check className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Integrations by Category */}
        {categories.map((category, categoryIndex) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + categoryIndex * 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{categoryLabels[category]}</CardTitle>
                <CardDescription>
                  {category === "payment" && "Process payments and manage transactions"}
                  {category === "marketing" && "Grow your audience and engage customers"}
                  {category === "analytics" && "Track performance and gain insights"}
                  {category === "communication" && "Stay connected with your customers"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrations
                    .filter(i => i.category === category)
                    .map((integration) => (
                      <div
                        key={integration.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-2xl border">
                            {integration.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{integration.name}</p>
                              {integrationState[integration.id] && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                                  Connected
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{integration.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {integrationState[integration.id] && (
                            <Button variant="ghost" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant={integrationState[integration.id] ? "outline" : "default"}
                            size="sm"
                            onClick={() => handleConnect(integration.id)}
                            disabled={connectingId === integration.id}
                          >
                            {connectingId === integration.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : integrationState[integration.id] ? (
                              "Disconnect"
                            ) : (
                              "Connect"
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* API Access */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                API Access
              </CardTitle>
              <CardDescription>Build custom integrations with our API</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Developer API</p>
                  <p className="text-sm text-muted-foreground">Access our REST API for custom integrations</p>
                </div>
                <Button variant="outline" asChild>
                  <a href="/docs/api" target="_blank">
                    View Documentation
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </SettingsLayout>
  )
}
