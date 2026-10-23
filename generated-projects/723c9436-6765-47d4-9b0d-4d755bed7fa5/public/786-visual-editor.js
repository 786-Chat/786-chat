(() => {
  const BRIDGE_VERSION = "786_STUDIO_V2";
  window.__786_VISUAL_EDITOR_VERSION__ = BRIDGE_VERSION;
  const initialState = {"order":[],"hidden":[],"duplicates":[],"styles":{},"textBlocks":[],"elements":[]};
  const allowedParent = (origin) =>
    origin === "https://786.chat" || /^https:\/\/[^/]+\.vercel\.app$/.test(origin);
  let enabled = false;
  let state = initialState;
  const originalStyles = new WeakMap();
  const controlledStyleProperties = [
    "backgroundColor", "backgroundImage", "color", "borderColor", "borderWidth", "borderStyle",
    "borderRadius", "padding", "margin", "fontFamily", "fontSize", "fontWeight", "fontStyle",
    "textDecoration", "textAlign", "lineHeight", "letterSpacing", "textTransform", "textShadow"
  ];

  const scrollbarStyle = document.createElement("style");
  scrollbarStyle.textContent =
    "html,body{scrollbar-width:none;-ms-overflow-style:none}" +
    "html::-webkit-scrollbar,body::-webkit-scrollbar,*::-webkit-scrollbar{display:none;width:0;height:0}";
  document.head.appendChild(scrollbarStyle);

  const googleFontNames = new Map([
    ["Inter", "Inter:wght@400;500;600;700;800;900"],
    ["DM Sans", "DM+Sans:wght@400;500;600;700"],
    ["Space Grotesk", "Space+Grotesk:wght@400;500;600;700"],
    ["Playfair Display", "Playfair+Display:wght@400;600;700;800;900"],
    ["Bebas Neue", "Bebas+Neue"],
    ["Oswald", "Oswald:wght@400;500;600;700"],
    ["Montserrat", "Montserrat:wght@400;500;600;700;800;900"],
    ["Poppins", "Poppins:wght@400;500;600;700;800;900"],
    ["Lora", "Lora:wght@400;500;600;700"],
    ["Pacifico", "Pacifico"],
    ["Dancing Script", "Dancing+Script:wght@400;500;600;700"],
    ["Caveat", "Caveat:wght@400;500;600;700"],
    ["Lobster", "Lobster"],
    ["Cinzel", "Cinzel:wght@400;500;600;700;800;900"],
    ["Righteous", "Righteous"],
    ["Bangers", "Bangers"],
    ["Press Start 2P", "Press+Start+2P"],
    ["Permanent Marker", "Permanent+Marker"],
    ["Great Vibes", "Great+Vibes"],
    ["Archivo Black", "Archivo+Black"]
  ]);

  const ensureFonts = (next) => {
    const families = new Set();
    for (const style of Object.values(next.styles || {})) {
      if (style?.fontFamily) families.add(String(style.fontFamily).split(",")[0].replace(/['"]/g, "").trim());
    }
    for (const block of next.textBlocks || []) {
      if (block?.style?.fontFamily) families.add(String(block.style.fontFamily).split(",")[0].replace(/['"]/g, "").trim());
    }
    const requested = Array.from(families).flatMap((family) => {
      const query = googleFontNames.get(family);
      return query ? [query] : [];
    });
    if (!requested.length) return;
    const key = requested.sort().join("|");
    const id = "786-studio-google-fonts";
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    const href = "https://fonts.googleapis.com/css2?" + requested.map((item) => "family=" + item).join("&") + "&display=swap";
    if (link.dataset.key !== key) {
      link.dataset.key = key;
      link.href = href;
    }
  };

  const candidates = () => Array.from(document.querySelectorAll(
    "[data-786-section-id], main > section, main > article, main > header, main > div"
  )).filter((element) => element.dataset.editor786StudioGenerated !== "true");

  const ensureIds = () => candidates().map((element, index) => {
    if (!element.dataset.editor786Id) {
      element.dataset.editor786Id =
        element.getAttribute("data-786-section-id") ||
        `section-${index + 1}`;
    }
    if (!originalStyles.has(element)) {
      originalStyles.set(element, Object.fromEntries(
        controlledStyleProperties.map((property) => [property, element.style[property] || ""])
      ));
    }
    return element;
  });

  const label = (element, index) => {
    const heading = element.querySelector("h1,h2,h3");
    const text = (heading?.textContent || element.getAttribute("aria-label") || "").trim();
    return text.slice(0, 60) || `Section ${index + 1}`;
  };

  const describe = () => ensureIds().map((element, index) => ({
    id: element.dataset.editor786Id,
    label: label(element, index),
    hidden: element.style.display === "none"
  }));

  const applyStyle = (element, style = {}) => {
    const px = (value) => Number.isFinite(value) ? `${value}px` : "";
    const original = originalStyles.get(element) || {};
    for (const property of controlledStyleProperties) {
      element.style[property] = original[property] || "";
    }
    if (style.backgroundColor) element.style.backgroundColor = style.backgroundColor;
    if (style.backgroundImage) element.style.backgroundImage = style.backgroundImage;
    if (style.color) element.style.color = style.color;
    if (style.borderColor) element.style.borderColor = style.borderColor;
    if (style.fontFamily) element.style.fontFamily = style.fontFamily;
    if (style.fontWeight !== undefined) element.style.fontWeight = String(style.fontWeight);
    if (style.fontStyle) element.style.fontStyle = style.fontStyle;
    if (style.textDecoration) element.style.textDecoration = style.textDecoration;
    if (style.textAlign) element.style.textAlign = style.textAlign;
    if (style.lineHeight !== undefined) element.style.lineHeight = String(style.lineHeight);
    if (style.letterSpacing !== undefined) element.style.letterSpacing = px(style.letterSpacing);
    if (style.textTransform) element.style.textTransform = style.textTransform;
    if (style.textShadow) element.style.textShadow = style.textShadow;
    if (style.borderWidth !== undefined) {
      element.style.borderWidth = px(style.borderWidth);
      element.style.borderStyle = style.borderWidth ? "solid" : "";
    }
    if (style.borderRadius !== undefined) element.style.borderRadius = px(style.borderRadius);
    if (style.padding !== undefined) element.style.padding = px(style.padding);
    if (style.margin !== undefined) element.style.margin = px(style.margin);
    if (style.fontSize !== undefined) element.style.fontSize = px(style.fontSize);
  };

  const sectionMap = () => new Map(ensureIds().map((element) => [element.dataset.editor786Id, element]));
  const fallbackHost = () => document.querySelector("main") || document.body;

  const applyTextEffect = (node, effect, colour) => {
    node.style.textShadow = "";
    node.style.webkitTextStroke = "";
    node.style.backgroundImage = "";
    node.style.backgroundClip = "";
    node.style.webkitBackgroundClip = "";
    node.style.webkitTextFillColor = "";
    if (effect === "shadow") {
      node.style.textShadow = "3px 4px 0 rgba(15,23,42,.25)";
    } else if (effect === "outline") {
      node.style.webkitTextStroke = "1px currentColor";
      node.style.textShadow = "2px 2px 0 rgba(255,255,255,.25)";
    } else if (effect === "glow") {
      node.style.textShadow = "0 0 8px currentColor,0 0 20px currentColor";
    } else if (effect === "neon") {
      node.style.textShadow = "0 0 4px #fff,0 0 10px currentColor,0 0 24px currentColor";
    } else if (effect === "gradient") {
      node.style.backgroundImage = "linear-gradient(90deg,#7c3aed,#06b6d4,#f59e0b)";
      node.style.backgroundClip = "text";
      node.style.webkitBackgroundClip = "text";
      node.style.webkitTextFillColor = "transparent";
    } else if (effect === "threeD") {
      node.style.textShadow = "1px 1px 0 #fff,2px 2px 0 #cbd5e1,3px 3px 0 #94a3b8,5px 7px 14px rgba(15,23,42,.28)";
    }
    if (colour && effect !== "gradient") node.style.color = colour;
  };

  const renderTextBlocks = (next) => {
    const map = sectionMap();
    for (const block of next.textBlocks || []) {
      const host = map.get(block.targetId) || fallbackHost();
      const node = document.createElement("div");
      node.dataset.editor786StudioGenerated = "true";
      node.dataset.editor786TextId = block.id;
      node.dataset.editor786TargetId = block.targetId || "";
      node.textContent = block.text;
      node.style.boxSizing = "border-box";
      node.style.display = "block";
      node.style.width = "fit-content";
      node.style.maxWidth = "100%";
      node.style.margin = "16px auto";
      node.style.padding = "8px 12px";
      node.style.position = "relative";
      node.style.zIndex = "2";
      node.style.whiteSpace = "pre-wrap";
      node.style.wordBreak = "break-word";
      node.style.fontFamily = block.style?.fontFamily || "inherit";
      if (block.style?.fontSize !== undefined) node.style.fontSize = block.style.fontSize + "px";
      if (block.style?.fontWeight !== undefined) node.style.fontWeight = String(block.style.fontWeight);
      if (block.style?.fontStyle) node.style.fontStyle = block.style.fontStyle;
      if (block.style?.textAlign) node.style.textAlign = block.style.textAlign;
      if (block.style?.lineHeight !== undefined) node.style.lineHeight = String(block.style.lineHeight);
      if (block.style?.letterSpacing !== undefined) node.style.letterSpacing = block.style.letterSpacing + "px";
      if (block.style?.textTransform) node.style.textTransform = block.style.textTransform;
      applyTextEffect(node, block.style?.effect || "none", block.style?.color);
      host.appendChild(node);
    }
  };

  const appendText = (parent, text, style = {}) => {
    const span = document.createElement("span");
    span.textContent = text;
    Object.assign(span.style, style);
    parent.appendChild(span);
    return span;
  };

  const renderElementContent = (node, item) => {
    node.replaceChildren();
    const colour = item.color || "#7c3aed";
    if (item.kind === "shape") {
      if (item.preset === "line") {
        node.style.height = "4px";
        node.style.background = colour;
        return;
      }
      if (item.preset === "triangle") {
        node.style.width = "0";
        node.style.height = "0";
        node.style.borderLeft = "55px solid transparent";
        node.style.borderRight = "55px solid transparent";
        node.style.borderBottom = "95px solid " + colour;
        return;
      }
      node.style.background = colour;
      if (item.preset === "circle") node.style.borderRadius = "9999px";
      if (item.preset === "rounded") node.style.borderRadius = "24px";
      if (item.preset === "pill") node.style.borderRadius = "9999px";
      if (item.preset === "star") {
        node.style.clipPath = "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)";
      }
      if (item.preset === "diamond") {
        node.style.transform += " rotate(45deg)";
      }
      return;
    }

    if (item.kind === "frame") {
      node.style.border = "4px solid " + colour;
      node.style.background = "linear-gradient(135deg,rgba(124,58,237,.08),rgba(6,182,212,.08))";
      node.style.overflow = "hidden";
      if (item.preset === "circle-frame") node.style.borderRadius = "9999px";
      if (item.preset === "rounded-frame") node.style.borderRadius = "24px";
      if (item.preset === "arch-frame") node.style.borderRadius = "9999px 9999px 20px 20px";
      if (item.preset === "phone-frame") {
        node.style.borderRadius = "32px";
        node.style.borderWidth = "8px";
      }
      if (item.source) {
        const img = document.createElement("img");
        img.src = item.source;
        img.alt = item.label || "Frame image";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        node.appendChild(img);
      } else {
        appendText(node, item.label || "Frame", {
          color: "#64748b",
          fontSize: "13px",
          fontWeight: "700",
        });
      }
      return;
    }

    if (item.kind === "graphic") {
      const graphics = {
        star: "★",
        sparkle: "✦",
        heart: "♥",
        check: "✓",
        arrow: "→",
        quote: "“”",
        burst: "✹",
        number: "1"
      };
      appendText(node, graphics[item.preset] || "✦", {
        color: colour,
        fontSize: Math.max(28, Math.min(100, (item.height || 80) * .72)) + "px",
        fontWeight: "900",
        lineHeight: "1",
      });
      return;
    }

    if (item.kind === "form") {
      const shell = document.createElement("div");
      shell.style.width = "100%";
      shell.style.display = "grid";
      shell.style.gap = "8px";
      shell.style.padding = "12px";
      shell.style.border = "1px solid #cbd5e1";
      shell.style.borderRadius = "14px";
      shell.style.background = "#fff";
      appendText(shell, item.preset === "checklist" ? "Checklist" : "Contact form", {
        color: "#0f172a",
        fontWeight: "800",
      });
      if (item.preset === "checklist") {
        ["First item", "Second item", "Third item"].forEach((text) => {
          const row = document.createElement("div");
          row.style.color = "#334155";
          row.textContent = "☐ " + text;
          shell.appendChild(row);
        });
      } else {
        ["Name", "Email", "Message"].forEach((placeholder, index) => {
          const input = document.createElement(index === 2 ? "textarea" : "input");
          input.placeholder = placeholder;
          input.style.border = "1px solid #cbd5e1";
          input.style.borderRadius = "8px";
          input.style.padding = "8px";
          input.style.width = "100%";
          shell.appendChild(input);
        });
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Submit";
        button.style.background = colour;
        button.style.color = "#fff";
        button.style.padding = "9px 12px";
        button.style.borderRadius = "8px";
        shell.appendChild(button);
      }
      node.appendChild(shell);
      return;
    }

    if (item.kind === "table") {
      const table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      [["Item", "Qty", "Total"], ["Service A", "1", "£25"], ["Service B", "2", "£40"]].forEach((row, rowIndex) => {
        const tr = document.createElement("tr");
        row.forEach((text) => {
          const cell = document.createElement(rowIndex === 0 ? "th" : "td");
          cell.textContent = text;
          cell.style.border = "1px solid #cbd5e1";
          cell.style.padding = "8px";
          cell.style.textAlign = "left";
          tr.appendChild(cell);
        });
        table.appendChild(tr);
      });
      node.appendChild(table);
      return;
    }

    if (item.kind === "chart") {
      const chart = document.createElement("div");
      chart.style.width = "100%";
      chart.style.height = "100%";
      chart.style.minHeight = "110px";
      chart.style.display = "flex";
      chart.style.alignItems = "end";
      chart.style.justifyContent = "space-around";
      chart.style.gap = "10px";
      [45, 78, 58, 92, 66].forEach((height, index) => {
        const bar = document.createElement("div");
        bar.style.width = "14%";
        bar.style.height = height + "%";
        bar.style.borderRadius = "8px 8px 0 0";
        bar.style.background = index % 2 ? "#06b6d4" : colour;
        chart.appendChild(bar);
      });
      node.appendChild(chart);
      return;
    }

    if (item.kind === "mockup") {
      const shell = document.createElement("div");
      shell.style.width = "100%";
      shell.style.height = "100%";
      shell.style.minHeight = "120px";
      shell.style.border = item.preset === "phone" ? "9px solid #111827" : "6px solid #1f2937";
      shell.style.borderRadius = item.preset === "phone" ? "28px" : "12px";
      shell.style.background = "linear-gradient(135deg,#ede9fe,#cffafe)";
      shell.style.display = "grid";
      shell.style.placeItems = "center";
      appendText(shell, item.preset === "phone" ? "Mobile preview" : item.preset === "laptop" ? "Laptop preview" : "Card mockup", {
        color: "#334155",
        fontWeight: "800",
      });
      node.appendChild(shell);
      return;
    }

    if (item.kind === "threeD") {
      node.style.borderRadius = item.preset === "orb" ? "9999px" : "24px";
      node.style.background = item.preset === "orb"
        ? "radial-gradient(circle at 30% 25%,#fff 0 8%,#67e8f9 22%,#7c3aed 58%,#111827 100%)"
        : "linear-gradient(135deg,#a78bfa,#22d3ee 48%,#f59e0b)";
      node.style.boxShadow = "0 22px 45px rgba(15,23,42,.3), inset 0 1px 18px rgba(255,255,255,.35)";
      node.style.transform += " perspective(500px) rotateX(8deg) rotateY(-12deg)";
      return;
    }

    if (item.kind === "image" && item.source) {
      const img = document.createElement("img");
      img.src = item.source;
      img.alt = item.label || "Uploaded design image";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.style.borderRadius = "12px";
      node.appendChild(img);
      return;
    }

    if (item.kind === "video" && item.source) {
      const video = document.createElement("video");
      video.src = item.source;
      video.controls = true;
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.objectFit = "cover";
      video.style.borderRadius = "12px";
      node.appendChild(video);
      return;
    }

    appendText(node, item.label || item.preset, {
      color: colour,
      fontWeight: "800",
    });
  };

  const renderElements = (next) => {
    const map = sectionMap();
    for (const item of next.elements || []) {
      const host = map.get(item.targetId) || fallbackHost();
      const node = document.createElement("div");
      node.dataset.editor786StudioGenerated = "true";
      node.dataset.editor786ElementId = item.id;
      node.dataset.editor786TargetId = item.targetId || "";
      node.style.boxSizing = "border-box";
      node.style.display = "flex";
      node.style.alignItems = "center";
      node.style.justifyContent = "center";
      node.style.position = "relative";
      node.style.zIndex = "2";
      node.style.margin = "16px auto";
      node.style.width = (item.width || (item.kind === "shape" ? 120 : 240)) + "px";
      node.style.height = (item.height || (item.kind === "shape" ? 120 : 160)) + "px";
      node.style.maxWidth = "100%";
      node.style.opacity = String(item.opacity ?? 1);
      node.style.transform = "rotate(" + (item.rotation || 0) + "deg)";
      renderElementContent(node, item);
      host.appendChild(node);
    }
  };

  const apply = (next) => {
    state = next || initialState;
    ensureFonts(state);
    for (const generated of document.querySelectorAll("[data-editor786-studio-generated='true']")) {
      generated.remove();
    }
    let elements = ensureIds();
    const desiredCloneIds = new Set((state.duplicates || []).map((item) => item.id));
    for (const clone of document.querySelectorAll("[data-editor786-clone='true']")) {
      if (!desiredCloneIds.has(clone.dataset.editor786Id)) clone.remove();
    }
    const byId = () => new Map(ensureIds().map((element) => [element.dataset.editor786Id, element]));
    for (const duplicate of state.duplicates || []) {
      if (document.querySelector(`[data-editor786-id="${CSS.escape(duplicate.id)}"]`)) continue;
      const source = byId().get(duplicate.sourceId);
      if (!source) continue;
      const clone = source.cloneNode(true);
      clone.dataset.editor786Id = duplicate.id;
      clone.dataset.editor786Clone = "true";
      source.after(clone);
    }
    elements = ensureIds();
    const map = new Map(elements.map((element) => [element.dataset.editor786Id, element]));
    const parent = elements[0]?.parentElement;
    if (parent) {
      for (const id of state.order || []) {
        const element = map.get(id);
        if (element) parent.appendChild(element);
      }
    }
    for (const element of ensureIds()) {
      const id = element.dataset.editor786Id;
      element.style.display = (state.hidden || []).includes(id) ? "none" : "";
      applyStyle(element, state.styles?.[id]);
      element.style.outline = enabled ? "1px dashed rgba(34,211,238,.45)" : "";
      element.style.outlineOffset = enabled ? "-2px" : "";
      element.style.cursor = enabled ? "pointer" : "";
    }
    renderTextBlocks(state);
    renderElements(state);
    window.parent.postMessage({ type: "786-editor:sections", sections: describe(), bridgeVersion: BRIDGE_VERSION }, "*");
  };

  document.addEventListener("click", (event) => {
    if (!enabled) return;
    const studioNode = event.target.closest("[data-editor786-text-id],[data-editor786-element-id]");
    if (studioNode) {
      event.preventDefault();
      event.stopPropagation();
      window.parent.postMessage({
        type: "786-editor:studio-selected",
        id: studioNode.dataset.editor786TextId || studioNode.dataset.editor786ElementId,
        kind: studioNode.dataset.editor786TextId ? "text" : "element",
        targetId: studioNode.dataset.editor786TargetId || ""
      }, "*");
      return;
    }
    const section = event.target.closest("[data-editor786-id]");
    if (!section) return;
    event.preventDefault();
    event.stopPropagation();
    window.parent.postMessage({
      type: "786-editor:selected",
      id: section.dataset.editor786Id
    }, "*");
  }, true);

  window.addEventListener("message", (event) => {
    if (!allowedParent(event.origin) || !event.data || typeof event.data !== "object") return;
    if (event.data.type === "786-editor:enable") {
      enabled = Boolean(event.data.enabled);
      apply(state);
    }
    if (event.data.type === "786-editor:apply") apply(event.data.state);
    if (event.data.type === "786-editor:version") {
      window.parent.postMessage({ type: "786-editor:version", bridgeVersion: BRIDGE_VERSION }, "*");
    }
  });

  const start = () => {
    apply(initialState);
    window.parent.postMessage({
      type: "786-editor:ready",
      sections: describe(),
      bridgeVersion: BRIDGE_VERSION
    }, "*");
  };
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", start, { once: true })
    : start();
})();