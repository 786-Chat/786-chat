import { useEffect } from "react";
import BranchDashboard from "@/pages/BranchDashboard";

function moveMonitoringVideoIntoCardGrid() {
  const video = document.querySelector<HTMLVideoElement>('video[src*="branch-video-2.mp4"]');
  if (!video) return false;

  const videoCard = video.parentElement as HTMLElement | null;
  const videoWrapper = videoCard?.parentElement as HTMLElement | null;
  if (!videoCard || !videoWrapper) return false;

  const headings = Array.from(document.querySelectorAll<HTMLElement>('h1,h2,h3,h4'));
  const documentationHeading = headings.find((node) => node.textContent?.trim() === 'Documentation');
  if (!documentationHeading) return false;

  const documentationCard = documentationHeading.closest<HTMLElement>('[class*="bg-slate-800/50"]');
  const cardGrid = documentationCard?.parentElement as HTMLElement | null;
  if (!documentationCard || !cardGrid) return false;

  if (videoWrapper.parentElement === cardGrid && videoWrapper.previousElementSibling === documentationCard) {
    return true;
  }

  videoWrapper.className = 'w-full min-w-0';
  videoCard.classList.remove('max-w-sm');
  videoCard.classList.add('w-full', 'h-full');
  videoCard.style.maxWidth = 'none';

  video.classList.add('w-full');
  video.style.maxHeight = '220px';
  video.style.objectFit = 'cover';

  documentationCard.insertAdjacentElement('afterend', videoWrapper);
  return true;
}

export default function BranchDashboardLayoutFix() {
  useEffect(() => {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      const moved = moveMonitoringVideoIntoCardGrid();
      if (moved || attempts > 40) window.clearInterval(timer);
    }, 150);

    const observer = new MutationObserver(() => {
      moveMonitoringVideoIntoCardGrid();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearInterval(timer);
      observer.disconnect();
    };
  }, []);

  return <BranchDashboard />;
}
