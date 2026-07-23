(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.12.1";

  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  function overlaps(candidate, sibling, gap) {
    return !(
      candidate.x + candidate.width + gap <= sibling.frame.x
      || sibling.frame.x + sibling.frame.width + gap <= candidate.x
      || candidate.y + candidate.height + gap <= sibling.frame.y
      || sibling.frame.y + sibling.frame.height + gap <= candidate.y
    );
  }

  function probableFrame(store, type, sourceFrame, parentId = null) {
    const hint = window.CatalogComponentPlacements?.hintFor?.(type);
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

  function installStoreContract() {
    const Store = window.CatalogDocumentStore;
    if (!Store?.prototype?.insertComponent || !Store.prototype.getSuggestedFrame) return false;
    if (Store.__initialPlacementContractVersion === CONTRACT_VERSION) return true;

    const originalInsertComponent = Store.prototype.insertComponent;
    const originalGetSuggestedFrame = Store.prototype.getSuggestedFrame;

    Store.prototype.insertComponent = function insertComponentWithProbablePlacement(type, options = {}) {
      const previousType = this.__probablePlacementType;
      this.__probablePlacementType = type;
      try {
        return originalInsertComponent.call(this, type, options);
      } finally {
        this.__probablePlacementType = previousType;
      }
    };

    Store.prototype.getSuggestedFrame = function getSuggestedFrameWithProbablePlacement(sourceFrame, parentId = this.state?.editor?.editingContextId) {
      const preferred = probableFrame(this, this.__probablePlacementType, sourceFrame, parentId);
      return preferred || originalGetSuggestedFrame.call(this, sourceFrame, parentId);
    };

    Object.defineProperty(Store, "__initialPlacementContractVersion", { value: CONTRACT_VERSION });
    return true;
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
