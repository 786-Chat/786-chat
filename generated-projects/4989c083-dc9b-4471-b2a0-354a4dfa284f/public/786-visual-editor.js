(() => {
  const initialState = {"order":[],"hidden":[],"duplicates":[],"styles":{}};
  const allowedParent = (origin) =>
    origin === "https://786.chat" || /^https:\/\/[^/]+\.vercel\.app$/.test(origin);
  let enabled = false;
  let state = initialState;

  const candidates = () => Array.from(document.querySelectorAll(
    "[data-786-section-id], main > section, main > article, main > header, main > div"
  ));
  const ensureIds = () => candidates().map((element, index) => {
    if (!element.dataset.editor786Id) {
      element.dataset.editor786Id =
        element.getAttribute("data-786-section-id") ||
        `section-${index + 1}`;
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
})();