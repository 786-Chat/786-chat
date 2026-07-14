"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { HelpCircle, MessageSquare, FileText, ExternalLink, Mail, Send, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const faqs = [
  { question: "How do I publish my website?", answer: "Click the Publish button in the builder to create a live deployment." },
  { question: "Can I change my theme after purchase?", answer: "You can customize colours, fonts, and layouts from your project workspace." },
  { question: "How do I add images?", answer: "Upload images from the builder or attach them to an AI request." },
  { question: "Can I connect my own domain?", answer: "Custom-domain support is managed from your 786 Chat AI project deployment settings." },
]

export default function SupportPage() {
  useParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({ accountEmail: "", subject: "", category: "", message: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setSubmitted(true)
    setFormData({ accountEmail: "", subject: "", category: "", message: "" })
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div><h1 className="text-2xl font-bold">Support</h1><p className="text-muted-foreground mt-1">Get help with your 786 Chat AI project</p></div>
      <div className="grid sm:grid-cols-3 gap-4">
        <a href="mailto:mujeeb@job4u.com" className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Mail className="w-5 h-5 text-primary" /></div>
          <div><p className="font-medium">Email Support</p><p className="text-sm text-muted-foreground">mujeeb@job4u.com</p></div>
        </a>
        <a href="/786-admin/chat" className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-primary" /></div>
          <div><p className="font-medium">AI Assistant</p><p className="text-sm text-muted-foreground">Get instant help</p></div>
        </a>
        <a href="/contact" className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div>
          <div className="flex items-center gap-1"><p className="font-medium">Help centre</p><ExternalLink className="w-3 h-3 text-muted-foreground" /></div>
        </a>
      </div>
      <Card className="bg-card/50 border-border/50"><CardHeader><CardTitle className="flex items-center gap-2"><HelpCircle className="w-5 h-5 text-primary" />Frequently Asked Questions</CardTitle></CardHeader><CardContent><div className="space-y-4">{faqs.map((faq) => <div key={faq.question} className="p-4 rounded-lg border border-border"><p className="font-medium">{faq.question}</p><p className="text-sm text-muted-foreground mt-2">{faq.answer}</p></div>)}</div></CardContent></Card>
      <Card className="bg-card/50 border-border/50">
        <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" />Contact Support</CardTitle><CardDescription>Use the email connected to your account. Never send your password, API key, or secret token.</CardDescription></CardHeader>
        <CardContent>{submitted ? <div className="text-center py-8"><Send className="w-8 h-8 text-green-500 mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">Message Sent!</h3><p className="text-muted-foreground mb-4">We will get back to you as soon as possible.</p><Button variant="outline" onClick={() => setSubmitted(false)}>Send Another Message</Button></div> :
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="accountEmail">Account email</Label><Input id="accountEmail" type="email" value={formData.accountEmail} onChange={(e) => setFormData({ ...formData, accountEmail: e.target.value })} placeholder="Email used to sign in" required /></div>
            <div className="grid sm:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="subject">Subject</Label><Input id="subject" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="Brief description of your issue" required /></div><div className="space-y-2"><Label htmlFor="category">Category</Label><Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}><SelectTrigger id="category"><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent><SelectItem value="technical">Technical Issue</SelectItem><SelectItem value="billing">Billing</SelectItem><SelectItem value="feature">Feature Request</SelectItem><SelectItem value="general">General Question</SelectItem></SelectContent></Select></div></div>
            <div className="space-y-2"><Label htmlFor="message">Message</Label><Textarea id="message" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="Describe your issue. Do not include passwords or secret keys." rows={5} required /></div>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}Send Message</Button>
          </form>}
        </CardContent>
      </Card>
    </div>
  )
}
