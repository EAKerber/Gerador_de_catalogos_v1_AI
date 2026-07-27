(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.12.1";

  function probableFrame(store, type, sourceFrame, parentId = null) {
    return window.CatalogComponentPlacements?.probableFrame?.(store, type, sourceFrame, parentId) || null;
  }

  function installStoreContract() {
    const Store = window.CatalogDocumentStore;
    return Boolean(
      Store?.prototype?.insertComponent
      && Store.prototype.getSuggestedFrame
      && Store.prototype.getProbablePlacementFrame
    );
  }

  function installFooterReadability() {
    if (typeof document === "undefined" || document.querySelector(`[data-footer-readability-contract="${CONTRACT_VERSION}"]`)) return false;
    const style = document.createElement("style");
    style.dataset.footerReadabilityContract = CONTRACT_VERSION;
    style.textContent = `
.editor-component--footer-item > .component-children-layer > .editor-component--text .component-text[data-text-overflow="wrap"] p {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: clip;
  white-space: normal;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
`;
    document.head.appendChild(style);
    return true;
  }

  function install() {
    return {
      version: CONTRACT_VERSION,
      storeInstalled: installStoreContract(),
      footerReadabilityInstalled: installFooterReadability()
    };
  }

  window.CatalogComponentInitialPlacementContract = Object.freeze({
    VERSION: CONTRACT_VERSION,
    install,
    probableFrame
  });
})();
