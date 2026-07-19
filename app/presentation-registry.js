(function () {
  "use strict";

  const VERSION = "1.0.0";
  const MODES = Object.freeze({
    standard: { label: "Padrão", description: "Equilibra imagem, atributos e tabela." },
    hero: { label: "Destaque", description: "Prioriza a imagem principal e o título." },
    technical: { label: "Técnico", description: "Prioriza desenho, medidas e dados." },
    variants: { label: "Variações", description: "Prioriza múltiplas imagens e legendas." },
    "data-only": { label: "Dados", description: "Prioriza tabela e conteúdo textual." }
  });
  const DENSITIES = Object.freeze({
    compact: { label: "Compacta", gap: 6, padding: 8, fontScale: .88, iconScale: .9 },
    standard: { label: "Padrão", gap: 10, padding: 12, fontScale: 1, iconScale: 1 },
    comfortable: { label: "Confortável", gap: 14, padding: 16, fontScale: 1.08, iconScale: 1.12 }
  });
  const PRESETS = Object.freeze({
    "product-standard": {
      id: "product-standard",
      label: "Produto padrão",
      rootType: "product-card",
      version: "1.0.0",
      mode: "standard",
      density: "standard",
      assetRequirements: [
        { role: "product-main", required: false, acceptedStates: ["publish-ready", "review-required"], fallback: "component-placeholder" }
      ]
    },
    "product-hero": {
      id: "product-hero",
      label: "Produto em destaque",
      rootType: "product-card",
      version: "1.0.0",
      mode: "hero",
      density: "comfortable",
      assetRequirements: [
        { role: "product-main", required: true, acceptedStates: ["publish-ready"], fallback: "request-or-generate" }
      ]
    },
    "product-technical": {
      id: "product-technical",
      label: "Ficha técnica",
      rootType: "product-card",
      version: "1.0.0",
      mode: "technical",
      density: "compact",
      assetRequirements: [
        { role: "technical", required: true, acceptedStates: ["publish-ready", "review-required"], fallback: "data-only" }
      ]
    },
    "product-variants": {
      id: "product-variants",
      label: "Variações",
      rootType: "product-card",
      version: "1.0.0",
      mode: "variants",
      density: "compact",
      assetRequirements: [
        { role: "product-gallery", required: true, minimum: 2, acceptedStates: ["publish-ready", "review-required"], fallback: "product-standard" }
      ]
    }
  });

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function normalizePresentation(source = {}, type = "product-card") {
    const preset = PRESETS[source?.presetId] || PRESETS["product-standard"];
    const mode = MODES[source?.mode] ? source.mode : preset.mode;
    const density = DENSITIES[source?.density] ? source.density : preset.density;
    return {
      templateId: source?.templateId ? String(source.templateId) : null,
      mode,
      density,
      responsiveState: ["auto", "compact", "wide"].includes(source?.responsiveState) ? source.responsiveState : "auto",
      presetId: type === "product-card" ? preset.id : null,
      overrides: source?.overrides && typeof source.overrides === "object" ? clone(source.overrides) : {}
    };
  }

  function normalizeTemplateMetadata(metadata = {}, component = null) {
    const rootType = metadata.rootType || component?.type || null;
    const presentation = normalizePresentation(metadata.presentation || component?.presentation, rootType);
    const preset = PRESETS[presentation.presetId];
    return {
      ...metadata,
      rootType,
      kind: metadata.kind || (rootType === "product-card" ? "product-presentation" : "snapshot"),
      family: metadata.family || (rootType === "product-card" ? "product-card" : rootType),
      version: metadata.version || "1.0.0",
      presentation,
      assetRequirements: clone(metadata.assetRequirements || preset?.assetRequirements || [])
    };
  }

  function presetsFor(type) {
    return Object.values(PRESETS).filter(preset => preset.rootType === type).map(clone);
  }

  window.CatalogPresentations = Object.freeze({ VERSION, MODES, DENSITIES, PRESETS, normalizePresentation, normalizeTemplateMetadata, presetsFor });
})();
