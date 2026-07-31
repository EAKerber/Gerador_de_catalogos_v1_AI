(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.7";
  const MAX_ART_GAIN = 24;

  function isCompactHero(component) {
    if (component?.type !== "product-card" || component.presentation?.mode !== "hero") return false;
    if (window.CatalogPresentations?.effectiveArrangement?.(component) === "horizontal") return false;
    const responsiveState = component.presentation?.responsiveState;
    if (responsiveState === "wide") return false;
    if (responsiveState === "compact") return true;
    return Number(component.frame?.width) < 320;
  }

  function installGeometry(registry) {
    const card = registry?.["product-card"];
    const specification = registry?.specification;
    const slots = card?.container?.slots || [];
    const artSlot = slots.find(slot => slot.name === "art");
    const specificationsSlot = slots.find(slot => slot.name === "specifications");
    if (!artSlot?.getFrame || !specificationsSlot?.getFrame) return false;
    if (artSlot.__heroCompactContractVersion === CONTRACT_VERSION) return true;

    const originalArtFrame = artSlot.getFrame;
    const originalSpecificationsFrame = specificationsSlot.getFrame;
    const columns = Math.max(1, Number(specificationsSlot.columns) || 2);
    const gap = Math.max(0, Number(specificationsSlot.gap) || 0);
    const itemMinimumHeight = Math.max(1, Number(specification?.minSize?.height) || 28);

    function frames(component) {
      const art = { ...originalArtFrame(component) };
      const specifications = { ...originalSpecificationsFrame(component) };
      if (!isCompactHero(component)) return { art, specifications, gain: 0 };

      const count = (component.children || []).filter(child => child.slot?.name === "specifications").length;
      if (!count) return { art, specifications, gain: 0 };
      const rows = Math.max(1, Math.ceil(count / columns));
      const minimumSpecificationsHeight = rows * itemMinimumHeight + Math.max(0, rows - 1) * gap;
      const available = Math.max(0, specifications.height - minimumSpecificationsHeight);
      const gain = Math.min(MAX_ART_GAIN, available);
      if (!gain) return { art, specifications, gain: 0 };

      art.height += gain;
      specifications.y += gain;
      specifications.height -= gain;
      return { art, specifications, gain };
    }

    artSlot.getFrame = component => frames(component).art;
    specificationsSlot.getFrame = component => frames(component).specifications;
    Object.defineProperty(artSlot, "__heroCompactContractVersion", { value: CONTRACT_VERSION });
    Object.defineProperty(specificationsSlot, "__heroCompactContractVersion", { value: CONTRACT_VERSION });
    return true;
  }

  function inspect(component) {
    const slots = window.CATALOG_COMPONENT_REGISTRY?.["product-card"]?.container?.slots || [];
    const art = slots.find(slot => slot.name === "art")?.getFrame?.(component) || null;
    const specifications = slots.find(slot => slot.name === "specifications")?.getFrame?.(component) || null;
    return { compactHero: isCompactHero(component), art, specifications };
  }

  function install() {
    return { version: CONTRACT_VERSION, geometryInstalled: installGeometry(window.CATALOG_COMPONENT_REGISTRY) };
  }

  window.CatalogProductHeroContract = Object.freeze({ VERSION: CONTRACT_VERSION, install, inspect });
})();
