import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sky Hopper - Arcade Flying Game',
  description: 'A fun and addictive side-scrolling flying game with original characters and obstacles.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </head>
      <body>{children}<script src="/786-visual-editor.js" defer></script></body>
    </html>
  )
}
