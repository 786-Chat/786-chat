import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/auth-context'
import { I18nProvider } from '@/contexts/i18n-context'
import { AdminChatAttachmentBridge } from '@/components/786-admin/admin-chat-attachment-bridge'
import { AdminChatGenerationProgress } from '@/components/786-admin/admin-chat-generation-progress'
import { AdminChatPreviewCommonJsGuard } from '@/components/786-admin/admin-chat-preview-commonjs-guard'
import { AdminChatPreviewSourceGuard } from '@/components/786-admin/admin-chat-preview-source-guard'
import { AdminChatThemeControls } from '@/components/786-admin/admin-chat-theme-controls'
import './globals.css'

const geist = Geist({ 
  subsets: ["latin"],
  variable: '--font-geist-sans'
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-geist-mono'
})

const PREVIEW_COMMONJS_BOOTSTRAP = `
(function(){
  if (window.__786PreviewCommonJsBootstrapInstalled) return;
  window.__786PreviewCommonJsBootstrapInstalled = true;

  var marker = 'data-786-preview-commonjs="true"';
  var shim = '<script ' + marker + '>' +
    '(function(){try{' +
    'var module={exports:{}};' +
    'var exports=module.exports;' +
    'var require=function(name){' +
      'if(name==="react")return window.React||{};' +
      'if(name==="react-dom")return window.ReactDOM||{};' +
      'if(name==="next/link")return window.Link||function(p){return p&&p.children?p.children:null};' +
      'if(name==="next/image")return window.Image||function(){return null};' +
      'return {};' +
    '};' +
    'window.module=module;window.exports=exports;window.require=require;' +
    '}catch(_){}})();' +
    '<\\/script>';

  function patch(value){
    if (typeof value !== 'string' || !value || value.indexOf(marker) !== -1) return value;
    if (value.indexOf('<head>') !== -1) return value.replace('<head>', '<head>\\n' + shim);
    if (value.indexOf('<body>') !== -1) return value.replace('<body>', '<body>\\n' + shim);
    return shim + '\\n' + value;
  }

  var descriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'srcdoc');
  if (descriptor && descriptor.get && descriptor.set) {
    Object.defineProperty(HTMLIFrameElement.prototype, 'srcdoc', {
      configurable: true,
      enumerable: descriptor.enumerable,
      get: descriptor.get,
      set: function(value){ descriptor.set.call(this, patch(value)); }
    });
  }

  var originalSetAttribute = HTMLIFrameElement.prototype.setAttribute;
  HTMLIFrameElement.prototype.setAttribute = function(name, value){
    if (String(name).toLowerCase() === 'srcdoc') value = patch(value);
    return originalSetAttribute.call(this, name, value);
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
        <script dangerouslySetInnerHTML={{ __html: PREVIEW_COMMONJS_BOOTSTRAP }} />
        <AuthProvider>
          <I18nProvider>
            {children}
            <AdminChatAttachmentBridge />
            <AdminChatGenerationProgress />
            <AdminChatPreviewCommonJsGuard />
            <AdminChatPreviewSourceGuard />
            <AdminChatThemeControls />
          </I18nProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
