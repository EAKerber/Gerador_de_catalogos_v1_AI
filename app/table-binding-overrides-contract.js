(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.audit.1";
  const COMMERCIAL_FIELDS = Object.freeze(["code", "package", "price"]);
  const clone = value => JSON.parse(JSON.stringify(value));
  const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);

  function overriddenFields(entries, options = {}) {
    if (options.mode === "append") return [];
    const first = Array.isArray(entries) ? entries.find(Boolean) : null;
    const values = first?.values || first || {};
    return COMMERCIAL_FIELDS.filter(field => hasOwn(values, field));
  }

  function install() {
    const BaseStore = window.CatalogDocumentStore;
    if (!BaseStore) return false;
    if (BaseStore.__tableBindingOverridesContractVersion === CONTRACT_VERSION) return true;

    class TableBindingOverridesStore extends BaseStore {
      replaceTableRowsBulk(componentId, entries = [], options = {}) {
        const table = this.findComponent(componentId)?.component;
        const card = table?.type === "data-table" ? this.getProductCard?.(table.id) : null;
        const fields = card?.binding?.productId ? overriddenFields(entries, options) : [];
        if (!fields.length) return super.replaceTableRowsBulk(componentId, entries, options);

        card.binding ||= { productId: null, templateId: null, overrides: {} };
        card.binding.overrides ||= {};
        const previous = clone(card.binding.overrides);
        fields.forEach(field => { card.binding.overrides[field] = true; });
        try {
          return super.replaceTableRowsBulk(componentId, entries, options);
        } catch (error) {
          card.binding.overrides = previous;
          throw error;
        }
      }
    }

    Object.defineProperty(TableBindingOverridesStore, "__tableBindingOverridesContractVersion", { value: CONTRACT_VERSION });
    window.CatalogDocumentStore = TableBindingOverridesStore;
    return true;
  }

  window.CatalogTableBindingOverridesContract = Object.freeze({
    VERSION: CONTRACT_VERSION,
    COMMERCIAL_FIELDS,
    overriddenFields,
    install
  });

  install();
})();
