(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.8";
  const MAX_SPECIFICATIONS_GAIN = 24;

  function isCompactTechnical(component) {
    if (component?.type !== "product-card" || component.presentation?.mode !== "technical") return false;
    const responsiveState = component.presentation?.responsiveState;
    if (responsiveState === "wide") return false;
    if (responsiveState === "compact") return true;
    return Number(component.frame?.width) < 320;
  }

  function artMinimumHeight(component, registry) {
    const art = (component.children || []).find(child => child.slot?.name === "art");
    if (!art) return 0;
    if (art.type !== "art-gallery") return Math.max(1, Number(registry?.art?.minSize?.height) || 60);

    const items = (art.children || []).filter(child => child.type === "art");
    const count = Math.max(1, items.length);
    const columns = Math.max(1, Math.min(Number(art.layout?.columns) || 3, count));
    const rows = Math.ceil(count / columns);
    const padding = Math.max(0, Number(art.layout?.padding) || 4);
    const gap = Math.max(0, Number(art.layout?.gap) || 6);
    const childMinimum = Math.max(
      Number(registry?.art?.minSize?.height) || 44,
      ...items.map(child => Number(child.constraints?.minHeight) || 44)
    );
    return padding * 2 + rows * childMinimum + Math.max(0, rows - 1) * gap;
  }

  function installGeometry(registry) {
    const card = registry?.["product-card"];
    const slots = card?.container?.slots || [];
    const artSlot = slots.find(slot => slot.name === "art");
    const specificationsSlot = slots.find(slot => slot.name === "specifications");
    if (!artSlot?.getFrame || !specificationsSlot?.getFrame) return false;
    if (artSlot.__technicalCompactContractVersion === CONTRACT_VERSION) return true;

    const originalArtFrame = artSlot.getFrame;
    const originalSpecificationsFrame = specificationsSlot.getFrame;

    function frames(component) {
      const art = { ...originalArtFrame(component) };
      const specifications = { ...originalSpecificationsFrame(component) };
      if (!isCompactTechnical(component)) return { art, specifications, gain: 0 };

      const minimumArtHeight = artMinimumHeight(component, registry);
      const available = Math.max(0, art.height - minimumArtHeight);
      const gain = Math.min(MAX_SPECIFICATIONS_GAIN, available);
      if (!gain) return { art, specifications, gain: 0 };

      art.height -= gain;
      specifications.y -= gain;
      specifications.height += gain;
      return { art, specifications, gain };
    }

    artSlot.getFrame = component => frames(component).art;
    specificationsSlot.getFrame = component => frames(component).specifications;
    Object.defineProperty(artSlot, "__technicalCompactContractVersion", { value: CONTRACT_VERSION });
    Object.defineProperty(specificationsSlot, "__technicalCompactContractVersion", { value: CONTRACT_VERSION });
    return true;
  }

  function inspect(component) {
    const slots = window.CATALOG_COMPONENT_REGISTRY?.["product-card"]?.container?.slots || [];
    const art = slots.find(slot => slot.name === "art")?.getFrame?.(component) || null;
    const specifications = slots.find(slot => slot.name === "specifications")?.getFrame?.(component) || null;
    return { compactTechnical: isCompactTechnical(component), art, specifications };
  }

  function install() {
    return { version: CONTRACT_VERSION, geometryInstalled: installGeometry(window.CATALOG_COMPONENT_REGISTRY) };
  }

  window.CatalogProductTechnicalContract = Object.freeze({ VERSION: CONTRACT_VERSION, install, inspect });
})();
