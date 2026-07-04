import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/auth-context'
import { I18nProvider } from '@/contexts/i18n-context'
import { AdminChatAttachmentBridge } from '@/components/786-admin/admin-chat-attachment-bridge'
import { AdminChatCrashBoundary } from '@/components/786-admin/admin-chat-crash-boundary'
import { AdminChatGenerationProgress } from '@/components/786-admin/admin-chat-generation-progress'
import { AdminChatProgressVisibilityGuard } from '@/components/786-admin/admin-chat-progress-visibility-guard'
import { AdminChatRefreshScrollGuard } from '@/components/786-admin/admin-chat-refresh-scroll-guard'
import { AdminChatPreviewSourceGuard } from '@/components/786-admin/admin-chat-preview-source-guard'
import { AdminChatThemeControls } from '@/components/786-admin/admin-chat-theme-controls'
import { AdminProjectCardIdentity } from '@/components/786-admin/admin-project-card-identity'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'MujeebProAI – Advanced AI Platform for Businesses & Creators',
  description: 'MujeebProAI is a futuristic AI platform built by Mujeeb Sardar in the United Kingdom, helping businesses automate workflows, AI chat, analytics, and smart digital experiences.',
  generator: 'Next.js',
  keywords: ['AI', 'Machine Learning', 'API', 'SaaS', 'MujeebProAI', 'Artificial Intelligence', 'Mujeeb Sardar', 'AI Platform', 'Business Automation', 'AI Chat', 'Analytics', 'United Kingdom'],
  authors: [{ name: 'Mujeeb Sardar', url: 'https://mujeebproai.com' }],
  creator: 'Mujeeb Sardar',
  publisher: 'MujeebProAI',
  openGraph: {
    title: 'MujeebProAI – Advanced AI Platform for Businesses & Creators',
    description: 'MujeebProAI is a futuristic AI platform built by Mujeeb Sardar in the United Kingdom, helping businesses automate workflows, AI chat, analytics, and smart digital experiences.',
    type: 'website',
    siteName: 'MujeebProAI',
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MujeebProAI – Advanced AI Platform for Businesses & Creators',
    description: 'MujeebProAI is a futuristic AI platform built by Mujeeb Sardar in the United Kingdom, helping businesses automate workflows, AI chat, analytics, and smart digital experiences.',
    creator: '@mujeebsardar',
  },
  icons: {
    icon: '/images/logo-animated.gif',
    apple: '/images/logo.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0a0a0f' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} bg-background`}>
      <head>
        <link rel="preconnect" href="https://unpkg.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.tailwindcss.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://unpkg.com" />
        <link rel="dns-prefetch" href="https://cdn.tailwindcss.com" />
        <link rel="preload" href="https://unpkg.com/react@18/umd/react.development.js" as="script" crossOrigin="anonymous" />
        <link rel="preload" href="https://unpkg.com/react-dom@18/umd/react-dom.development.js" as="script" crossOrigin="anonymous" />
        <link rel="preload" href="https://unpkg.com/@babel/standalone@7/babel.min.js" as="script" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          <I18nProvider>
            <AdminChatCrashBoundary>{children}</AdminChatCrashBoundary>
            <AdminChatAttachmentBridge />
            <AdminChatGenerationProgress />
            <AdminChatProgressVisibilityGuard />
            <AdminChatRefreshScrollGuard />
            <AdminChatPreviewSourceGuard />
            <AdminChatThemeControls />
            <AdminProjectCardIdentity />
          </I18nProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
