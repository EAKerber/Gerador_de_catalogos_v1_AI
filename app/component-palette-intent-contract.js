(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.12";
  const scriptURL = document.currentScript?.src || new URL("app/component-palette-intent-contract.js", window.location.href).href;

  const escapeHtml = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function isAdvancedType(type, registry = window.CATALOG_COMPONENT_REGISTRY || {}) {
    return type === "layout-container" || registry[type]?.category === "Peças internas";
  }

  function plan(registry = window.CATALOG_COMPONENT_REGISTRY || {}, allowedTypes = null) {
    const allowed = allowedTypes ? new Set(allowedTypes) : null;
    const visibleTypes = Object.keys(registry).filter(type => !allowed || allowed.has(type));
    const primary = (window.CatalogComponentIntents?.grouped?.(registry) || [])
      .filter(group => group.tier === "primary")
      .map(group => ({
        ...group,
        componentTypes: group.componentTypes.filter(type => visibleTypes.includes(type) && !isAdvancedType(type, registry))
      }))
      .filter(group => group.componentTypes.length);
    const advanced = visibleTypes
      .filter(type => isAdvancedType(type, registry))
      .sort((left, right) => {
        const leftIntent = window.CatalogComponentIntents?.intentFor?.(left);
        const rightIntent = window.CatalogComponentIntents?.intentFor?.(right);
        return (leftIntent?.order || 999) - (rightIntent?.order || 999)
          || String(registry[left]?.label || left).localeCompare(String(registry[right]?.label || right));
      });
    return { primary, advanced, visibleTypes };
  }

  function ensureStylesheet() {
    if (document.querySelector('link[data-component-intent-styles="true"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = new URL("../styles/component-intents.css", scriptURL).href;
    link.dataset.componentIntentStyles = "true";
    document.head.appendChild(link);
  }

  function createPrimarySection(group, itemsByType) {
    const section = document.createElement("section");
    section.className = "palette-group palette-group--intent";
    section.dataset.intentGroup = group.id;
    section.dataset.intentTier = group.tier;
    section.innerHTML = `<header class="palette-intent-heading"><div><h3>${escapeHtml(group.label)}</h3><p>${escapeHtml(group.description)}</p></div><span>${group.componentTypes.length}</span></header><div class="palette-group__items"></div>`;
    const items = section.querySelector(".palette-group__items");
    group.componentTypes.forEach(type => {
      const item = itemsByType.get(type);
      if (item) items.appendChild(item);
    });
    return section;
  }

  function createAdvancedSection(types, itemsByType, contextOpen) {
    if (!types.length) return null;
    const details = document.createElement("details");
    details.className = "palette-group palette-group--advanced";
    details.dataset.intentGroup = "advanced";
    details.dataset.intentTier = "advanced";
    details.open = contextOpen;
    details.innerHTML = `<summary><div><strong>Estrutura avançada</strong><span>Contêineres e peças internas para edição detalhada</span></div><small>${types.length}</small></summary><div class="palette-group__items"></div>`;
    const items = details.querySelector(".palette-group__items");
    types.forEach(type => {
      const item = itemsByType.get(type);
      if (!item) return;
      const intent = window.CatalogComponentIntents?.intentFor?.(type);
      item.dataset.semanticIntent = intent?.id || "";
      items.appendChild(item);
    });
    return details;
  }

  function applySearch(renderer, root, query) {
    const normalized = String(query || "").trim().toLocaleLowerCase("pt-BR");
    const items = Array.from(root.querySelectorAll(".palette-item"));
    let visible = 0;
    items.forEach(item => {
      const matches = !normalized || item.textContent.toLocaleLowerCase("pt-BR").includes(normalized);
      item.hidden = !matches;
      if (matches) visible += 1;
    });
    root.querySelectorAll("[data-intent-group]").forEach(group => {
      const hasVisible = Array.from(group.querySelectorAll(".palette-item")).some(item => !item.hidden);
      group.hidden = !hasVisible;
      if (normalized && hasVisible && group.matches("details")) group.open = true;
    });
    root.querySelectorAll(".palette-group:not([data-intent-group])").forEach(group => {
      const groupItems = Array.from(group.querySelectorAll(".palette-item"));
      if (!normalized) {
        group.hidden = false;
        return;
      }
      group.hidden = !groupItems.length || !groupItems.some(item => !item.hidden);
    });
    const status = root.querySelector("[data-palette-search-status]");
    if (status) status.textContent = normalized ? `${visible} resultado(s)` : "Todos os componentes";
    renderer.__intentPaletteQuery = query;
  }

  function bindKeyboardShortcut(renderer, root) {
    if (renderer.__intentPaletteKeyboardBound) return;
    root.addEventListener("keydown", event => {
      if (event.key !== "/" || event.target.matches("input, textarea, select")) return;
      event.preventDefault();
      root.querySelector("[data-palette-intent-search]")?.focus();
    });
    renderer.__intentPaletteKeyboardBound = true;
  }

  function placeNavigation(root, navigation) {
    const contextual = root.querySelector(".palette-group--contextual");
    const context = root.querySelector(".palette-context");
    if (contextual) contextual.insertAdjacentElement("afterend", navigation);
    else if (context) context.insertAdjacentElement("afterend", navigation);
    else root.prepend(navigation);
  }

  function enhance(renderer) {
    const root = renderer.paletteRoot;
    const registry = window.CATALOG_COMPONENT_REGISTRY || {};
    const regularItems = Array.from(root.querySelectorAll(".palette-item[data-component-type]"))
      .filter(item => item.querySelector("[data-insert-component]") && !item.classList.contains("palette-item--template") && !item.classList.contains("palette-item--recipe"));
    if (!regularItems.length) return;

    const itemsByType = new Map(regularItems.map(item => [item.dataset.componentType, item]));
    const originalGroups = new Set(regularItems.map(item => item.closest(".palette-group")).filter(Boolean));
    originalGroups.forEach(group => group.remove());

    const availableTypes = regularItems.map(item => item.dataset.componentType);
    const layout = plan(registry, availableTypes);
    const contextOpen = Boolean(renderer.store.getEditingContext()) || !layout.primary.length;

    const navigation = document.createElement("section");
    navigation.className = "palette-intent-navigation";
    navigation.innerHTML = `<label><span>Buscar na biblioteca</span><input type="search" value="${escapeHtml(renderer.__intentPaletteQuery || "")}" placeholder="Nome, função ou descrição" data-palette-intent-search /></label><small data-palette-search-status>Todos os componentes</small>`;
    placeNavigation(root, navigation);

    layout.primary.forEach(group => root.appendChild(createPrimarySection(group, itemsByType)));
    const advanced = createAdvancedSection(layout.advanced, itemsByType, contextOpen);
    if (advanced) root.appendChild(advanced);

    const input = navigation.querySelector("[data-palette-intent-search]");
    input.addEventListener("input", event => applySearch(renderer, root, event.target.value));
    input.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      input.value = "";
      applySearch(renderer, root, "");
    });
    bindKeyboardShortcut(renderer, root);
    applySearch(renderer, root, renderer.__intentPaletteQuery || "");
  }

  function install() {
    const Renderer = window.CatalogEditorRenderer;
    if (!Renderer?.prototype?.renderPalette) return false;
    ensureStylesheet();
    return true;
  }

  window.CatalogComponentPaletteIntentContract = Object.freeze({ VERSION: CONTRACT_VERSION, install, plan, isAdvancedType, enhance });
})();
