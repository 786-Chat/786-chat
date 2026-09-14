import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Restore the original Replit-era branch-login 3D cube animation and geometry.
// All six faces must share the exact same origin; otherwise absolutely positioned
// faces can retain different static positions and appear separated in the preview.
const branchLoginCubeFix = document.createElement("style");
branchLoginCubeFix.dataset.branchLoginCubeFix = "true";
branchLoginCubeFix.textContent = `
  @keyframes cubeRotate {
    from { transform: rotateX(15deg) rotateY(0deg); }
    to { transform: rotateX(15deg) rotateY(360deg); }
  }

  .cube {
    position: relative;
    transform-style: preserve-3d;
    transform-origin: center center;
    will-change: transform;
  }

  .cube-face {
    position: absolute;
    inset: 0;
    margin: 0;
    transform-style: preserve-3d;
    transform-origin: center center;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
`;
document.head.appendChild(branchLoginCubeFix);

createRoot(document.getElementById("root")!).render(<App />);
