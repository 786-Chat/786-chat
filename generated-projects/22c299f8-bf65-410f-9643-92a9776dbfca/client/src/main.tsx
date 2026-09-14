import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

function installBranchLoginVideoManager() {
  const addAdminUploader = () => {
    if (!window.location.pathname.startsWith('/admin')) return;
    if (document.querySelector('[data-branch-login-video-nav="true"]')) return;

    const siteSettingsText = Array.from(document.querySelectorAll('span')).find((el) => el.textContent?.trim() === 'Site Settings');
    const siteButton = siteSettingsText?.closest('button');
    if (!siteButton?.parentElement) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('data-branch-login-video-nav', 'true');
    button.className = siteButton.className;
    button.innerHTML = `
      <div class="flex items-center justify-center w-8 h-8 rounded-md text-slate-400 group-hover/item:text-white group-hover/item:bg-white/10">
        <span style="font-size:16px">🎬</span>
      </div>
      <div class="ml-3 flex-1 flex items-center justify-between">
        <span class="text-sm font-medium">Branch Login Video</span>
      </div>
    `;

    button.addEventListener('click', () => {
      let modal = document.querySelector('[data-branch-login-video-modal="true"]') as HTMLElement | null;
      if (modal) {
        modal.style.display = 'flex';
        return;
      }

      modal = document.createElement('div');
      modal.setAttribute('data-branch-login-video-modal', 'true');
      modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(2,6,23,.78);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px)';
      modal.innerHTML = `
        <div style="width:min(560px,96vw);background:linear-gradient(145deg,#0f172a,#1e1b4b);border:1px solid rgba(168,85,247,.45);border-radius:18px;padding:24px;color:white;box-shadow:0 24px 80px rgba(0,0,0,.55)">
          <div style="display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:10px">
            <div>
              <div style="font-size:24px;font-weight:800">Branch Login Video</div>
              <div style="font-size:13px;color:#cbd5e1;margin-top:4px">Upload one video for the existing card on /branch-login only.</div>
            </div>
            <button data-close-video-modal="true" type="button" style="border:0;background:#334155;color:white;border-radius:10px;padding:8px 12px;cursor:pointer">✕</button>
          </div>
          <form data-video-upload-form="true" style="margin-top:20px">
            <input name="video" type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" style="display:block;width:100%;padding:14px;border-radius:12px;border:1px solid rgba(168,85,247,.35);background:#020617;color:#e2e8f0" />
            <button type="submit" style="width:100%;margin-top:14px;padding:13px;border:0;border-radius:12px;background:linear-gradient(90deg,#9333ea,#db2777);color:white;font-weight:800;cursor:pointer">Upload & Publish to Branch Login</button>
            <div data-video-upload-status="true" style="min-height:22px;margin-top:12px;font-size:13px;color:#c4b5fd"></div>
          </form>
        </div>`;
      document.body.appendChild(modal);

      modal.querySelector('[data-close-video-modal="true"]')?.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
      });

      const form = modal.querySelector('[data-video-upload-form="true"]') as HTMLFormElement | null;
      const status = modal.querySelector('[data-video-upload-status="true"]') as HTMLElement | null;
      form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const input = form.elements.namedItem('video') as HTMLInputElement | null;
        const file = input?.files?.[0];
        if (!file) {
          if (status) status.textContent = 'Please choose a video first.';
          return;
        }
        if (status) status.textContent = 'Uploading…';
        const data = new FormData();
        data.append('video', file);
        try {
          const response = await fetch('/api/admin/branch-login-video', { method: 'POST', body: data, credentials: 'include' });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.message || 'Upload failed');
          if (status) status.textContent = 'Published successfully. Branch Login video card has been updated.';
          form.reset();
        } catch (error: any) {
          if (status) status.textContent = error?.message || 'Upload failed.';
        }
      });
    });

    siteButton.parentElement.insertBefore(button, siteButton.nextSibling);
  };

  const syncBranchLoginVideo = async () => {
    if (window.location.pathname !== '/branch-login') return;
    try {
      const response = await fetch('/api/branch-login-video', { credentials: 'include' });
      if (!response.ok) return;
      const data = await response.json();
      if (!data?.url) return;
      const video = document.querySelector('video') as HTMLVideoElement | null;
      if (!video || video.dataset.adminVideoApplied === data.url) return;
      video.src = data.url;
      video.dataset.adminVideoApplied = data.url;
      video.load();
    } catch {}
  };

  const run = () => {
    addAdminUploader();
    void syncBranchLoginVideo();
  };

  run();
  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('popstate', run);
  setInterval(run, 1500);
}

installBranchLoginVideoManager();
createRoot(document.getElementById("root")!).render(<App />);
