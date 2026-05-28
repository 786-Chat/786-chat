"use client"

import { useState } from "react"
import { useShop } from "../layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { HelpCircle, MessageSquare, Phone, Mail, FileText, ExternalLink, Send, Loader2 } from "lucide-react"

export default function SupportPage() {
  const { site, user } = useShop()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Submit ticket
    setTimeout(() => {
      setIsSubmitting(false)
      setSubject("")
      setMessage("")
      alert("Support ticket submitted!")
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Help & Support</h1>
        <p className="text-slate-500">Get help with your restaurant dashboard</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:border-orange-200 transition-colors cursor-pointer">
          <CardContent className="pt-6 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-orange-500" />
            <h3 className="font-semibold">Documentation</h3>
            <p className="text-sm text-slate-500 mt-1">Browse our help articles</p>
          </CardContent>
        </Card>
        <Card className="hover:border-orange-200 transition-colors cursor-pointer">
          <CardContent className="pt-6 text-center">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-orange-500" />
            <h3 className="font-semibold">Live Chat</h3>
            <p className="text-sm text-slate-500 mt-1">Chat with our support team</p>
          </CardContent>
        </Card>
        <Card className="hover:border-orange-200 transition-colors cursor-pointer">
          <CardContent className="pt-6 text-center">
            <Phone className="w-10 h-10 mx-auto mb-3 text-orange-500" />
            <h3 className="font-semibold">Phone Support</h3>
            <p className="text-sm text-slate-500 mt-1">Call us for urgent issues</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit a Support Ticket</CardTitle>
          <CardDescription>Describe your issue and we will get back to you</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input 
                id="subject" 
                placeholder="Brief description of your issue" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message" 
                placeholder="Provide details about your issue..." 
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="gap-2 bg-orange-500 hover:bg-orange-600">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Ticket
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-slate-400" />
            <span>support@mujeebproai.com</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-slate-400" />
            <span>+44 123 456 7890</span>
          </div>
          <div className="flex items-center gap-3">
            <ExternalLink className="w-5 h-5 text-slate-400" />
            <a href="#" className="text-orange-600 hover:underline">Visit our help center</a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
