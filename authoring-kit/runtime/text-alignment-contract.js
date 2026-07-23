(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.2";
  const STORAGE_KEY = "catalogo-v1-editor-document";
  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);

  function normalizeLegacyFooterAlignment(source) {
    if (!source || typeof source !== "object" || Array.isArray(source)) return source;
    const next = clone(source);
    const visit = (component, parent = null) => {
      if (!component || typeof component !== "object") return;
      if (component.type === "text" && parent?.type === "footer-item") {
        component.props ||= {};
        const explicit = component.props.alignExplicit === true;
        if (!explicit && (!hasOwn(component.props, "align") || component.props.align === "start")) {
          component.props.align = "center";
        }
        if (!hasOwn(component.props, "alignExplicit")) component.props.alignExplicit = false;
      }
      (component.children || []).forEach(child => visit(child, component));
    };
    (next.pages || []).forEach(page => (page.children || []).forEach(component => visit(component)));
    return next;
  }

  function installRegistryDefaults(registry) {
    if (!registry?.text || !registry?.["footer-item"]) return false;
    registry.text.defaultProps = {
      ...(registry.text.defaultProps || {}),
      alignExplicit: registry.text.defaultProps?.alignExplicit === true
    };

    const footer = registry["footer-item"];
    if (footer.__textAlignmentDefaultsInstalled === true) return true;
    const original = footer.defaultChildren;
    footer.defaultChildren = function footerChildrenWithAlignment(component) {
      const descriptors = typeof original === "function" ? original(component) : clone(original || []);
      return descriptors.map(descriptor => descriptor.type === "text" ? {
        ...descriptor,
        props: {
          ...(descriptor.props || {}),
          align: "center",
          alignExplicit: false
        }
      } : descriptor);
    };
    Object.defineProperty(footer, "__textAlignmentDefaultsInstalled", { value: true });
    return true;
  }

  function installStoreContract() {
    const BaseStore = window.CatalogDocumentStore;
    if (!BaseStore || BaseStore.__textAlignmentContractVersion === CONTRACT_VERSION) return Boolean(BaseStore);

    class TextAlignmentDocumentStore extends BaseStore {
      constructor(initialState) {
        super(normalizeLegacyFooterAlignment(initialState));
      }

      analyzeDocument(document) {
        const analysis = super.analyzeDocument(normalizeLegacyFooterAlignment(document));
        if (analysis?.document) analysis.document = normalizeLegacyFooterAlignment(analysis.document);
        return analysis;
      }

      replaceDocument(document, options = {}) {
        return super.replaceDocument(normalizeLegacyFooterAlignment(document), options);
      }

      updateComponent(componentId, patch = {}) {
        const component = this.findComponent(componentId)?.component;
        if (component?.type !== "text" || !patch.props || !hasOwn(patch.props, "align")) {
          return super.updateComponent(componentId, patch);
        }
        return super.updateComponent(componentId, {
          ...patch,
          props: { ...patch.props, alignExplicit: true }
        });
      }
    }

    Object.defineProperty(TextAlignmentDocumentStore, "__textAlignmentContractVersion", { value: CONTRACT_VERSION });
    window.CatalogDocumentStore = TextAlignmentDocumentStore;
    return true;
  }

  function installStyles() {
    if (typeof document === "undefined" || document.querySelector(`[data-text-alignment-contract="${CONTRACT_VERSION}"]`)) return;
    const style = document.createElement("style");
    style.dataset.textAlignmentContract = CONTRACT_VERSION;
    style.textContent = `
.editor-component--footer-item > .component-children-layer > .editor-component--text .component-text[data-text-align="start"] { text-align: left; }
.editor-component--footer-item > .component-children-layer > .editor-component--text .component-text[data-text-align="center"] { text-align: center; }
.editor-component--footer-item > .component-children-layer > .editor-component--text .component-text[data-text-align="end"] { text-align: right; }
`;
    document.head.appendChild(style);
  }

  function install() {
    const registryInstalled = installRegistryDefaults(window.CATALOG_COMPONENT_REGISTRY);
    const storeInstalled = installStoreContract();
    installStyles();
    return { version: CONTRACT_VERSION, registryInstalled, storeInstalled };
  }

  window.CatalogTextAlignmentContract = Object.freeze({
    VERSION: CONTRACT_VERSION,
    install,
    normalizeLegacyFooterAlignment
  });
})();
