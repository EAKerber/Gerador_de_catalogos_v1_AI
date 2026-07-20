(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.13";
  const BATCH_ID = "technical-performance";
  const clone = value => JSON.parse(JSON.stringify(value));

  const ICONS = Object.freeze({
    "load-capacity": Object.freeze({
      label: "Capacidade de carga",
      category: "Desempenho",
      body: "<path d=\"M9 7a3 3 0 1 1 6 0\"/><path d=\"M6 7h12l2 14H4L6 7Z\"/><path d=\"M12 7V4\"/>",
      contexts: Object.freeze(["specification", "icon"]),
      keywords: Object.freeze(["carga", "peso", "capacidade", "suporte", "resistência"]),
      examples: Object.freeze(["Capacidade de carga de uma ferragem", "Destaque autônomo de desempenho em uma seção"])
    }),
    "corrosion-resistant": Object.freeze({
      label: "Resistência à corrosão",
      category: "Desempenho",
      body: "<path d=\"M12 2.5 20 5.6v5.7c0 4.8-3.4 8-8 10.7-4.6-2.7-8-5.9-8-10.7V5.6L12 2.5Z\"/><path d=\"M12 7c2 2.4 3 4 3 5.4a3 3 0 0 1-6 0C9 11 10 9.4 12 7Z\"/>",
      contexts: Object.freeze(["specification", "icon"]),
      keywords: Object.freeze(["corrosão", "umidade", "proteção", "oxidação", "revestimento"]),
      examples: Object.freeze(["Especificação de acabamento anticorrosivo", "Chamada visual sobre uso em ambiente úmido"])
    }),
    torque: Object.freeze({
      label: "Torque / aperto",
      category: "Técnica",
      body: "<path d=\"M14.5 6.5a4 4 0 0 0-5-3.6l2.3 2.3-2.6 2.6-2.3-2.3A4 4 0 0 0 9.5 12L4 17.5a2 2 0 1 0 2.8 2.8l5.5-5.5a4 4 0 0 0 5.7-5.7l-2.3 2.3-2.6-2.6 2.3-2.3a4 4 0 0 0-.9 0Z\"/>",
      contexts: Object.freeze(["specification", "icon"]),
      keywords: Object.freeze(["torque", "aperto", "instalação", "ferramenta", "montagem"]),
      examples: Object.freeze(["Valor de torque recomendado na ficha técnica", "Orientação de montagem em um bloco de comunicação"])
    }),
    diameter: Object.freeze({
      label: "Diâmetro / espessura",
      category: "Técnica",
      body: "<circle cx=\"12\" cy=\"12\" r=\"8\"/><path d=\"m7 17 10-10M7 13v4h4M17 11V7h-4\"/>",
      contexts: Object.freeze(["specification", "icon"]),
      keywords: Object.freeze(["diâmetro", "espessura", "bitola", "medida circular", "dimensão"]),
      examples: Object.freeze(["Diâmetro de parafuso ou furo", "Legenda técnica para espessura ou bitola"])
    })
  });

  function registerIcons() {
    const library = window.CATALOG_ICON_LIBRARY;
    if (!library || typeof library !== "object") return false;
    for (const [id, definition] of Object.entries(ICONS)) {
      const existing = library[id];
      if (existing && existing.__technicalIconContractVersion !== CONTRACT_VERSION) {
        throw new Error(`O ícone “${id}” já existe fora do lote ${CONTRACT_VERSION}.`);
      }
      library[id] = {
        ...clone(definition),
        batch: BATCH_ID,
        __technicalIconContractVersion: CONTRACT_VERSION
      };
    }
    return true;
  }

  function installManifest() {
    const manifests = window.CatalogProjectManifests;
    if (!manifests?.buildCapabilitiesManifest) return false;
    if (manifests.__technicalIconContractVersion === CONTRACT_VERSION) return true;

    const original = manifests.buildCapabilitiesManifest;
    manifests.buildCapabilitiesManifest = function buildCapabilitiesWithTechnicalIcons(document) {
      const manifest = original(document);
      manifest.icons = (manifest.icons || []).map(icon => {
        const source = window.CATALOG_ICON_LIBRARY?.[icon.id];
        if (!source?.batch) return icon;
        return {
          ...icon,
          batch: source.batch,
          contexts: clone(source.contexts || []),
          keywords: clone(source.keywords || []),
          examples: clone(source.examples || [])
        };
      });
      manifest.iconBatches = [
        ...(manifest.iconBatches || []).filter(batch => batch.id !== BATCH_ID),
        {
          id: BATCH_ID,
          version: CONTRACT_VERSION,
          label: "Técnica e desempenho",
          iconIds: Object.keys(ICONS),
          requiredContexts: ["specification", "icon"]
        }
      ];
      return manifest;
    };

    Object.defineProperty(manifests, "__technicalIconContractVersion", { value: CONTRACT_VERSION });
    return true;
  }

  function validate() {
    const issues = [];
    for (const [id, icon] of Object.entries(ICONS)) {
      if (!icon.label || !icon.category || !icon.body) issues.push(`${id}: metadados obrigatórios ausentes`);
      if (!Array.isArray(icon.contexts) || !icon.contexts.includes("specification") || !icon.contexts.includes("icon")) issues.push(`${id}: contextos incompletos`);
      if (!Array.isArray(icon.examples) || icon.examples.length < 2) issues.push(`${id}: menos de dois usos plausíveis`);
      if (/fill=|style=|#[0-9a-f]{3,8}/i.test(icon.body)) issues.push(`${id}: SVG não é estritamente monocromático por currentColor`);
    }
    return { ok: issues.length === 0, issues, count: Object.keys(ICONS).length };
  }

  function install() {
    const validation = validate();
    if (!validation.ok) throw new Error(`Lote técnico inválido: ${validation.issues.join("; ")}.`);
    return {
      version: CONTRACT_VERSION,
      iconsRegistered: registerIcons(),
      manifestInstalled: installManifest(),
      count: validation.count
    };
  }

  window.CatalogTechnicalIconContract = Object.freeze({
    VERSION: CONTRACT_VERSION,
    BATCH_ID,
    ICONS,
    install,
    validate
  });
})();
