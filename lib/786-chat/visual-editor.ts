export type VisualEditorStyle = {
  backgroundColor?: string
  color?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number
  margin?: number
  fontFamily?: string
  fontSize?: number
}

export type VisualEditorDuplicate = {
  sourceId: string
  id: string
}

export type VisualEditorState = {
  order: string[]
  hidden: string[]
  duplicates: VisualEditorDuplicate[]
  styles: Record<string, VisualEditorStyle>
}

export const EMPTY_VISUAL_EDITOR_STATE: VisualEditorState = {
  order: [],
  hidden: [],
  duplicates: [],
  styles: {},
}

const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,119}$/i
const SAFE_COLOUR = /^(?:#[0-9a-f]{3,8}|rgba?\([0-9.,% ]+\)|hsla?\([0-9.,% ]+\)|transparent)$/i
const SAFE_FONT = /^[a-z0-9 ,"'-]{1,120}$/i

function uniqueIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.filter((item): item is string =>
    typeof item === "string" && SAFE_ID.test(item),
  ))).slice(0, 200)
}

function boundedNumber(value: unknown, min: number, max: number) {
  const number = typeof value === "number" ? value : Number.NaN
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : undefined
}

function safeStyle(value: unknown): VisualEditorStyle {
  if (!value || typeof value !== "object") return {}
  const source = value as Record<string, unknown>
  const result: VisualEditorStyle = {}
  for (const key of ["backgroundColor", "color", "borderColor"] as const) {
    if (typeof source[key] === "string" && SAFE_COLOUR.test(source[key])) {
      result[key] = source[key]
    }
  }
  if (typeof source.fontFamily === "string" && SAFE_FONT.test(source.fontFamily)) {
    result.fontFamily = source.fontFamily
  }
  result.borderWidth = boundedNumber(source.borderWidth, 0, 20)
  result.borderRadius = boundedNumber(source.borderRadius, 0, 160)
  result.padding = boundedNumber(source.padding, 0, 240)
  result.margin = boundedNumber(source.margin, 0, 240)
  result.fontSize = boundedNumber(source.fontSize, 8, 160)
  return Object.fromEntries(
    Object.entries(result).filter(([, item]) => item !== undefined),
  ) as VisualEditorStyle
}

export function normalizeVisualEditorState(value: unknown): VisualEditorState {
  const source = value && typeof value === "object"
    ? value as Record<string, unknown>
    : {}
  const styles: Record<string, VisualEditorStyle> = {}
  if (source.styles && typeof source.styles === "object") {
    for (const [id, style] of Object.entries(source.styles as Record<string, unknown>)) {
      if (SAFE_ID.test(id)) styles[id] = safeStyle(style)
    }
  }
  const duplicates = Array.isArray(source.duplicates)
    ? source.duplicates.flatMap((item) => {
        if (!item || typeof item !== "object") return []
        const duplicate = item as Record<string, unknown>
        return typeof duplicate.sourceId === "string" &&
          typeof duplicate.id === "string" &&
          SAFE_ID.test(duplicate.sourceId) &&
          SAFE_ID.test(duplicate.id)
          ? [{ sourceId: duplicate.sourceId, id: duplicate.id }]
          : []
      }).slice(0, 100)
    : []
  return {
    order: uniqueIds(source.order),
    hidden: uniqueIds(source.hidden),
    duplicates,
    styles,
  }
}

