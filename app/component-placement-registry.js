(function () {
  "use strict";

  const VERSION = "05.18.12.1";
  const clone = value => JSON.parse(JSON.stringify(value));
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  const HINTS = Object.freeze({
    "catalog-header": Object.freeze({
      componentType: "catalog-header",
      scope: "page",
      strength: "probable",
      blockAnchor: "top",
      inlineSizing: "safe-area",
      collisionPolicy: "move-inward",
      fallback: "generic",
      reason: "Cabeçalhos normalmente iniciam a hierarquia editorial no topo da página."
    }),
    "catalog-footer": Object.freeze({
      componentType: "catalog-footer",
      scope: "page",
      strength: "probable",
      blockAnchor: "bottom",
      inlineSizing: "safe-area",
      collisionPolicy: "move-inward",
      fallback: "generic",
      reason: "Rodapés normalmente encerram a hierarquia editorial na base da página."
    })
  });

  function hintFor(type) {
    return HINTS[type] ? clone(HINTS[type]) : null;
  }

  function list() {
    return Object.values(HINTS).map(clone);
  }

  function overlaps(candidate, sibling, gap) {
    return !(
      candidate.x + candidate.width + gap <= sibling.frame.x
      || sibling.frame.x + sibling.frame.width + gap <= candidate.x
      || candidate.y + candidate.height + gap <= sibling.frame.y
      || sibling.frame.y + sibling.frame.height + gap <= candidate.y
    );
  }

  function probableFrame(store, type, sourceFrame, parentId = null) {
    const hint = hintFor(type);
    if (!hint || parentId || hint.scope !== "page") return null;

    const page = store.getPage();
    const width = number(page?.size?.width, 794);
    const height = number(page?.size?.height, 1123);
    const margin = Math.max(0, number(page?.grid?.safeMargin, 24));
    const gap = 12;
    const safeWidth = Math.max(1, width - margin * 2);
    const safeHeight = Math.max(1, height - margin * 2);
    const frameWidth = hint.inlineSizing === "safe-area"
      ? safeWidth
      : Math.min(number(sourceFrame?.width, 100), safeWidth);
    const frameHeight = Math.min(number(sourceFrame?.height, 100), safeHeight);
    const x = margin + Math.max(0, Math.round((safeWidth - frameWidth) / 2));
    const firstY = hint.blockAnchor === "bottom" ? height - margin - frameHeight : margin;
    const step = Math.max(4, number(page?.grid?.unit, 4) * 2);
    const minimumY = margin;
    const maximumY = Math.max(minimumY, height - margin - frameHeight);
    const siblings = store.getContextChildren(null).filter(component => component.layoutItem?.overlay !== true);
    const direction = hint.blockAnchor === "bottom" ? -1 : 1;

    for (let y = firstY; y >= minimumY && y <= maximumY; y += step * direction) {
      const candidate = { x, y: Math.round(y), width: frameWidth, height: frameHeight };
      if (!siblings.some(sibling => overlaps(candidate, sibling, gap))) return candidate;
    }
    return null;
  }

  function validate(registry = window.CATALOG_COMPONENT_REGISTRY || {}) {
    const allowedAnchors = new Set(["top", "bottom"]);
    const allowedSizing = new Set(["safe-area", "default"]);
    const unknown = [];
    const invalid = [];
    Object.entries(HINTS).forEach(([type, hint]) => {
      if (!registry[type]) unknown.push(type);
      if (hint.componentType !== type || hint.scope !== "page" || hint.strength !== "probable" || !allowedAnchors.has(hint.blockAnchor) || !allowedSizing.has(hint.inlineSizing) || hint.collisionPolicy !== "move-inward" || hint.fallback !== "generic") invalid.push(type);
    });
    return { ok: !unknown.length && !invalid.length, unknown, invalid, count: Object.keys(HINTS).length };
  }

  window.CatalogComponentPlacements = Object.freeze({ VERSION, HINTS, hintFor, list, probableFrame, validate });
})();
