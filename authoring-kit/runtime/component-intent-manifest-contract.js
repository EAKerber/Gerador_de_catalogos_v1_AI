(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.13";
  const clone = value => JSON.parse(JSON.stringify(value));
  const ICON_BATCH_LABELS = Object.freeze({
    "technical-performance": "Técnica e desempenho",
    "commercial-contact-trust": "Comercial, contato e confiança"
  });

  function enrichIcons(manifest) {
    const batches = new Map();
    manifest.icons = (manifest.icons || []).map(icon => {
      const source = window.CATALOG_ICON_LIBRARY?.[icon.id];
      if (!source) return icon;
      const enriched = {
        ...icon,
        ...(source.batch ? { batch: source.batch } : {}),
        ...(Array.isArray(source.contexts) ? { contexts: clone(source.contexts) } : {}),
        ...(Array.isArray(source.keywords) ? { keywords: clone(source.keywords) } : {}),
        ...(Array.isArray(source.examples) ? { examples: clone(source.examples) } : {})
      };
      if (source.batch) {
        const current = batches.get(source.batch) || {
          id: source.batch,
          version: CONTRACT_VERSION,
          label: ICON_BATCH_LABELS[source.batch] || source.batch,
          iconIds: [],
          requiredContexts: []
        };
        current.iconIds.push(icon.id);
        for (const context of source.contexts || []) {
          if (!current.requiredContexts.includes(context)) current.requiredContexts.push(context);
        }
        batches.set(source.batch, current);
      }
      return enriched;
    });
    manifest.iconBatches = Array.from(batches.values()).map(batch => ({
      ...batch,
      iconIds: batch.iconIds.sort(),
      requiredContexts: batch.requiredContexts.sort()
    }));
    return manifest;
  }

  function install() {
    const manifests = window.CatalogProjectManifests;
    const intents = window.CatalogComponentIntents;
    if (!manifests?.buildCapabilitiesManifest || !intents) return false;
    if (manifests.__componentIntentContractVersion === CONTRACT_VERSION) return true;

    const original = manifests.buildCapabilitiesManifest;
    manifests.buildCapabilitiesManifest = function buildCapabilitiesWithEditorialMetadata(document) {
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
      return enrichIcons(manifest);
    };

    Object.defineProperty(manifests, "__componentIntentContractVersion", { value: CONTRACT_VERSION });
    return true;
  }

  window.CatalogComponentIntentManifestContract = Object.freeze({ VERSION: CONTRACT_VERSION, install, enrichIcons });
})();
