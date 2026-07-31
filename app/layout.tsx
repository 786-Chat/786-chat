import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"

import { AuthProvider } from "@/contexts/auth-context"
import { I18nProvider } from "@/contexts/i18n-context"
import "./globals.css"

export const metadata: Metadata = {
  title: "786.Chat – Build production applications with AI",
  description:
    "Plan, generate, validate, build and deploy complete applications from one AI workspace.",
  generator: "Next.js",
  keywords: [
    "786.Chat",
    "AI application builder",
    "Next.js",
    "React",
    "TypeScript",
    "AI code generation",
  ],
  authors: [{ name: "786.Chat" }],
  creator: "786.Chat",
  publisher: "786.Chat",
  openGraph: {
    title: "786.Chat – Build production applications with AI",
    description:
      "Plan, generate, validate, build and deploy complete applications from one AI workspace.",
    type: "website",
    siteName: "786.Chat",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "786.Chat – Build production applications with AI",
    description:
      "Plan, generate, validate, build and deploy complete applications from one AI workspace.",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/images/logo.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a0a0f" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased">
        <AuthProvider>
          <I18nProvider>{children}</I18nProvider>
        </AuthProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
