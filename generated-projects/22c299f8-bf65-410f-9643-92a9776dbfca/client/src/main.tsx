import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

function removeBranchDashboardMarketingVideo() {
  const removeVideoCard = () => {
    if (window.location.pathname !== "/branch-dashboard") return;

    document.querySelectorAll("video").forEach((video) => {
      const src = video.getAttribute("src") || "";
      if (!src.includes("branch-video-2.mp4")) return;

      let node: HTMLElement | null = video as HTMLElement;
      while (node && node.parentElement && node.parentElement !== document.body) {
        if ((node.textContent || "").includes("Smart Pest Monitoring")) {
          node.remove();
          return;
        }
        node = node.parentElement;
      }

      video.remove();
    });
  };

  removeVideoCard();
  const observer = new MutationObserver(removeVideoCard);
  observer.observe(document.body, { childList: true, subtree: true });
}

removeBranchDashboardMarketingVideo();
createRoot(document.getElementById("root")!).render(<App />);
