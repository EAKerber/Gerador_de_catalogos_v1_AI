(function (root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CatalogContextNavigation = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function planBreadcrumb(path, options = {}) {
    const entries = Array.isArray(path) ? path.filter(Boolean) : [];
    const visibleTail = Math.max(1, Number(options.visibleTail) || 2);
    if (entries.length <= visibleTail) return { hidden: [], visible: entries.slice() };
    return {
      hidden: entries.slice(0, -visibleTail),
      visible: entries.slice(-visibleTail)
    };
  }

  return Object.freeze({ planBreadcrumb });
});
