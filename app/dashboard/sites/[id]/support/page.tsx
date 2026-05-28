"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { 
  HelpCircle, 
  MessageSquare,
  FileText,
  ExternalLink,
  Mail,
  Send,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const faqs = [
  {
    question: "How do I publish my website?",
    answer: "Click the 'Publish' button in the header or sidebar to make your website live. You can unpublish at any time."
  },
  {
    question: "Can I change my theme after purchase?",
    answer: "You can customize colors, fonts, and layout in Theme Settings. To switch to a completely different theme, please contact support."
  },
  {
    question: "How do I add images to my gallery?",
    answer: "Go to the Gallery page and click 'Upload Images'. You can upload multiple images at once."
  },
  {
    question: "Can I connect my own domain?",
    answer: "Custom domain support is coming soon. For now, your site is available at your subdomain.mujeebproai.com"
  },
]

export default function SupportPage() {
  const params = useParams()
  const siteId = params.id as string

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsSubmitting(false)
    setSubmitted(true)
    setFormData({ subject: "", category: "", message: "" })
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Support</h1>
        <p className="text-muted-foreground mt-1">
          Get help with your website
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-3 gap-4">
        <a
          href="mailto:support@mujeebproai.com"
          className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Email Support</p>
            <p className="text-sm text-muted-foreground">support@mujeebproai.com</p>
          </div>
        </a>
        <a
          href="/dashboard/chat"
          className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">AI Assistant</p>
            <p className="text-sm text-muted-foreground">Get instant help</p>
          </div>
        </a>
        <a
          href="https://mujeebproai.com/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-center gap-1">
            <p className="font-medium">Documentation</p>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </div>
        </a>
      </div>

      {/* FAQs */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="p-4 rounded-lg border border-border">
                <p className="font-medium">{faq.question}</p>
                <p className="text-sm text-muted-foreground mt-2">{faq.answer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Form */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Contact Support
          </CardTitle>
          <CardDescription>Send us a message and we will get back to you</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Message Sent!</h3>
              <p className="text-muted-foreground mb-4">
                We will get back to you as soon as possible.
              </p>
              <Button variant="outline" onClick={() => setSubmitted(false)}>
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="general">General Question</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your issue or question in detail"
                  rows={5}
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Message
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
