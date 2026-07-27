(function () {
  "use strict";

  const tokens = () => window.CATALOG_EDITOR_TOKENS;
  const registry = () => window.CATALOG_COMPONENT_REGISTRY;
  const icon = (name, className) => window.CatalogEditorIcon(name, className);
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function getToken(group, key, fallback) {
    return tokens()[group]?.[key] || fallback;
  }

  function componentStyle(component) {
    const surface = getToken("surfaces", component.style.surface, tokens().surfaces["surface.paper"]);
    const surfaceColor = getToken("colors", surface.colorToken, { value: "#fff" }).value;
    const border = getToken("borders", component.style.border, tokens().borders["border.default"]);
    const borderColor = getToken("colors", border.colorToken, { value: "#d9dcdf" }).value;
    const radius = getToken("radii", component.style.radius, tokens().radii["radius.medium"]);
    const accent = getToken("colors", component.style.accentColor, tokens().colors["brand.primary"]);
    const vector = getToken("colors", component.style.vectorColor || component.style.accentColor, accent);
    const text = getToken("colors", component.style.textColor, tokens().colors["text.primary"]);
    const muted = getToken("colors", component.style.mutedColor, tokens().colors["text.muted"]);
    const type = getToken("typography", component.style.typography, tokens().typography["type.body"]);
    const presentation = component.type === "product-card" ? window.CatalogPresentations?.normalizePresentation?.(component.presentation, component.type) : null;
    const density = window.CatalogPresentations?.DENSITIES?.[presentation?.density] || window.CatalogPresentations?.DENSITIES?.standard || { gap: 10, padding: 12, fontScale: 1, iconScale: 1 };
    const densityVariables = presentation ? [
      `--presentation-gap:${density.gap}px`,
      `--presentation-padding:${density.padding}px`,
      `--presentation-font-scale:${density.fontScale}`,
      `--presentation-icon-scale:${density.iconScale}`
    ] : [];

    return [
      `left:${component.frame.x}px`,
      `top:${component.frame.y}px`,
      `width:${component.frame.width}px`,
      `height:${component.frame.height}px`,
      `--component-bg:${surfaceColor}`,
      `--component-border:${border.width ? borderColor : "transparent"}`,
      `border-width:${border.width}px`,
      `--component-radius:${radius.value}`,
      `--component-accent:${accent.value}`,
      `--component-vector:${vector.value}`,
      `--component-text:${text.value}`,
      `--component-muted:${muted.value}`,
      `--component-title-family:${type.family}`,
      `--component-title-size:${type.size}`,
      `--component-title-weight:${type.weight}`,
      `--component-title-line:${type.lineHeight}`,
      `--component-title-tracking:${type.letterSpacing}`,
      `--component-title-transform:${type.transform}`,
      ...densityVariables
    ].join(";");
  }

  function slotStyle(frame) {
    return `left:${frame.x}px;top:${frame.y}px;width:${frame.width}px;height:${frame.height}px`;
  }

  class EditorRenderer {
    constructor(store) {
      this.store = store;
      this.pageCanvas = document.getElementById("pageCanvas");
      this.componentLayer = document.getElementById("componentLayer");
      this.paletteRoot = document.getElementById("componentPalette");
      this.layerRoot = document.getElementById("layerList");
      this.emptyHint = document.getElementById("emptyPageHint");
      this.status = document.getElementById("documentStatus");
      this.breadcrumb = document.getElementById("contextBreadcrumb");
      this.collapsedLayerIds = new Set();
      this.layerRoot.addEventListener("click", event => {
        const toggle = event.target.closest("[data-toggle-layer]");
        if (!toggle) return;
        const componentId = toggle.dataset.toggleLayer;
        if (this.collapsedLayerIds.has(componentId)) this.collapsedLayerIds.delete(componentId);
        else this.collapsedLayerIds.add(componentId);
        this.renderLayers(this.store.getState());
      });
    }

    renderPalette(state = this.store.getState()) {
      const context = this.store.getEditingContext();
      const contextDefinition = context ? registry()[context.type] : null;
      const allowed = contextDefinition?.container?.accepts || null;
      const entries = Object.entries(registry()).filter(([type]) => !allowed || allowed.includes(type));
      const grouped = entries.reduce((groups, [type, definition]) => {
        const category = definition.category || "Componentes";
        (groups[category] ||= []).push([type, definition]);
        return groups;
      }, {});
      const templates = this.store.getComponentTemplates().filter(template => {
        const rootType = template.metadata?.rootType || template.metadata?.component?.type;
        return rootType && (!allowed || allowed.includes(rootType));
      });
      const recipes = this.store.getSectionRecipes();
      const contextualActions = this.store.getContextualActions();

      const intro = context
        ? `<div class="palette-context"><span>Editando dentro de</span><strong>${escapeHtml(context.name)}</strong><small>Somente peças aceitas por este contêiner são exibidas.</small></div>`
        : `<div class="palette-context palette-context--page"><span>Destino atual</span><strong>${escapeHtml(this.store.getPage().name)}</strong><small>Estruturas e elementos podem ser soltos livremente na folha.</small></div>`;

      const savedSection = `
        <section class="palette-group palette-group--saved" data-saved-components>
          <h3>Meus componentes</h3>
          <div class="palette-group__items">
            ${templates.length ? templates.map(template => {
              const type = template.metadata?.rootType || template.metadata?.component?.type;
              const definition = registry()[type] || {};
              return `<article class="palette-item palette-item--template" draggable="true" data-template-id="${escapeHtml(template.id)}" data-component-type="${escapeHtml(type)}" tabindex="0" aria-label="Inserir ou arrastar componente salvo ${escapeHtml(template.label)}">
                ${icon(definition.icon || "card", "palette-item__icon")}
                <div class="palette-item__meta"><strong>${escapeHtml(template.label)}</strong><span>${escapeHtml(definition.label || type)} · ${template.metadata?.kind === "product-presentation" ? "apresentação + snapshot" : "snapshot reutilizável"}</span></div>
                <div class="palette-item__actions"><button type="button" class="palette-item__insert" data-insert-template="${escapeHtml(template.id)}" title="Inserir automaticamente" aria-label="Inserir ${escapeHtml(template.label)}">+</button><button type="button" data-delete-template="${escapeHtml(template.id)}" title="Excluir componente salvo" aria-label="Excluir ${escapeHtml(template.label)}">×</button><span class="palette-item__drag" aria-hidden="true">⋮⋮</span></div>
              </article>`;
            }).join("") : '<div class="palette-saved-empty">Selecione um componente e use <strong>Salvar em Meus componentes</strong>.</div>'}
          </div>
        </section>`;

      const recipeSection = recipes.length ? `
        <section class="palette-group palette-group--recipes" data-official-recipes>
          <h3>Estruturas prontas</h3>
          <div class="palette-group__items">
            ${recipes.map(recipe => {
              const type = recipe.component?.type;
              return `<article class="palette-item palette-item--recipe" draggable="true" data-template-id="${escapeHtml(recipe.id)}" data-component-type="${escapeHtml(type)}" tabindex="0" aria-label="Inserir ou arrastar ${escapeHtml(recipe.label)}">
                ${icon(recipe.icon || "page", "palette-item__icon")}
                <div class="palette-item__meta"><strong>${escapeHtml(recipe.label)}</strong><span>${escapeHtml(recipe.description)}</span></div>
                <div class="palette-item__actions"><button type="button" class="palette-item__insert" data-insert-template="${escapeHtml(recipe.id)}" title="Inserir automaticamente" aria-label="Inserir ${escapeHtml(recipe.label)}">+</button><span class="palette-item__drag" aria-hidden="true">⋮⋮</span></div>
              </article>`;
            }).join("")}
          </div>
        </section>` : "";

      const contextualSection = contextualActions.length ? `
        <section class="palette-group palette-group--contextual" data-contextual-actions>
          <h3>Ações para a seleção</h3>
          <div class="palette-group__items">
            ${contextualActions.map(action => `<article class="palette-item palette-item--contextual">
              ${icon(action.icon || "plus", "palette-item__icon")}
              <div class="palette-item__meta"><strong>${escapeHtml(action.label)}</strong><span>${escapeHtml(action.description)}</span></div>
              <div class="palette-item__actions"><button type="button" class="palette-item__insert" data-context-action="${escapeHtml(action.id)}" data-context-component-id="${escapeHtml(action.componentId)}" title="Executar ação" aria-label="Adicionar ${escapeHtml(action.label)}">+</button></div>
            </article>`).join("")}
          </div>
        </section>` : "";

      this.paletteRoot.innerHTML = intro + contextualSection + recipeSection + savedSection + Object.entries(grouped).map(([category, items]) => `
        <section class="palette-group">
          <h3>${escapeHtml(category)}</h3>
          <div class="palette-group__items">
            ${items.map(([type, definition]) => `
              <article class="palette-item" draggable="true" data-component-type="${escapeHtml(type)}" tabindex="0" aria-label="Inserir ou arrastar ${escapeHtml(definition.label)}">
                ${icon(definition.icon, "palette-item__icon")}
                <div class="palette-item__meta">
                  <strong>${escapeHtml(definition.label)}</strong>
                  <span>${escapeHtml(definition.description)}</span>
                </div>
                <div class="palette-item__actions"><button type="button" class="palette-item__insert" data-insert-component="${escapeHtml(type)}" title="Inserir automaticamente" aria-label="Inserir ${escapeHtml(definition.label)}">+</button><span class="palette-item__drag" aria-hidden="true">⋮⋮</span></div>
              </article>`).join("")}
          </div>
        </section>`).join("");
    }

    renderSlots(component) {
      const definition = registry()[component.type];
      const slots = definition?.container?.slots || [];
      if (!slots.length) return "";
      return `<div class="component-slots" aria-hidden="true">${slots.map(slot => {
        const frame = window.CatalogComponentGeometry.slotFrame(component, slot.name);
        const count = (component.children || []).filter(child => child.slot?.name === slot.name).length;
        return `<div class="component-slot" data-slot-name="${escapeHtml(slot.name)}" data-slot-capacity="${slot.capacity}" style="${slotStyle(frame)}">
          <span>${escapeHtml(slot.label)}</span><small>${count}/${slot.capacity}</small>
        </div>`;
      }).join("")}</div>`;
    }

    renderComponent(component, index, state, parentId = null, depth = 0, contextPathIds = new Set(), insideActiveContext = false, selectedAncestorId = null) {
      const definition = registry()[component.type];
      if (!definition) return "";
      const presentation = window.CatalogPresentations?.normalizePresentation?.(component.presentation, component.type) || { mode: "standard", density: "standard", presetId: null };
      const selectedIds = new Set(state.editor.selectedComponentIds || (state.editor.selectedComponentId ? [state.editor.selectedComponentId] : []));
      const selected = selectedIds.has(component.id);
      const contextId = state.editor.editingContextId;
      const isContext = contextId === component.id;
      const isContextAncestor = contextPathIds.has(component.id) && !isContext;
      const isDirectEditable = contextId ? parentId === contextId : parentId === null;
      const isOutsideContext = Boolean(contextId && !isContext && !isContextAncestor && !insideActiveContext);
      const hasContainer = Boolean(definition.container);
      const childrenInsideContext = insideActiveContext || isContext;
      const selectedOwnerId = selectedAncestorId || (selected && hasContainer ? component.id : null);
      const children = (component.children || []).map((child, childIndex) => this.renderComponent(child, childIndex, state, component.id, depth + 1, contextPathIds, childrenInsideContext, selectedOwnerId)).join("");
      const canResize = isDirectEditable && !isContext;

      return `
        <article class="editor-component editor-component--${escapeHtml(component.type)}"
                 data-component-id="${escapeHtml(component.id)}"
                 data-component-type="${escapeHtml(component.type)}"
                 data-recipe-role="${escapeHtml(component.props?.recipeRole || "")}"
                 data-parent-id="${escapeHtml(parentId || "")}"
                 data-slot-name="${escapeHtml(component.slot?.name || "")}"
                 data-contextual="${String(component.props?.contextual === true)}"
                 data-depth="${depth}"
                 data-selected="${String(selected)}"
                 data-within-selected-container="${String(Boolean(selectedAncestorId))}"
                 data-selected-owner-id="${escapeHtml(selectedAncestorId || "")}"
                 data-container="${String(hasContainer)}"
                 data-active-context="${String(isContext)}"
                 data-context-ancestor="${String(isContextAncestor)}"
                 data-direct-editable="${String(isDirectEditable)}"
                 data-context-muted="${String(isOutsideContext)}"
                 data-layout-mode="${escapeHtml(component.layout ? (window.CatalogLayoutEngine?.effectiveMode(component) || component.layout.mode || "free") : "none")}"
                 data-layout-managed="${String(component.layoutItem?.managed !== false)}"
                 data-presentation-mode="${escapeHtml(component.type === "product-card" ? presentation.mode : "none")}"
                 data-presentation-density="${escapeHtml(component.type === "product-card" ? presentation.density : "standard")}"
                 data-presentation-preset="${escapeHtml(component.type === "product-card" ? presentation.presetId || "" : "")}"
                 style="${componentStyle(component)};z-index:${index + 1}">
          <span class="editor-component__label">${escapeHtml(component.name || definition.label)}</span>
          <div class="editor-component__content">${definition.render(component, { store: this.store, state })}</div>
          ${isContext ? this.renderSlots(component) : ""}
          ${children ? `<div class="component-children-layer">${children}</div>` : ""}
          ${hasContainer ? `<button type="button" class="enter-container-handle" data-enter-container="${escapeHtml(component.id)}" title="Editar conteúdo interno">↳</button>` : ""}
          ${canResize ? `<button type="button" class="resize-handle" data-resize-handle aria-label="Redimensionar ${escapeHtml(component.name || definition.label)}"></button>` : ""}
        </article>`;
    }

    renderPage(state) {
      const page = this.store.getPage();
      const contextPathIds = new Set(this.store.getContextPath().map(item => item.id));
      this.pageCanvas.dataset.gridVisible = String(Boolean(state.editor.gridVisible));
      this.pageCanvas.dataset.hasContext = String(Boolean(state.editor.editingContextId));
      this.componentLayer.innerHTML = page.children.map((component, index) => this.renderComponent(component, index, state, null, 0, contextPathIds)).join("");
      this.emptyHint.hidden = page.children.length > 0;
    }

    renderBreadcrumb(state) {
      const page = this.store.getPage();
      const path = this.store.getContextPath();
      const plan = window.CatalogContextNavigation.planBreadcrumb(path, { visibleTail: 2 });
      const pageCurrent = !state.editor.editingContextId;
      const items = [
        `<button type="button" class="context-breadcrumb__item context-breadcrumb__item--root" data-context-id="" data-current="${String(pageCurrent)}" title="${escapeHtml(page.name)}">${icon("page", "context-breadcrumb__icon")}<span>${escapeHtml(page.name)}</span></button>`
      ];
      if (plan.hidden.length) {
        items.push(`<span class="context-breadcrumb__separator">›</span>`);
        items.push(`
          <details class="context-breadcrumb__overflow">
            <summary aria-label="Mostrar ${plan.hidden.length} ancestral(is) oculto(s)" title="Mostrar ancestrais ocultos">•••</summary>
            <div class="context-breadcrumb__menu" role="menu">
              ${plan.hidden.map(component => `<button type="button" role="menuitem" data-context-id="${escapeHtml(component.id)}" title="${escapeHtml(component.name)}">${escapeHtml(component.name)}</button>`).join("")}
            </div>
          </details>`);
      }
      plan.visible.forEach(component => {
        items.push(`<span class="context-breadcrumb__separator">›</span>`);
        items.push(`<button type="button" class="context-breadcrumb__item" data-context-id="${escapeHtml(component.id)}" data-current="${String(component.id === state.editor.editingContextId)}" title="${escapeHtml(component.name)}"><span>${escapeHtml(component.name)}</span></button>`);
      });
      this.breadcrumb.innerHTML = `<span class="context-breadcrumb__label">Contexto</span>${items.join("")}${state.editor.editingContextId ? `<button type="button" class="context-breadcrumb__exit" data-exit-context>Subir um nível <kbd>Esc</kbd></button>` : ""}`;
    }

    revealLayerPath(componentId) {
      const record = this.store.findComponent(componentId);
      (record?.path || []).slice(0, -1).forEach(component => this.collapsedLayerIds.delete(component.id));
    }

    focusLayer(componentId) {
      if (!componentId || this.layerRoot.closest("[hidden]")) return;
      const item = Array.from(this.layerRoot.querySelectorAll("[data-layer-id]"))
        .find(candidate => candidate.dataset.layerId === componentId);
      item?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }

    renderLayers(state, change = null) {
      const page = this.store.getPage();
      if (!page.children.length) {
        this.layerRoot.innerHTML = '<div class="layer-empty">A página ainda não possui componentes.</div>';
        return;
      }

      const selectedIds = new Set(state.editor.selectedComponentIds || (state.editor.selectedComponentId ? [state.editor.selectedComponentId] : []));
      const primaryId = state.editor.selectedComponentId || [...selectedIds][selectedIds.size - 1] || null;
      const selectedAncestorIds = new Set();
      selectedIds.forEach(componentId => {
        const path = this.store.findComponent(componentId)?.path || [];
        path.slice(0, -1).forEach(component => selectedAncestorIds.add(component.id));
      });
      const shouldReveal = change?.type === "init" || change?.type === "selection" || change?.type === "editing-context";
      if (shouldReveal && primaryId) this.revealLayerPath(primaryId);
      if (shouldReveal && state.editor.editingContextId) this.revealLayerPath(state.editor.editingContextId);

      const renderNodes = (children, depth = 0, selectedAncestorId = null) => children.map((component, index) => {
        const definition = registry()[component.type];
        const group = children.filter(sibling => (sibling.slot?.name || null) === (component.slot?.name || null));
        const groupIndex = group.findIndex(sibling => sibling.id === component.id);
        const hasChildren = Boolean(component.children?.length);
        const isContainer = Boolean(definition?.container);
        const isSelected = selectedIds.has(component.id);
        const selectedOwnerId = selectedAncestorId || (isSelected && isContainer ? component.id : null);
        const isCollapsed = hasChildren && this.collapsedLayerIds.has(component.id);
        return `
          <div class="layer-node" data-layer-depth="${depth}" data-collapsed="${String(isCollapsed)}">
            <div class="layer-row" style="--layer-depth:${depth}">
              ${hasChildren
                ? `<button type="button" class="layer-toggle" data-toggle-layer="${escapeHtml(component.id)}" aria-expanded="${String(!isCollapsed)}" title="${isCollapsed ? "Expandir subárvore" : "Recolher subárvore"}"><span aria-hidden="true">›</span></button>`
                : '<span class="layer-toggle-spacer" aria-hidden="true"></span>'}
              <button type="button" class="layer-item" data-layer-id="${escapeHtml(component.id)}" data-selected="${String(isSelected)}" data-primary-selection="${String(primaryId === component.id)}" data-selection-ancestor="${String(selectedAncestorIds.has(component.id))}" data-within-selection="${String(Boolean(selectedAncestorId))}" data-active-context="${String(state.editor.editingContextId === component.id)}" aria-current="${primaryId === component.id ? "true" : "false"}" title="${escapeHtml(component.name || definition?.label || component.type)}">
                ${icon(definition?.icon || "card", "layer-item__icon")}
                <span class="layer-item__name">${escapeHtml(component.name || definition?.label || component.type)}</span>
                ${component.slot?.name ? `<span class="layer-item__slot">${escapeHtml(component.slot.name)}</span>` : `<span class="layer-item__order">${String(index + 1).padStart(2, "0")}</span>`}
              </button>
              <span class="layer-order-actions" aria-label="Reordenar ${escapeHtml(component.name || definition?.label || component.type)}">
                <button type="button" data-reorder-layer="${escapeHtml(component.id)}" data-reorder-direction="-1" aria-label="Mover ${escapeHtml(component.name || definition?.label || component.type)} para cima" title="Mover para cima" ${groupIndex <= 0 ? "disabled" : ""}>↑</button>
                <button type="button" data-reorder-layer="${escapeHtml(component.id)}" data-reorder-direction="1" aria-label="Mover ${escapeHtml(component.name || definition?.label || component.type)} para baixo" title="Mover para baixo" ${groupIndex >= group.length - 1 ? "disabled" : ""}>↓</button>
              </span>
              ${isContainer ? `<button type="button" class="layer-enter" data-enter-container="${escapeHtml(component.id)}" title="Entrar no componente">${state.editor.editingContextId === component.id ? "●" : "↳"}</button>` : ""}
            </div>
            ${hasChildren && !isCollapsed ? `<div class="layer-children">${renderNodes(component.children, depth + 1, selectedOwnerId)}</div>` : ""}
          </div>`;
      }).join("");

      this.layerRoot.innerHTML = renderNodes(page.children);
      if (change?.type === "selection" || change?.type === "editing-context") {
        queueMicrotask(() => this.focusLayer(primaryId || state.editor.editingContextId));
      }
    }

    setStatus(message) {
      this.status.textContent = message;
    }

    render(state, change) {
      this.renderPalette(state);
      this.renderPage(state);
      this.renderBreadcrumb(state);
      this.renderLayers(state, change);
      if (change?.type === "component-added") this.setStatus(change.slotName ? `Componente inserido no slot “${change.slotName}”.` : "Componente adicionado.");
      else if (change?.type === "component-updated") this.setStatus("Componente atualizado.");
      else if (change?.type === "component-deleted") this.setStatus("Componente removido.");
      else if (change?.type === "component-duplicated") this.setStatus("Componente duplicado.");
      else if (change?.type === "component-duplicated-series") this.setStatus(`${change.count} cópia(s) distribuída(s).`);
      else if (change?.type === "component-template-saved") this.setStatus("Componente salvo em Meus componentes.");
      else if (change?.type === "component-template-inserted") this.setStatus("Componente salvo inserido com uma nova subárvore.");
      else if (change?.type === "section-recipe-inserted") this.setStatus("Estrutura pronta inserida; todas as peças continuam editáveis.");
      else if (change?.type === "art-converted-to-gallery") this.setStatus("Arte convertida em galeria; a original foi preservada e uma variação foi adicionada.");
      else if (change?.type === "component-template-removed") this.setStatus("Componente removido de Meus componentes.");
      else if (change?.type === "card-number-updated") this.setStatus("Numeração do card atualizada.");
      else if (change?.type === "table-row-added") this.setStatus("Linha adicionada à tabela.");
      else if (change?.type === "table-row-updated") this.setStatus("Linha da tabela atualizada.");
      else if (change?.type === "table-row-removed") this.setStatus("Linha removida da tabela.");
      else if (change?.type === "table-row-reordered") this.setStatus("Linhas da tabela reordenadas.");
      else if (change?.type === "components-spaced") this.setStatus(`Espaçamento de ${change.gap}px aplicado${change.separators ? " com separadores" : ""}.`);
      else if (change?.type === "component-asset-changed") this.setStatus(change.assetId ? "Arte vinculada ao componente." : "Vínculo da arte removido.");
      else if (change?.type === "product-created") this.setStatus("Produto adicionado ao inventário.");
      else if (change?.type === "product-updated") this.setStatus("Produto e cards vinculados atualizados.");
      else if (change?.type === "product-bound") this.setStatus("Produto vinculado ao card.");
      else if (change?.type === "product-unbound") this.setStatus("Card convertido em conteúdo local.");
      else if (change?.type === "product-template-applied") this.setStatus("Template de apresentação aplicado sem trocar o conteúdo.");
      else if (change?.type === "subcatalog-created") this.setStatus("Subcatálogo criado a partir da seleção.");
      else if (change?.type === "collection-item-upserted" && change.collectionId === "assets") this.setStatus("Arte adicionada à biblioteca.");
      else if (change?.type === "component-reordered") this.setStatus("Ordem interna atualizada.");
      else if (change?.type === "component-slot-changed") this.setStatus("Slot do componente atualizado.");
      else if (change?.type === "component-fitted-to-slot") this.setStatus("Componente reajustado ao slot.");
      else if (change?.type === "component-fitted-to-layout") this.setStatus("Componente reintegrado ao auto-layout.");
      else if (change?.type === "auto-layout-applied") this.setStatus("Auto-layout recalculado.");
      else if (change?.type === "editor-setting" && change.key === "smartSnapEnabled") this.setStatus(change.value ? "Snap inteligente ativado." : "Snap inteligente desativado.");
      else if (change?.type === "editing-context") this.setStatus(change.componentId ? "Contexto interno aberto." : "Retorno à página A4.");
      else if (change?.type === "history-undo") this.setStatus(`Desfeito: ${change.label}.`);
      else if (change?.type === "history-redo") this.setStatus(`Refeito: ${change.label}.`);
      else if (change?.type === "document-imported") this.setStatus(`Documento importado${change.importSummary?.fileName ? ` de “${change.importSummary.fileName}”` : ""}.`);
      else if (change?.type === "package-imported") this.setStatus(`Pacote portátil importado com ${change.importSummary?.packageAssets || 0} asset(s).`);
      else if (change?.type === "document-replaced") this.setStatus("Documento substituído.");
      else if (change?.type === "document-saved") this.setStatus("Documento salvo neste navegador.");
      else if (change?.type === "document-reset") this.setStatus("Novo documento criado.");
    }
  }

  window.CatalogEditorRenderer = EditorRenderer;
})();
