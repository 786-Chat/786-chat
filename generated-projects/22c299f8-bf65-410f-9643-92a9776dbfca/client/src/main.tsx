import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Restore the original Replit-era branch-login 3D cube animation.
// BranchLogin uses `cubeRotate`, while the migrated stylesheet only retained
// the older `rotate` keyframes. Defining the missing animation here keeps the
// existing desktop/tablet/mobile layout intact and prevents the cube from
// freezing on an edge-on face.
const branchLoginCubeFix = document.createElement("style");
branchLoginCubeFix.dataset.branchLoginCubeFix = "true";
branchLoginCubeFix.textContent = `
  @keyframes cubeRotate {
    from { transform: rotateX(15deg) rotateY(0deg); }
    to { transform: rotateX(15deg) rotateY(360deg); }
  }

  .cube {
    transform-style: preserve-3d;
    will-change: transform;
  }

  .cube-face {
    transform-style: preserve-3d;
    backface-visibility: hidden;
  }
`;
document.head.appendChild(branchLoginCubeFix);

createRoot(document.getElementById("root")!).render(<App />);
