(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.12.1";
  const clone = value => JSON.parse(JSON.stringify(value));

  function install() {
    const manifests = window.CatalogProjectManifests;
    const placements = window.CatalogComponentPlacements;
    if (!manifests?.buildCapabilitiesManifest || !placements) return false;
    if (manifests.__componentPlacementContractVersion === CONTRACT_VERSION) return true;

    const original = manifests.buildCapabilitiesManifest;
    manifests.buildCapabilitiesManifest = function buildCapabilitiesWithPlacements(document) {
      const manifest = original(document);
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
    };

    Object.defineProperty(manifests, "__componentPlacementContractVersion", { value: CONTRACT_VERSION });
    return true;
  }

  window.CatalogComponentPlacementManifestContract = Object.freeze({ VERSION: CONTRACT_VERSION, install });
})();
