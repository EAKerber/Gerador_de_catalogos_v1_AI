(function () {
  "use strict";

  const CONTRACT_VERSION = "05.19.1";
  const COMMERCIAL_FIELDS = Object.freeze(["code", "package", "price"]);
  const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);

  function overriddenFields(entries, options = {}) {
    if (options.mode === "append" || options.bindingSync === true) return [];
    const first = Array.isArray(entries) ? entries.find(Boolean) : null;
    const values = first?.values || first || {};
    return COMMERCIAL_FIELDS.filter(field => hasOwn(values, field));
  }

  function install() {
    return Boolean(window.CatalogDocumentStore);
  }

  window.CatalogTableBindingOverridesContract = Object.freeze({
    VERSION: CONTRACT_VERSION,
    COMMERCIAL_FIELDS,
    overriddenFields,
    install
  });

  install();
})();
