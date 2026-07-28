(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.14";
  const clone = value => JSON.parse(JSON.stringify(value));
  const ICON_BATCH_LABELS = Object.freeze({
    "technical-performance": "Técnica e desempenho",
    "commercial-contact-trust": "Comercial, contato e confiança"
  });
  const ICON_BATCH_VERSIONS = Object.freeze({
    "technical-performance": "05.18.13",
    "commercial-contact-trust": "05.18.14"
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
          version: ICON_BATCH_VERSIONS[source.batch] || CONTRACT_VERSION,
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
    manifest.iconBatches = Array.from(batches.values())
      .map(batch => ({
        ...batch,
        iconIds: batch.iconIds.sort(),
        requiredContexts: batch.requiredContexts.sort()
      }))
      .sort((left, right) => left.id.localeCompare(right.id));
    return manifest;
  }

  function enhance(manifest) {
    const intents = window.CatalogComponentIntents;
    if (!intents) return manifest;
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
  }

  function install() {
    return Boolean(window.CatalogProjectManifests?.buildCapabilitiesManifest && window.CatalogComponentIntents);
  }

  window.CatalogComponentIntentManifestContract = Object.freeze({ VERSION: CONTRACT_VERSION, install, enhance, enrichIcons });
})();
