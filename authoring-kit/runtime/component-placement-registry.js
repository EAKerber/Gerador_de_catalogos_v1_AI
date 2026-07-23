(function () {
  "use strict";

  const VERSION = "05.18.12.1";
  const clone = value => JSON.parse(JSON.stringify(value));

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

  window.CatalogComponentPlacements = Object.freeze({ VERSION, HINTS, hintFor, list, validate });
})();
