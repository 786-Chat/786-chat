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
import { AdminChatPreviewStorageGuard } from '@/components/786-admin/admin-chat-preview-storage-guard'
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

const PREVIEW_STORAGE_SRC_DOC_BOOTSTRAP = `
(function(){
  if (window.__786PreviewStorageSrcDocBootstrapInstalled) return;
  window.__786PreviewStorageSrcDocBootstrapInstalled = true;

  var marker = 'data-786-preview-storage="true"';
  var shim = '<script ' + marker + '>' +
    '(function(){try{' +
    'var localMemory={};var sessionMemory={};' +
    'function createStore(memory){return {' +
      'get length(){return Object.keys(memory).length},' +
      'key:function(i){return Object.keys(memory)[i]||null},' +
      'getItem:function(k){k=String(k);return Object.prototype.hasOwnProperty.call(memory,k)?memory[k]:null},' +
      'setItem:function(k,v){memory[String(k)]=String(v)},' +
      'removeItem:function(k){delete memory[String(k)]},' +
      'clear:function(){Object.keys(memory).forEach(function(k){delete memory[k]})}' +
    '}};' +
    'function patchDuplicateDeclarations(source){' +
      'if(typeof source!=="string")return source;' +
      'return source.replace(/(^|[\\n;{}])\\s*(const|let)\\s+([A-Za-z_$][\\w$]*)/g,function(match,prefix,_kind,name){' +
        'if(name.indexOf("__")===0)return match;' +
        'return prefix+" var "+name;' +
      '});' +
    '}' +
    'function wrapBabel(babel){' +
      'try{' +
        'if(!babel||babel.__786PreviewDeclarationGuard)return babel;' +
        'var originalTransform=babel.transform;' +
        'if(typeof originalTransform==="function"){' +
          'babel.transform=function(source,options){return originalTransform.call(this,patchDuplicateDeclarations(source),options)};' +
          'babel.__786PreviewDeclarationGuard=true;' +
        '}' +
      '}catch(_){}' +
      'return babel;' +
    '}' +
    'var babelValue;' +
    'try{Object.defineProperty(window,"Babel",{configurable:true,enumerable:true,get:function(){return babelValue},set:function(value){babelValue=wrapBabel(value)}})}catch(_){setTimeout(function(){try{if(window.Babel)wrapBabel(window.Babel)}catch(__){}},0)}' +
    'var localStore=createStore(localMemory);var sessionStore=createStore(sessionMemory);' +
    'try{Object.defineProperty(window,"localStorage",{configurable:true,enumerable:true,get:function(){return localStore}})}catch(_){try{window.localStorage=localStore}catch(__){}}' +
    'try{Object.defineProperty(window,"sessionStorage",{configurable:true,enumerable:true,get:function(){return sessionStore}})}catch(_){try{window.sessionStorage=sessionStore}catch(__){}}' +
    'window.__786PreviewLocalStorage=localStore;window.__786PreviewSessionStorage=sessionStore;' +
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
        <script dangerouslySetInnerHTML={{ __html: PREVIEW_STORAGE_SRC_DOC_BOOTSTRAP }} />
        <AuthProvider>
          <I18nProvider>
            <AdminChatCrashBoundary>{children}</AdminChatCrashBoundary>
            <AdminChatAttachmentBridge />
            <AdminChatGenerationProgress />
            <AdminChatProgressVisibilityGuard />
            <AdminChatRefreshScrollGuard />
            <AdminChatPreviewSourceGuard />
            <AdminChatPreviewStorageGuard />
            <AdminChatThemeControls />
            <AdminProjectCardIdentity />
          </I18nProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
