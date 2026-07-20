(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.12.2";

  const hasSlot = (component, slotName) => (component?.children || []).some(child => child.slot?.name === slotName);
  const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  function textFrames(component) {
    const width = Math.max(1, finite(component?.frame?.width, 80));
    const height = Math.max(1, finite(component?.frame?.height, 64));
    const iconPresent = hasSlot(component, "icon");
    const titlePresent = hasSlot(component, "title");
    const subtitlePresent = hasSlot(component, "subtitle");
    const insetX = Math.min(4, Math.floor(width / 2));
    const top = Math.min(iconPresent ? 31 : 3, height);
    const bottomInset = Math.min(3, Math.max(0, height - top));
    const available = Math.max(0, height - top - bottomInset);
    const innerWidth = Math.max(1, width - insetX * 2);

    if (titlePresent && subtitlePresent) {
      const gap = available >= 30 ? 2 : available >= 12 ? 1 : 0;
      const usable = Math.max(0, available - gap);
      let titleHeight;
      if (usable >= 28) titleHeight = Math.max(14, Math.min(usable - 14, Math.round(usable * .52)));
      else titleHeight = Math.ceil(usable / 2);
      const subtitleHeight = Math.max(0, usable - titleHeight);
      return {
        title: { x: insetX, y: top, width: innerWidth, height: titleHeight },
        subtitle: { x: insetX, y: top + titleHeight + gap, width: innerWidth, height: subtitleHeight }
      };
    }

    const single = { x: insetX, y: top, width: innerWidth, height: available };
    return {
      title: titlePresent ? single : { x: insetX, y: top, width: innerWidth, height: 0 },
      subtitle: subtitlePresent ? single : { x: insetX, y: top, width: innerWidth, height: 0 }
    };
  }

  function installGeometry() {
    const definition = window.CATALOG_COMPONENT_REGISTRY?.["footer-item"];
    const slots = definition?.container?.slots;
    if (!Array.isArray(slots)) return false;
    if (definition.__containmentContractVersion === CONTRACT_VERSION) return true;

    for (const slotName of ["title", "subtitle"]) {
      const slot = slots.find(item => item.name === slotName);
      if (!slot) return false;
      slot.getFrame = component => ({ ...textFrames(component)[slotName] });
    }

    Object.defineProperty(definition, "__containmentContractVersion", { value: CONTRACT_VERSION });
    return true;
  }

  function installStyles() {
    if (typeof document === "undefined" || document.querySelector(`[data-footer-containment-contract="${CONTRACT_VERSION}"]`)) return false;
    const style = document.createElement("style");
    style.dataset.footerContainmentContract = CONTRACT_VERSION;
    style.textContent = `
.editor-component--footer-item:not([data-active-context="true"]) > .component-children-layer {
  overflow: hidden;
  border-radius: inherit;
}
.editor-component--footer-item > .component-children-layer > .editor-component--text {
  min-width: 0;
  min-height: 0;
}
@media print {
  .editor-component--footer-item > .component-children-layer {
    overflow: hidden !important;
    border-radius: inherit;
  }
}
`;
    document.head.appendChild(style);
    return true;
  }

  function install() {
    return {
      version: CONTRACT_VERSION,
      geometryInstalled: installGeometry(),
      stylesInstalled: installStyles()
    };
  }

  window.CatalogFooterItemContainmentContract = Object.freeze({
    VERSION: CONTRACT_VERSION,
    install,
    textFrames
  });
})();
