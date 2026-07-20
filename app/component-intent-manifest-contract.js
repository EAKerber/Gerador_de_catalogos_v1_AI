(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.11";
  const clone = value => JSON.parse(JSON.stringify(value));

  function install() {
    const manifests = window.CatalogProjectManifests;
    const intents = window.CatalogComponentIntents;
    if (!manifests?.buildCapabilitiesManifest || !intents) return false;
    if (manifests.__componentIntentContractVersion === CONTRACT_VERSION) return true;

    const original = manifests.buildCapabilitiesManifest;
    manifests.buildCapabilitiesManifest = function buildCapabilitiesWithIntents(document) {
      const manifest = original(document);
      const validation = intents.validate(window.CATALOG_COMPONENT_REGISTRY || {});
      if (!validation.ok) {
        const details = [
          validation.missing.length ? `sem classificação: ${validation.missing.join(", ")}` : "",
          validation.unknown.length ? `tipos desconhecidos: ${validation.unknown.join(", ")}` : "",
          validation.invalidGroups.length ? `grupos inválidos: ${validation.invalidGroups.join(", ")}` : ""
        ].filter(Boolean).join("; ");
        throw new Error(`A classificação por intenção está incompleta${details ? ` (${details})` : ""}.`);
      }

      manifest.componentIntents = {
        manifestVersion: intents.VERSION,
        groups: intents.grouped(window.CATALOG_COMPONENT_REGISTRY || {}).map(group => clone(group))
      };
      manifest.components = (manifest.components || []).map(component => ({
        ...component,
        intent: clone(intents.intentFor(component.type))
      }));
      return manifest;
    };

    Object.defineProperty(manifests, "__componentIntentContractVersion", { value: CONTRACT_VERSION });
    return true;
  }

  window.CatalogComponentIntentManifestContract = Object.freeze({ VERSION: CONTRACT_VERSION, install });
})();
