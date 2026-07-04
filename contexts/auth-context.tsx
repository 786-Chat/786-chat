"use client"

import { createContext, useContext, useEffect, useLayoutEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  name: string
  email: string
  plan: string
  credits: number
  role?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const VERIFIED_SESSION_CACHE_KEY = "786chat_verified_session_user_v1"

function readVerifiedSessionCache(): User | null {
  try {
    const raw = sessionStorage.getItem(VERIFIED_SESSION_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<User>
    if (!parsed.id || !parsed.email || !parsed.name || !parsed.plan || typeof parsed.credits !== "number") {
      sessionStorage.removeItem(VERIFIED_SESSION_CACHE_KEY)
      return null
    }
    return parsed as User
  } catch {
    return null
  }
}

function writeVerifiedSessionCache(user: User | null) {
  try {
    if (user) sessionStorage.setItem(VERIFIED_SESSION_CACHE_KEY, JSON.stringify(user))
    else sessionStorage.removeItem(VERIFIED_SESSION_CACHE_KEY)
  } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        writeVerifiedSessionCache(data.user)
      } else {
        setUser(null)
        writeVerifiedSessionCache(null)
      }
    } catch {
      const cached = readVerifiedSessionCache()
      setUser(cached)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useLayoutEffect(() => {
    const cached = readVerifiedSessionCache()
    if (!cached) return
    setUser(cached)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        writeVerifiedSessionCache(data.user)
        setIsLoading(false)
        return { success: true }
      }

      return { success: false, error: data.error }
    } catch {
      return { success: false, error: "Network error. Please try again." }
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        writeVerifiedSessionCache(data.user)
        setIsLoading(false)
        return { success: true }
      }

      return { success: false, error: data.error }
    } catch {
      return { success: false, error: "Network error. Please try again." }
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } finally {
      setUser(null)
      writeVerifiedSessionCache(null)
      router.push("/")
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
