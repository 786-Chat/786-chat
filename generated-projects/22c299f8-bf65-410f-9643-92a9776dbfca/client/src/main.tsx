import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Restore the original Replit-era branch-login 3D cube animation and geometry.
// Force cube size and face depth to match exactly at every breakpoint so the
// faces meet edge-to-edge instead of looking like separated floating panels.
const branchLoginCubeFix = document.createElement("style");
branchLoginCubeFix.dataset.branchLoginCubeFix = "true";
branchLoginCubeFix.textContent = `
  @keyframes cubeRotate {
    from { transform: rotateX(0deg) rotateY(-35deg); }
    to { transform: rotateX(0deg) rotateY(325deg); }
  }

  .cube-container {
    perspective-origin: center center !important;
  }

  .cube {
    position: relative !important;
    width: 128px !important;
    height: 128px !important;
    transform-style: preserve-3d !important;
    transform-origin: 50% 50% 0 !important;
    animation: cubeRotate 10s linear infinite !important;
    will-change: transform;
  }

  .cube-face {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    transform-style: preserve-3d !important;
    transform-origin: 50% 50% 0 !important;
    backface-visibility: hidden !important;
    -webkit-backface-visibility: hidden !important;
  }

  .cube-face.front  { transform: rotateY(0deg) translateZ(64px) !important; }
  .cube-face.back   { transform: rotateY(180deg) translateZ(64px) !important; }
  .cube-face.right  { transform: rotateY(90deg) translateZ(64px) !important; }
  .cube-face.left   { transform: rotateY(-90deg) translateZ(64px) !important; }
  .cube-face.top    { transform: rotateX(90deg) translateZ(64px) !important; }
  .cube-face.bottom { transform: rotateX(-90deg) translateZ(64px) !important; }

  @media (min-width: 768px) {
    .cube {
      width: 160px !important;
      height: 160px !important;
    }
    .cube-face.front  { transform: rotateY(0deg) translateZ(80px) !important; }
    .cube-face.back   { transform: rotateY(180deg) translateZ(80px) !important; }
    .cube-face.right  { transform: rotateY(90deg) translateZ(80px) !important; }
    .cube-face.left   { transform: rotateY(-90deg) translateZ(80px) !important; }
    .cube-face.top    { transform: rotateX(90deg) translateZ(80px) !important; }
    .cube-face.bottom { transform: rotateX(-90deg) translateZ(80px) !important; }
  }

  @media (min-width: 1024px) {
    .cube {
      width: 192px !important;
      height: 192px !important;
    }
    .cube-face.front  { transform: rotateY(0deg) translateZ(96px) !important; }
    .cube-face.back   { transform: rotateY(180deg) translateZ(96px) !important; }
    .cube-face.right  { transform: rotateY(90deg) translateZ(96px) !important; }
    .cube-face.left   { transform: rotateY(-90deg) translateZ(96px) !important; }
    .cube-face.top    { transform: rotateX(90deg) translateZ(96px) !important; }
    .cube-face.bottom { transform: rotateX(-90deg) translateZ(96px) !important; }
  }
`;
document.head.appendChild(branchLoginCubeFix);

createRoot(document.getElementById("root")!).render(<App />);

// The imported Replit page contains four logo assets around the cube. During
// migration the opposite faces ended up with different assets, so at some
// rotation angles two Food Hygiene panels appeared together. Keep the original
// visible pair (front + right) and mirror those onto their opposite faces. This
// recreates the original alternating Food Safety crest / Hygiene Rating box at
// every rotation angle without changing the login page layout or assets.
const restoreCubeFaceArtwork = () => {
  const front = document.querySelector<HTMLImageElement>(".cube-face.front img");
  const right = document.querySelector<HTMLImageElement>(".cube-face.right img");
  const back = document.querySelector<HTMLImageElement>(".cube-face.back img");
  const left = document.querySelector<HTMLImageElement>(".cube-face.left img");
  const top = document.querySelector<HTMLImageElement>(".cube-face.top img");
  const bottom = document.querySelector<HTMLImageElement>(".cube-face.bottom img");
  if (!front || !right || !back || !left || !top || !bottom) return false;

  back.src = front.src;
  left.src = right.src;
  top.src = front.src;
  bottom.src = right.src;
  return true;
};

let cubeRestoreAttempts = 0;
const cubeRestoreTimer = window.setInterval(() => {
  cubeRestoreAttempts += 1;
  if (restoreCubeFaceArtwork() || cubeRestoreAttempts > 40) {
    window.clearInterval(cubeRestoreTimer);
  }
}, 100);
