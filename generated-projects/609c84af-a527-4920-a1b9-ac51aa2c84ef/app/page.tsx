'use client'

import { useEffect, useRef, useState } from 'react'
import { Game } from '@/components/game/Game'

export default function Home() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-400 to-blue-600">
      <Game />
    </main>
  )
}
