(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.4.1";
  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
  const footerDefaultOverflow = component => component?.slot?.name === "subtitle" ? "wrap" : "ellipsis";

  function normalizeLegacyFooterOverflow(source) {
    if (!source || typeof source !== "object" || Array.isArray(source)) return source;
    const next = clone(source);
    const visit = (component, parent = null) => {
      if (!component || typeof component !== "object") return;
      if (component.type === "text" && parent?.type === "footer-item") {
        component.props ||= {};
        const explicit = component.props.overflowExplicit === true;
        if (!explicit) component.props.overflow = footerDefaultOverflow(component);
        if (!hasOwn(component.props, "overflowExplicit")) component.props.overflowExplicit = false;
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
      overflowExplicit: registry.text.defaultProps?.overflowExplicit === true
    };

    const footer = registry["footer-item"];
    if (footer.__textOverflowDefaultsInstalled === true) return true;
    const original = footer.defaultChildren;
    footer.defaultChildren = function footerChildrenWithOverflow(component) {
      const descriptors = typeof original === "function" ? original(component) : clone(original || []);
      return descriptors.map(descriptor => descriptor.type === "text" ? {
        ...descriptor,
        props: {
          ...(descriptor.props || {}),
          overflow: descriptor.slot === "subtitle" ? "wrap" : "ellipsis",
          overflowExplicit: false
        }
      } : descriptor);
    };
    Object.defineProperty(footer, "__textOverflowDefaultsInstalled", { value: true });
    return true;
  }

  function installStoreContract() {
    return window.CatalogDocumentStore?.__textOverflowContractVersion === CONTRACT_VERSION;
  }

  function installStyles() {
    if (typeof document === "undefined" || document.querySelector(`[data-text-overflow-contract="${CONTRACT_VERSION}"]`)) return false;
    const style = document.createElement("style");
    style.dataset.textOverflowContract = CONTRACT_VERSION;
    style.textContent = `
.component-text[data-text-overflow="wrap"] p { white-space: pre-wrap; overflow-wrap: anywhere; text-overflow: clip; }
.component-text[data-text-overflow="ellipsis"] p { white-space: nowrap; overflow-wrap: normal; text-overflow: ellipsis; }
.component-text[data-text-overflow="clip"] p { white-space: nowrap; overflow-wrap: normal; text-overflow: clip; }
.editor-component--footer-item > .component-children-layer > .editor-component--text .component-text[data-text-overflow="wrap"] p { white-space: normal; overflow-wrap: anywhere; text-overflow: clip; }
.editor-component--footer-item > .component-children-layer > .editor-component--text .component-text[data-text-overflow="ellipsis"] p { white-space: nowrap; overflow-wrap: normal; text-overflow: ellipsis; }
.editor-component--footer-item > .component-children-layer > .editor-component--text .component-text[data-text-overflow="clip"] p { white-space: nowrap; overflow-wrap: normal; text-overflow: clip; }
`;
    document.head.appendChild(style);
    return true;
  }

  function install() {
    const registryInstalled = installRegistryDefaults(window.CATALOG_COMPONENT_REGISTRY);
    const storeInstalled = installStoreContract();
    return { version: CONTRACT_VERSION, registryInstalled, storeInstalled, stylesInstalled: installStyles() };
  }

  window.CatalogTextOverflowContract = Object.freeze({
    VERSION: CONTRACT_VERSION,
    install,
    normalizeLegacyFooterOverflow
  });
})();
