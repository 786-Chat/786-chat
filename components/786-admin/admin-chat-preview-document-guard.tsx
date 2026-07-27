"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const MARKER = "data-786-project-navigation-guard"
const SCRIPT = `<script ${MARKER}="true">
(function(){
  if (window.__786ProjectNavigationGuardInstalled) return;
  window.__786ProjectNavigationGuardInstalled = true;

  function slug(value){
    return String(value || '')
      .split('?')[0].split('#')[0]
      .replace(/^https?:\\/\\/[^/]+/i,'')
      .replace(/^\\/+|\\/+$/g,'')
      .replace(/[^a-z0-9]+/gi,'-')
      .replace(/^-+|-+$/g,'')
      .toLowerCase() || 'top';
  }
  function scrollToHash(hash){
    var id = String(hash || '#top').replace(/^#/,'') || 'top';
    var target = document.getElementById(id) || document.querySelector('[data-section="'+id+'"]');
    if (!target && id !== 'top') target = document.getElementById('top');
    if (target && target.scrollIntoView) target.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function handleRoute(value){
    var raw = String(value || '').trim();
    if (!raw || raw === '#') { scrollToHash('#top'); return true; }
    if (/^(mailto:|tel:)/i.test(raw)) return false;
    if (/^https?:\\/\\//i.test(raw)) {
      try { window.parent.postMessage({type:'786-preview-external-link',url:raw},'*'); } catch (_) {}
      return true;
    }
    var hash = raw.charAt(0) === '#' ? raw : '#'+slug(raw);
    scrollToHash(hash);
    try { history.replaceState(null,'',hash); } catch (_) {}
    return true;
  }

  document.addEventListener('click',function(event){
    var target = event.target;
    var anchor = target && target.closest ? target.closest('a[href]') : null;
    if (!anchor) return;
    var href = anchor.getAttribute('href') || '#';
    if (/^(mailto:|tel:)/i.test(href)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    handleRoute(href);
  },true);

  document.addEventListener('submit',function(event){
    event.preventDefault();
    event.stopPropagation();
    try {
      var form = event.target;
      if (form && form.setAttribute) form.setAttribute('data-submitted','true');
      window.parent.postMessage({type:'786-preview-form-submitted'},'*');
    } catch (_) {}
  },true);

  var originalPush = history.pushState.bind(history);
  var originalReplace = history.replaceState.bind(history);
  history.pushState = function(state,title,url){ if (url != null) { handleRoute(url); return; } return originalPush(state,title,url); };
  history.replaceState = function(state,title,url){
    if (url != null && String(url).charAt(0) !== '#') { handleRoute(url); return; }
    return originalReplace(state,title,url);
  };

  try {
    window.open = function(url){ handleRoute(url); return null; };
  } catch (_) {}
})();
<\/script>`

function patchSrcDoc(value: string): string {
  if (!value || value.includes(MARKER)) return value
  let next = value
  if (!/<base\b/i.test(next)) {
    if (/<head[^>]*>/i.test(next)) next = next.replace(/<head([^>]*)>/i, '<head$1><base href="about:blank">')
    else next = `<base href="about:blank">${next}`
  }
  if (/<body[^>]*>/i.test(next)) return next.replace(/<body([^>]*)>/i, `<body$1>${SCRIPT}`)
  return `${SCRIPT}${next}`
}

function isPreview(frame: HTMLIFrameElement): boolean {
  return /preview/i.test(frame.title || frame.getAttribute("title") || "")
}

export function AdminChatPreviewDocumentGuard() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    const descriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "srcdoc")
    const originalSetAttribute = HTMLIFrameElement.prototype.setAttribute

    if (descriptor?.get && descriptor.set) {
      Object.defineProperty(HTMLIFrameElement.prototype, "srcdoc", {
        configurable: true,
        enumerable: descriptor.enumerable,
        get: descriptor.get,
        set(value: string) {
          descriptor.set?.call(this, typeof value === "string" ? patchSrcDoc(value) : value)
        },
      })
    }

    HTMLIFrameElement.prototype.setAttribute = function(name: string, value: string) {
      if (name.toLowerCase() === "srcdoc" && typeof value === "string") {
        return originalSetAttribute.call(this, name, patchSrcDoc(value))
      }
      return originalSetAttribute.call(this, name, value)
    }

    const patchExisting = () => {
      for (const frame of Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe"))) {
        if (!isPreview(frame)) continue
        const current = frame.getAttribute("srcdoc") || frame.srcdoc || ""
        if (!current || current.includes(MARKER)) continue
        frame.srcdoc = patchSrcDoc(current)
      }
    }

    patchExisting()
    const observer = new MutationObserver(patchExisting)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["srcdoc"] })

    return () => {
      observer.disconnect()
      HTMLIFrameElement.prototype.setAttribute = originalSetAttribute
      if (descriptor) Object.defineProperty(HTMLIFrameElement.prototype, "srcdoc", descriptor)
    }
  }, [pathname])

  return null
}
