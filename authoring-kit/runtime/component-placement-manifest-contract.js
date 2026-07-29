(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.12.1";
  const clone = value => JSON.parse(JSON.stringify(value));

  function enhance(manifest) {
    const placements = window.CatalogComponentPlacements;
    if (!placements) return manifest;
    const validation = placements.validate(window.CATALOG_COMPONENT_REGISTRY || {});
    if (!validation.ok) {
      const details = [
        validation.unknown.length ? `tipos desconhecidos: ${validation.unknown.join(", ")}` : "",
        validation.invalid.length ? `hints inválidos: ${validation.invalid.join(", ")}` : ""
      ].filter(Boolean).join("; ");
      throw new Error(`As posições iniciais prováveis estão inválidas${details ? ` (${details})` : ""}.`);
    }

    manifest.componentPlacements = {
      manifestVersion: placements.VERSION,
      strength: "probable",
      hints: placements.list()
    };
    manifest.components = (manifest.components || []).map(component => ({
      ...component,
      initialPlacement: clone(placements.hintFor(component.type))
    }));
    return manifest;
  }

  function install() {
    return Boolean(window.CatalogProjectManifests?.buildCapabilitiesManifest && window.CatalogComponentPlacements);
  }

  window.CatalogComponentPlacementManifestContract = Object.freeze({ VERSION: CONTRACT_VERSION, install, enhance });
})();
