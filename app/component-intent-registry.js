(function () {
  "use strict";

  const VERSION = "05.18.11";
  const clone = value => JSON.parse(JSON.stringify(value));

  const GROUPS = Object.freeze({
    page: Object.freeze({
      id: "page",
      label: "Página",
      description: "Estruturas que identificam, abrem ou encerram a página editorial.",
      order: 10,
      tier: "primary"
    }),
    product: Object.freeze({
      id: "product",
      label: "Produto",
      description: "Representações visuais e informações diretamente ligadas ao produto.",
      order: 20,
      tier: "primary"
    }),
    data: Object.freeze({
      id: "data",
      label: "Dados",
      description: "Tabelas, legendas e estruturas para valores ou classificações semânticas.",
      order: 30,
      tier: "primary"
    }),
    communication: Object.freeze({
      id: "communication",
      label: "Comunicação",
      description: "Texto, símbolos e peças de apoio para orientar a leitura e o contato.",
      order: 40,
      tier: "primary"
    }),
    advanced: Object.freeze({
      id: "advanced",
      label: "Estrutura avançada",
      description: "Infraestrutura composicional e controles internos para edição detalhada.",
      order: 90,
      tier: "advanced"
    })
  });

  const ASSIGNMENTS = Object.freeze({
    "catalog-header": "page",
    "catalog-footer": "page",
    "product-card": "product",
    art: "product",
    "art-gallery": "product",
    specification: "product",
    "title-symbol": "product",
    "data-table": "data",
    "legend-panel": "data",
    "legend-group": "data",
    "legend-item": "data",
    text: "communication",
    icon: "communication",
    separator: "communication",
    "footer-item": "communication",
    "layout-container": "advanced"
  });

  function intentFor(type) {
    const intentId = ASSIGNMENTS[type];
    const group = GROUPS[intentId];
    return group ? { ...clone(group), type } : null;
  }

  function list(registry = window.CATALOG_COMPONENT_REGISTRY || {}) {
    return Object.keys(registry).sort().map(type => {
      const intent = intentFor(type);
      return {
        type,
        intentId: intent?.id || null,
        intentLabel: intent?.label || null,
        intentOrder: intent?.order ?? Number.MAX_SAFE_INTEGER,
        tier: intent?.tier || null
      };
    });
  }

  function grouped(registry = window.CATALOG_COMPONENT_REGISTRY || {}) {
    const entries = list(registry);
    return Object.values(GROUPS)
      .sort((left, right) => left.order - right.order)
      .map(group => ({
        ...clone(group),
        componentTypes: entries.filter(entry => entry.intentId === group.id).map(entry => entry.type)
      }));
  }

  function typesFor(intentId, registry = window.CATALOG_COMPONENT_REGISTRY || {}) {
    return list(registry).filter(entry => entry.intentId === intentId).map(entry => entry.type);
  }

  function validate(registry = window.CATALOG_COMPONENT_REGISTRY || {}) {
    const registryTypes = Object.keys(registry).sort();
    const assignmentTypes = Object.keys(ASSIGNMENTS).sort();
    const missing = registryTypes.filter(type => !ASSIGNMENTS[type]);
    const unknown = assignmentTypes.filter(type => !registry[type]);
    const invalidGroups = assignmentTypes.filter(type => !GROUPS[ASSIGNMENTS[type]]);
    const emptyGroups = Object.keys(GROUPS).filter(intentId => !assignmentTypes.some(type => ASSIGNMENTS[type] === intentId));
    return {
      ok: !missing.length && !unknown.length && !invalidGroups.length && !emptyGroups.length,
      registryTypes,
      assignmentTypes,
      missing,
      unknown,
      invalidGroups,
      emptyGroups
    };
  }

  window.CatalogComponentIntents = Object.freeze({
    VERSION,
    GROUPS,
    ASSIGNMENTS,
    intentFor,
    list,
    grouped,
    typesFor,
    validate
  });
})();
