"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import "../../chat-dashboard-brand.css"

const OWNER_EMAILS = ["mujeeb@job4u.com"]

// Customer chat is rendered directly by the workspace layout.
// The owner account uses the newer protected 786 builder instead.
export default function ChatPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    const email = String(user?.email || "").trim().toLowerCase()
    if (OWNER_EMAILS.includes(email)) {
      router.replace("/786-admin/chat")
    }
  }, [isLoading, router, user?.email])

  return null
}
