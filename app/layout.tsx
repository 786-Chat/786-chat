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

const ACTIVE_PROJECT_FETCH_CACHE = `
(function () {
  if (window.__786ActiveProjectFetchCacheInstalled) return;
  window.__786ActiveProjectFetchCacheInstalled = true;

  var CACHE_KEY = '786chat_admin_active_project_cache_v1';
  var ACTIVE_ID_KEY = '786chat_admin_active_project_id_v1';
  var originalFetch = window.fetch.bind(window);

  function requestUrl(input) {
    try {
      return typeof input === 'string' ? new URL(input, window.location.origin) : new URL(input.url || String(input), window.location.origin);
    } catch (_) {
      return null;
    }
  }

  function requestMethod(input, init) {
    if (init && init.method) return String(init.method).toUpperCase();
    if (typeof Request !== 'undefined' && input instanceof Request) return String(input.method || 'GET').toUpperCase();
    return 'GET';
  }

  function readCache(projectId) {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.projectId !== projectId || !parsed.payload || !parsed.payload.project) return null;
      return parsed.payload;
    } catch (_) {
      return null;
    }
  }

  function writeCache(payload) {
    try {
      if (!payload || !payload.project || !payload.project.id) return;
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        projectId: payload.project.id,
        savedAt: Date.now(),
        payload: payload,
      }));
    } catch (_) {}
  }

  function cacheResponse(response) {
    try {
      response.clone().json().then(writeCache).catch(function () {});
    } catch (_) {}
  }

  window.fetch = function (input, init) {
    var url = requestUrl(input);
    var method = requestMethod(input, init);
    var match = url && url.pathname.match(/^\/api\/786-admin\/projects\/([^/?#]+)$/);
    var isProjectWrite = url && /^\/api\/786-admin\/projects(?:\/[^/?#]+)?$/.test(url.pathname) && (method === 'POST' || method === 'PATCH');

    if (isProjectWrite) {
      return originalFetch(input, init).then(function (response) {
        if (response.ok) cacheResponse(response);
        return response;
      });
    }

    if (!match || method !== 'GET') return originalFetch(input, init);

    var projectId = decodeURIComponent(match[1]);
    var activeId = null;
    try { activeId = localStorage.getItem(ACTIVE_ID_KEY); } catch (_) {}
    if (!activeId || activeId !== projectId) return originalFetch(input, init);

    var cached = readCache(projectId);
    var networkPromise = originalFetch(input, init).then(function (response) {
      if (response.ok) cacheResponse(response);
      return response;
    });

    if (!cached) return networkPromise;

    return Promise.race([
      networkPromise,
      new Promise(function (resolve) {
        setTimeout(function () {
          resolve(new Response(JSON.stringify(cached), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'X-786-Project-Cache': 'stale-while-revalidate' },
          }));
        }, 220);
      }),
    ]);
  };
})();
`

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
      <body className="font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: ACTIVE_PROJECT_FETCH_CACHE }} />
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
