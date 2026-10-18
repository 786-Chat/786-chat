import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = { title: "Food Safety Record Book", description: "Reusable 26-week Production and Food Safety Record Book" }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}<script src="/786-visual-editor.js" defer></script></body></html> }