function bridgeSource(state: VisualEditorState) {
  const initialState = JSON.stringify(state).replaceAll("<", "\\u003c")
  return `(() => {
  const initialState = ${initialState};
  const allowedParent = (origin) =>
    origin === "https://786.chat" || /^https:\\/\\/[^/]+\\.vercel\\.app$/.test(origin);
  let enabled = false;
  let state = initialState;
  const originalStyles = new WeakMap();
  const controlledStyleProperties = [
    "backgroundColor", "color", "borderColor", "borderWidth", "borderStyle",
    "borderRadius", "padding", "margin", "fontFamily", "fontSize"
  ];

  const scrollbarStyle = document.createElement("style");
  scrollbarStyle.textContent =
    "html,body{scrollbar-width:none;-ms-overflow-style:none}" +
    "html::-webkit-scrollbar,body::-webkit-scrollbar,*::-webkit-scrollbar{display:none;width:0;height:0}";
  document.head.appendChild(scrollbarStyle);

  const candidates = () => Array.from(document.querySelectorAll(
    "[data-786-section-id], main > section, main > article, main > header, main > div"
  ));
  const ensureIds = () => candidates().map((element, index) => {
    if (!element.dataset.editor786Id) {
      element.dataset.editor786Id =
        element.getAttribute("data-786-section-id") ||
        \`section-\${index + 1}\`;
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
    return text.slice(0, 60) || \`Section \${index + 1}\`;
  };
  const describe = () => ensureIds().map((element, index) => ({
    id: element.dataset.editor786Id,
    label: label(element, index),
    hidden: element.style.display === "none"
  }));
  const applyStyle = (element, style = {}) => {
    const px = (value) => Number.isFinite(value) ? \`\${value}px\` : "";
    const original = originalStyles.get(element) || {};
    for (const property of controlledStyleProperties) {
      element.style[property] = original[property] || "";
    }
    if (style.backgroundColor) element.style.backgroundColor = style.backgroundColor;
    if (style.color) element.style.color = style.color;
    if (style.borderColor) element.style.borderColor = style.borderColor;
    if (style.fontFamily) element.style.fontFamily = style.fontFamily;
    if (style.borderWidth !== undefined) {
      element.style.borderWidth = px(style.borderWidth);
      element.style.borderStyle = style.borderWidth ? "solid" : "";
    }
    if (style.borderRadius !== undefined) element.style.borderRadius = px(style.borderRadius);
    if (style.padding !== undefined) element.style.padding = px(style.padding);
    if (style.margin !== undefined) element.style.margin = px(style.margin);
    if (style.fontSize !== undefined) element.style.fontSize = px(style.fontSize);
  };
  const apply = (next) => {
    state = next || initialState;
    let elements = ensureIds();
    const desiredCloneIds = new Set((state.duplicates || []).map((item) => item.id));
    for (const clone of document.querySelectorAll("[data-editor786-clone='true']")) {
      if (!desiredCloneIds.has(clone.dataset.editor786Id)) clone.remove();
    }
    const byId = () => new Map(ensureIds().map((element) => [element.dataset.editor786Id, element]));
    for (const duplicate of state.duplicates || []) {
      if (document.querySelector(\`[data-editor786-id="\${CSS.escape(duplicate.id)}"]\`)) continue;
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
    window.parent.postMessage({ type: "786-editor:sections", sections: describe() }, "*");
  };
  document.addEventListener("click", (event) => {
    if (!enabled) return;
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
  });
  const start = () => {
    apply(initialState);
    window.parent.postMessage({ type: "786-editor:ready", sections: describe() }, "*");
  };
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", start, { once: true })
    : start();
})();`
}

function injectScriptTag(layout: string) {
  if (layout.includes("/786-visual-editor.js")) return layout
  const tag = '<script src="/786-visual-editor.js" defer></script>'
  if (layout.includes("</body>")) return layout.replace("</body>", `${tag}</body>`)
  return layout
}

export function injectVisualEditorFiles(
  files: Record<string, string>,
  value: unknown = EMPTY_VISUAL_EDITOR_STATE,
) {
  const state = normalizeVisualEditorState(value)
  const next = { ...files }
  next["public/786-visual-editor.js"] = bridgeSource(state)
  if (typeof next["app/layout.tsx"] === "string") {
    next["app/layout.tsx"] = injectScriptTag(next["app/layout.tsx"])
  } else if (typeof next["app/layout.jsx"] === "string") {
    next["app/layout.jsx"] = injectScriptTag(next["app/layout.jsx"])
  }
  return next
}
