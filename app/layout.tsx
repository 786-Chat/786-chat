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
import { AdminChatProjectUrlController } from '@/components/786-admin/admin-chat-project-url-controller'
import { AdminChatPreviewRefreshController } from '@/components/786-admin/admin-chat-preview-refresh-controller'
import { AdminChatProjectPagesNavigator } from '@/components/786-admin/admin-chat-project-pages-navigator'
import { AdminChatPreviewOpenController } from '@/components/786-admin/admin-chat-preview-open-controller'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

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
    'function repairRouteNormalizer(source){' +
      'if(typeof source!=="string")return source;' +
      'var start=source.indexOf("function __normalizeRoute(value) {");' +
      'var end=start<0?-1:source.indexOf("function __notifyRoute",start);' +
      'if(start<0||end<0)return source;' +
      'var lines=[' +
        '"function __normalizeRoute(value) {",' +
        '"    var path = String(value || \'/\').trim()",' +
        '"    try { if (path.indexOf(\'http://\') === 0 || path.indexOf(\'https://\') === 0) path = new URL(path).pathname || \'/\' } catch (_) {}",' +
        '"    path = path.split(\'?\')[0].split(\'#\')[0]",' +
        '"    if (path.charAt(0) !== \'/\') path = \'/\' + path",' +
        '"    while (path.indexOf(\'//\') !== -1) path = path.split(\'//\').join(\'/\')",' +
        '"    while (path.length > 1 && path.charAt(path.length - 1) === \'/\') path = path.slice(0, -1)",' +
        '"    return path || \'/\'",' +
        '"  }",' +
        '"  "' +
      '];' +
      'return source.slice(0,start)+lines.join("\\n")+source.slice(end);' +
    '}' +
    'function patchCategoryRouteSync(source){' +
      'if(typeof source!=="string"||source.indexOf("__786CategoryRouteSyncInstalled")!==-1)return source;' +
      'var anchor="__renderRoute(\'/\')";' +
      'var at=source.lastIndexOf(anchor);' +
      'if(at<0)return source;' +
      'var lines=[' +
        '"  var __786CategoryRouteSyncInstalled = true",' +
        '"  var __786CategoryLabels = { all: \'\', starters: \'starters\', \'main courses\': \'main-courses\', pizza: \'pizza\', desserts: \'desserts\', drinks: \'drinks\' }",' +
        '"  function __786ButtonLabel(node) { return String(node && node.textContent || \'\').trim().toLowerCase().replace(/\\s+/g, \' \') }",' +
        '"  function __786CategoryFromEvent(event) {",' +
        '"    var target = event && event.target",' +
        '"    if (!target) return null",' +
        '"    var button = typeof target.closest === \'function\' ? target.closest(\'button,[role=button]\') : null",' +
        '"    if (!button && event.composedPath) {",' +
        '"      var path = event.composedPath()",' +
        '"      for (var p = 0; p < path.length; p++) { if (path[p] && path[p].tagName === \'BUTTON\') { button = path[p]; break } }",' +
        '"    }",' +
        '"    if (!button) return null",' +
        '"    var label = __786ButtonLabel(button)",' +
        '"    if (Object.prototype.hasOwnProperty.call(__786CategoryLabels, label)) return __786CategoryLabels[label]",' +
        '"    var keys = Object.keys(__786CategoryLabels)",' +
        '"    for (var k = 0; k < keys.length; k++) { if (label.indexOf(keys[k]) !== -1) return __786CategoryLabels[keys[k]] }",' +
        '"    return null",' +
        '"  }",' +
        '"  function __786PublishCategory(event) {",' +
        '"    var category = __786CategoryFromEvent(event)",' +
        '"    if (category === null) return",' +
        '"    setTimeout(function(){ try { window.parent.postMessage({ type: \'786-preview-category-changed\', category: category }, \'*\') } catch (_) {} }, 0)",' +
        '"  }",' +
        '"  document.addEventListener(\'click\', __786PublishCategory, true)",' +
        '"  document.addEventListener(\'pointerup\', __786PublishCategory, true)",' +
        '"  window.addEventListener(\'message\', function(event) {",' +
        '"    var data = event && event.data",' +
        '"    if (!data || data.type !== \'786-preview-apply-category\') return",' +
        '"    var wanted = String(data.category || \'\').trim().toLowerCase()",' +
        '"    var buttons = Array.prototype.slice.call(document.querySelectorAll(\'button,[role=button]\'))",' +
        '"    for (var i = 0; i < buttons.length; i++) {",' +
        '"      var label = __786ButtonLabel(buttons[i])",' +
        '"      if (Object.prototype.hasOwnProperty.call(__786CategoryLabels, label) && __786CategoryLabels[label] === wanted) { buttons[i].click(); break }",' +
        '"    }",' +
        '"  })",' +
        '"  "' +
      '];' +
      'return source.slice(0,at)+lines.join("\\n")+source.slice(at);' +
    '}' +
    'function patchDuplicateDeclarations(source){' +
      'if(typeof source!=="string")return source;' +
      'source=repairRouteNormalizer(source);' +
      'source=patchCategoryRouteSync(source);' +
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
    type: 'website', siteName: 'MujeebProAI', locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MujeebProAI – Advanced AI Platform for Businesses & Creators',
    description: 'MujeebProAI is a futuristic AI platform built by Mujeeb Sardar in the United Kingdom, helping businesses automate workflows, AI chat, analytics, and smart digital experiences.',
    creator: '@mujeebsardar',
  },
  icons: { icon: '/images/logo-animated.gif', apple: '/images/logo.png' },
}

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0a0a0f' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
            <AdminChatProjectUrlController />
            <AdminChatPreviewRefreshController />
            <AdminChatProjectPagesNavigator />
            <AdminChatPreviewOpenController />
          </I18nProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
