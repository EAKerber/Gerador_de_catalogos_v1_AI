(function () {
  "use strict";

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const icon = (name, className) => window.CatalogEditorIcon(name, className);

  class InspectorPanel {
    constructor(store) {
      this.store = store;
      this.root = document.getElementById("inspectorRoot");
      this.activeTab = "content";
      this.lastComponentId = null;
      this.lastComponentType = null;
      this.showAllProperties = false;
      this.tableColumnsOpen = false;
      this.tableBulkOpen = false;
      this.tableBulkFeedback = "";
      this.legendEditorOpen = false;
      this.galleryBulkOpen = false;
      this.galleryBulkFeedback = "";
      this.legendBulkOpen = false;
      this.legendBulkFeedback = "";
      this.taskStateByType = new Map();
      this.root.addEventListener("change", event => this.handleChange(event));
      this.root.addEventListener("click", event => this.handleClick(event));
      this.root.addEventListener("toggle", event => this.handleDisclosureToggle(event), true);
    }

    options(group, selected) {
      const source = window.CATALOG_EDITOR_TOKENS[group] || {};
      return Object.entries(source).map(([value, token]) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(token.label || value)}</option>`).join("");
    }

    colorOptions(selected) {
      return Object.entries(window.CATALOG_EDITOR_TOKENS.colors).map(([value, token]) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(token.group)} · ${escapeHtml(token.label)}</option>`).join("");
    }

    iconOptions(selected) {
      return Object.entries(window.CATALOG_EDITOR_ICONS || {}).map(([value, item]) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(item.category || "Ícones")} · ${escapeHtml(item.label || value)}</option>`).join("");
    }

    field(field, component) {
      const value = component.props[field.path] ?? "";
      const full = field.full ? " inspector-field--full" : "";
      if (field.type === "textarea") {
        return `<div class="inspector-field${full}"><label>${escapeHtml(field.label)}</label><textarea data-prop-path="${escapeHtml(field.path)}">${escapeHtml(value)}</textarea></div>`;
      }
      if (field.type === "select") {
        const options = (field.options || []).map(option => `<option value="${escapeHtml(option.value)}" ${option.value === value ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("");
        return `<div class="inspector-field${full}"><label>${escapeHtml(field.label)}</label><select data-prop-path="${escapeHtml(field.path)}">${options}</select></div>`;
      }
      if (field.type === "token-select") {
        return `<div class="inspector-field${full}"><label>${escapeHtml(field.label)}</label><select data-prop-path="${escapeHtml(field.path)}">${this.options(field.tokenGroup, value)}</select></div>`;
      }
      if (field.type === "icon-select") {
        return `<div class="inspector-field${full}"><label>${escapeHtml(field.label)}</label><select data-prop-path="${escapeHtml(field.path)}">${this.iconOptions(value)}</select></div>`;
      }
      if (field.type === "number") {
        return `<div class="inspector-field${full}"><label>${escapeHtml(field.label)}</label><input type="number" value="${escapeHtml(value)}" min="${escapeHtml(field.min ?? "")}" max="${escapeHtml(field.max ?? "")}" step="${escapeHtml(field.step ?? 1)}" data-prop-path="${escapeHtml(field.path)}" data-prop-type="number" /></div>`;
      }
      if (field.type === "checkbox") {
        return `<label class="inspector-switch inspector-switch--wide${full}"><input type="checkbox" data-prop-path="${escapeHtml(field.path)}" data-prop-type="checkbox" ${value === true ? "checked" : ""} /><span aria-hidden="true"></span><strong>${escapeHtml(field.label)}</strong></label>`;
      }
      return `<div class="inspector-field${full}"><label>${escapeHtml(field.label)}</label><input type="text" value="${escapeHtml(value)}" data-prop-path="${escapeHtml(field.path)}" /></div>`;
    }

    styleField(name, component) {
      const labels = {
        surface: "Superfície",
        border: "Borda",
        radius: "Raio",
        typography: "Tipografia",
        accentColor: "Cor de destaque",
        vectorColor: "Cor do vetor",
        textColor: "Cor do texto",
        mutedColor: "Cor secundária"
      };
      const groupMap = { surface: "surfaces", border: "borders", radius: "radii", typography: "typography" };
      const selected = component.style[name];
      const options = name.endsWith("Color") ? this.colorOptions(selected) : this.options(groupMap[name], selected);
      return `<div class="inspector-field inspector-field--full"><label>${labels[name] || name}</label><select data-style-path="${escapeHtml(name)}">${options}</select></div>`;
    }

    renderSlotSection(component, record) {
      if (!record.parent) return "";
      const parentDefinition = window.CATALOG_COMPONENT_REGISTRY[record.parent.type];
      const slots = (parentDefinition?.container?.slots || []).filter(slot => slot.accepts.includes(component.type));
      const autoLayout = Boolean(parentDefinition?.container?.autoLayout);
      if (!slots.length && !autoLayout) return "";

      const selectedSlot = component.slot?.name || "";
      const slotOptions = [`<option value="" ${selectedSlot ? "" : "selected"}>Posição livre</option>`]
        .concat(slots.map(slot => `<option value="${escapeHtml(slot.name)}" ${slot.name === selectedSlot ? "selected" : ""}>${escapeHtml(slot.label)} · até ${slot.capacity}</option>`))
        .join("");
      const autoManaged = component.slot?.name ? component.slot.managed !== false : component.layoutItem?.managed !== false;
      const activeSlot = slots.find(slot => slot.name === selectedSlot);
      const usedByOthers = activeSlot ? this.store.getSlotUsage(record.parent.id, selectedSlot, component.id) : 0;
      const maximumSpan = activeSlot ? Math.max(1, activeSlot.capacity - usedByOthers) : 1;
      const currentSpan = Math.min(maximumSpan, component.slot?.span || 1);

      return `
        <section class="inspector-section">
          <h3 class="inspector-section__title">Estrutura interna</h3>
          <div class="inspector-grid">
            <div class="inspector-field inspector-field--full">
              <label>Componente pai</label>
              <div class="inspector-readonly">${escapeHtml(record.parent.name)}</div>
            </div>
            ${slots.length ? `<div class="inspector-field inspector-field--full"><label>Slot</label><select data-slot-name>${slotOptions}</select></div>` : ""}
            ${activeSlot?.capacity > 1 ? `<div class="inspector-field inspector-field--full"><label>Espaços ocupados</label><input type="number" min="1" max="${maximumSpan}" step="1" value="${currentSpan}" data-slot-span /><small>${usedByOthers} de ${activeSlot.capacity} unidade(s) usadas por outros itens.</small></div>` : ""}
          </div>
          ${autoLayout ? `
            <label class="inspector-switch inspector-switch--wide" style="margin-top:10px"><input type="checkbox" data-layout-item-managed ${autoManaged ? "checked" : ""} /><span aria-hidden="true"></span><strong>${autoManaged ? "Gerenciado pelo layout" : "Posição independente"}</strong></label>
            <p class="inspector-note">${autoManaged ? "O pai calcula a posição. Um ajuste manual cria uma exceção local durável." : "A posição local será preservada quando pais, irmãos e descendentes forem recalculados."}</p>` : ""}
          <div class="inspector-actions inspector-actions--grid">
            <button type="button" data-reorder="-1">Mover antes</button>
            <button type="button" data-reorder="1">Mover depois</button>
            ${!autoManaged ? `<button type="button" data-reintegrate-layout class="inspector-action--wide">Reintegrar ao layout</button>` : ""}
          </div>
          ${slots.length ? `<p class="inspector-note">${selectedSlot ? `Vinculado ao slot “${escapeHtml(selectedSlot)}”${component.slot?.managed === false ? ", mas com posição manual" : " e ajustado automaticamente"}.` : "Este elemento está livre dentro do componente pai."}</p>` : ""}
        </section>`;
    }

    renderAutoLayoutControls(component, definition) {
      if (!definition.container?.autoLayout || !component.layout) return "";
      const layout = window.CatalogLayoutEngine.normalizedLayout(component);
      const effective = window.CatalogLayoutEngine.effectiveMode(component);
      return `
        <div class="layout-mode-summary">
          <span>Modo efetivo</span><strong>${escapeHtml(effective)}</strong>
        </div>
        <div class="inspector-grid" style="margin-top:10px">
          <div class="inspector-field inspector-field--full">
            <label>Layout principal</label>
            <select data-layout-path="mode">
              <option value="free" ${layout.mode === "free" ? "selected" : ""}>Livre</option>
              <option value="row" ${layout.mode === "row" ? "selected" : ""}>Linha</option>
              <option value="column" ${layout.mode === "column" ? "selected" : ""}>Coluna</option>
              <option value="grid" ${layout.mode === "grid" ? "selected" : ""}>Grade</option>
            </select>
          </div>
          <div class="inspector-field"><label>Espaçamento</label><input type="number" min="0" step="1" value="${layout.gap}" data-layout-path="gap" /></div>
          <div class="inspector-field"><label>Padding</label><input type="number" min="0" step="1" value="${layout.padding}" data-layout-path="padding" /></div>
          <div class="inspector-field"><label>Colunas</label><input type="number" min="1" max="12" step="1" value="${layout.columns}" data-layout-path="columns" /></div>
          <div class="inspector-field"><label>Alinhamento</label><select data-layout-path="align"><option value="stretch" ${layout.align === "stretch" ? "selected" : ""}>Preencher</option><option value="start" ${layout.align === "start" ? "selected" : ""}>Tamanho mínimo</option></select></div>
          <div class="inspector-field inspector-field--full"><label>Distribuição</label><select data-layout-path="distribution"><option value="fill" ${layout.distribution === "fill" ? "selected" : ""}>Preencher espaço</option><option value="between" ${layout.distribution === "between" ? "selected" : ""}>Space between</option><option value="around" ${layout.distribution === "around" ? "selected" : ""}>Space around</option></select></div>
        </div>
        <div class="responsive-rule-box">
          <label class="inspector-switch inspector-switch--wide"><input type="checkbox" data-layout-responsive="enabled" ${layout.responsive.enabled ? "checked" : ""} /><span aria-hidden="true"></span><strong>Layout responsivo por largura</strong></label>
          <div class="inspector-grid" style="margin-top:8px">
            <div class="inspector-field"><label>Até</label><input type="number" min="120" step="1" value="${layout.responsive.breakpoint}" data-layout-responsive="breakpoint" /></div>
            <div class="inspector-field"><label>Usar</label><select data-layout-responsive="mode"><option value="row" ${layout.responsive.mode === "row" ? "selected" : ""}>Linha</option><option value="column" ${layout.responsive.mode === "column" ? "selected" : ""}>Coluna</option><option value="grid" ${layout.responsive.mode === "grid" ? "selected" : ""}>Grade</option></select></div>
          </div>
        </div>
        <div class="inspector-actions"><button type="button" data-apply-layout class="inspector-action--primary">Recalcular layout</button></div>`;
    }

    renderResponsiveRules(definition, component) {
      if (!definition.responsiveRules?.length) return "";
      const active = definition.responsiveRules.find(rule => (rule.maxWidth == null || component.frame.width <= rule.maxWidth) && (rule.minWidth == null || component.frame.width >= rule.minWidth));
      return `
        <div class="responsive-rules-readonly">
          <strong>${escapeHtml(active?.label || "Regra padrão")}</strong>
          <span>${escapeHtml(active?.description || "Sem transformação ativa.")}</span>
          ${definition.responsiveRules.map(rule => `<small>${rule.maxWidth != null ? `≤ ${rule.maxWidth}px` : `≥ ${rule.minWidth}px`} · ${escapeHtml(rule.label)}</small>`).join("")}
        </div>`;
    }

    renderContainerSection(component, definition) {
      if (!definition.container) return "";
      const active = this.store.getState().editor.editingContextId === component.id;
      const slots = definition.container.slots || [];
      const missingChildren = this.store.getMissingDefaultChildren(component.id);
      const separatorState = this.store.getContextualSeparatorState(component.id);
      return `
        <section class="inspector-section inspector-section--container">
          <h3 class="inspector-section__title">Contêiner</h3>
          <div class="container-summary">
            <strong>${escapeHtml(definition.container.label || definition.label)}</strong>
            <span>${component.children.length} peça(s) interna(s)</span>
          </div>
          ${component.reflow?.mode === "manual" ? `<div class="responsive-rule-box"><strong>Compatibilidade de layout legado</strong><p class="inspector-note">Este contêiner veio com o antigo modo Manual. As exceções locais continuam preservadas; novos ajustes usam autoridade por item.</p></div>` : ""}
          ${slots.length ? `<div class="slot-summary">${slots.map(slot => {
            const usage = this.store.getSlotUsage(component.id, slot.name);
            return `<div><span>${escapeHtml(slot.label)}</span><strong>${usage}/${slot.capacity}</strong></div>`;
          }).join("")}</div>` : ""}
          ${this.renderAutoLayoutControls(component, definition)}
          ${this.renderResponsiveRules(definition, component)}
          ${missingChildren.length ? `
            <div class="structure-additions">
              <span>Peças opcionais ausentes</span>
              <div class="inspector-actions inspector-actions--stack">
                ${missingChildren.map(item => `<button type="button" data-restore-default-child data-slot-name="${escapeHtml(item.slotName)}" data-child-type="${escapeHtml(item.type)}">+ Adicionar “${escapeHtml(item.label)}”</button>`).join("")}
              </div>
            </div>` : ""}
          ${separatorState.eligible ? `
            <div class="structure-additions">
              <span>Espaçamento editorial</span>
              <div class="inspector-actions inspector-actions--stack">
                <button type="button" data-add-contextual-separator>+ Adicionar linha separadora</button>
              </div>
              <small>Disponível porque ${Math.round(separatorState.gap)} px supera 3× a espessura mínima da linha.</small>
            </div>` : ""}
          <div class="inspector-actions">
            ${active
              ? `<button type="button" data-exit-context class="inspector-action--primary">Sair da edição interna</button>`
              : `<button type="button" data-enter-selected-container class="inspector-action--primary">Editar conteúdo interno</button>`}
          </div>
          <p class="inspector-note">O recálculo mantém a estrutura válida sem apagar itens definidos como posição independente.</p>
        </section>`;
    }

    renderAssetSection(component) {
      if (component.type !== "art") return "";
      const asset = this.store.getAsset(component.props.assetId);
      const metadata = asset?.metadata || {};
      return `
        <section class="inspector-section inspector-section--asset">
          <h3 class="inspector-section__title">Arte vinculada</h3>
          <div class="asset-link-summary" data-asset-link-state="${asset ? "linked" : "empty"}">
            <strong>${escapeHtml(asset?.label || "Nenhuma arte selecionada")}</strong>
            <span>${asset ? `${escapeHtml(metadata.mimeType || "Imagem")} · ${metadata.width || 0}×${metadata.height || 0}` : "Escolha primeiro uma arte já cadastrada ou envie do computador."}</span>
          </div>
          <div class="inspector-actions inspector-actions--grid">
            <button type="button" class="inspector-action--primary inspector-action--wide" data-open-asset-library data-component-id="${escapeHtml(component.id)}">${asset ? "Substituir pela biblioteca" : "Escolher na biblioteca"}</button>
            ${asset ? `<button type="button" class="inspector-action--wide" data-clear-asset data-component-id="${escapeHtml(component.id)}">Remover vínculo</button>` : ""}
          </div>
          <p class="inspector-note">O documento guarda somente <code>assetId</code>, metadados e referência. O arquivo binário permanece no armazenamento local.</p>
        </section>`;
    }

    renderGallerySection(component) {
      if (component.type !== "art-gallery") return "";
      const items = (component.children || []).filter(child => child.type === "art");
      return `
        <section class="inspector-section inspector-section--gallery">
          <div class="inspector-section__heading"><h3 class="inspector-section__title">Imagens e legendas</h3><span>${items.length} variação(ões)</span></div>
          <p class="inspector-note">Uma linha cria uma imagem canônica com legenda própria. A segunda coluna opcional aceita um <code>assetId</code> já existente.</p>
          <details class="table-bulk-entry gallery-bulk-entry" ${this.galleryBulkOpen ? "open" : ""}>
            <summary>Editar coleção <span>Legenda ⇥ assetId</span></summary>
            <textarea rows="6" data-gallery-bulk-text placeholder="Cromado&#9;asset-opcional&#10;Preto&#10;Branco">${escapeHtml(items.map(item => `${item.props?.caption || item.props?.label || "Variação"}\t${item.props?.assetId || ""}`).join("\n"))}</textarea>
            <div class="table-bulk-entry__actions"><select aria-label="Modo da coleção" data-gallery-bulk-mode><option value="replace">Sincronizar coleção</option><option value="append">Adicionar ao final</option></select><button type="button" data-gallery-bulk-apply>Aplicar imagens</button></div>
            ${this.galleryBulkFeedback ? `<small role="status">${escapeHtml(this.galleryBulkFeedback)}</small>` : ""}
          </details>
        </section>`;
    }

    renderTableRowsSection(component) {
      if (component.type !== "data-table") return "";
      const rows = this.store.getTableRows(component);
      const columns = this.store.getTableColumns(component);
      const schemas = this.store.getTableSchemas();
      const legends = this.store.getColorLegends();
      const legendOptions = selected => `<option value="">Sem legenda</option>${selected && !legends.some(legend => legend.metadata?.key === selected) ? `<option value="${escapeHtml(selected)}" selected>Legenda ausente · ${escapeHtml(selected)}</option>` : ""}${legends.map(legend => `<option value="${escapeHtml(legend.metadata?.key)}" ${legend.metadata?.key === selected ? "selected" : ""}>${escapeHtml(legend.metadata?.textLabel || legend.label)}</option>`).join("")}`;
      return `
        <section class="inspector-section inspector-section--table-rows">
          <div class="inspector-section__heading">
            <h3 class="inspector-section__title">Tabela semântica</h3>
            <span>${columns.length} coluna(s) · ${rows.length} linha(s)</span>
          </div>
          <div class="inspector-grid table-schema-apply">
            <div class="inspector-field inspector-field--full"><label>Esquema reutilizável</label><select data-table-schema>${schemas.map(schema => `<option value="${escapeHtml(schema.id)}" ${component.props?.tableSchemaId === schema.id ? "selected" : ""}>${escapeHtml(schema.label)} · ${escapeHtml(schema.description)}</option>`).join("")}</select></div>
            <button type="button" class="inspector-action--primary inspector-action--wide" data-table-schema-apply>Aplicar esquema</button>
          </div>
          <details class="table-bulk-entry" ${this.tableBulkOpen ? "open" : ""}>
            <summary>Colar várias linhas <span>Excel, Sheets, TSV ou CSV</span></summary>
            <p>A ordem atual das colunas é usada quando o cabeçalho não for colado.</p>
            <textarea rows="6" data-table-bulk-text placeholder="${escapeHtml(columns.map(column => column.label).join("\t"))}&#10;"></textarea>
            <div class="table-bulk-entry__actions"><select aria-label="Modo de colagem" data-table-bulk-mode><option value="replace">Substituir linhas atuais</option><option value="append">Adicionar ao final</option></select><button type="button" data-table-bulk-apply>Aplicar linhas</button></div>
            ${this.tableBulkFeedback ? `<small role="status">${escapeHtml(this.tableBulkFeedback)}</small>` : ""}
          </details>
          <details class="table-column-editor" ${this.tableColumnsOpen ? "open" : ""}>
            <summary>Configurar colunas</summary>
            <div class="table-column-editor__list">
              ${columns.map(column => `<article data-table-column="${escapeHtml(column.key)}">
                <div class="inspector-grid">
                  <div class="inspector-field inspector-field--full"><label>Rótulo</label><input type="text" value="${escapeHtml(column.label)}" data-table-column-key="${escapeHtml(column.key)}" data-table-column-path="label" /></div>
                  <div class="inspector-field"><label>Função</label><select data-table-column-key="${escapeHtml(column.key)}" data-table-column-path="role"><option value="value" ${column.role === "value" ? "selected" : ""}>Valor</option><option value="identifier" ${column.role === "identifier" ? "selected" : ""}>Identificador</option><option value="package" ${column.role === "package" ? "selected" : ""}>Embalagem</option><option value="price" ${column.role === "price" ? "selected" : ""}>Preço</option><option value="measure" ${column.role === "measure" ? "selected" : ""}>Medida</option></select></div>
                  <div class="inspector-field"><label>Alinhar</label><select data-table-column-key="${escapeHtml(column.key)}" data-table-column-path="align"><option value="start" ${column.align === "start" ? "selected" : ""}>Início</option><option value="center" ${column.align === "center" ? "selected" : ""}>Centro</option><option value="end" ${column.align === "end" ? "selected" : ""}>Fim</option></select></div>
                </div>
                <button type="button" data-table-column-remove="${escapeHtml(column.key)}" ${columns.length === 1 ? "disabled" : ""}>Remover coluna</button>
              </article>`).join("")}
            </div>
            <button type="button" class="table-row-editor__add" data-table-column-add ${columns.length >= 12 ? "disabled" : ""}>+ Adicionar coluna</button>
          </details>
          <div class="table-row-editor">
            ${rows.map((row, index) => {
              const values = row.metadata?.values || {};
              return `<article class="table-row-editor__item" data-table-row-card="${escapeHtml(row.id)}">
                <header><strong>Linha ${index + 1}</strong><span>${escapeHtml(row.id)}</span></header>
                <div class="inspector-grid">
                  ${columns.map(column => `<div class="inspector-field inspector-field--full table-cell-editor"><label>${escapeHtml(column.label)}</label><input type="text" value="${escapeHtml(values[column.key] || "")}" data-table-row-id="${escapeHtml(row.id)}" data-table-row-path="${escapeHtml(column.key)}" /><select aria-label="Legenda de ${escapeHtml(column.label)}" data-table-cell-legend data-table-row-id="${escapeHtml(row.id)}" data-table-column-key="${escapeHtml(column.key)}">${legendOptions(row.metadata?.legendKeys?.[column.key])}</select></div>`).join("")}
                </div>
                <div class="table-row-editor__actions">
                  <button type="button" data-table-row-move="-1" data-table-row-id="${escapeHtml(row.id)}" ${index === 0 ? "disabled" : ""}>↑</button>
                  <button type="button" data-table-row-move="1" data-table-row-id="${escapeHtml(row.id)}" ${index === rows.length - 1 ? "disabled" : ""}>↓</button>
                  <button type="button" data-table-row-remove data-table-row-id="${escapeHtml(row.id)}" ${rows.length === 1 ? "disabled" : ""}>Remover</button>
                </div>
              </article>`;
            }).join("")}
          </div>
          <button type="button" class="table-row-editor__add" data-table-row-add>+ Adicionar linha</button>
          <details class="semantic-legend-editor" ${this.legendEditorOpen ? "open" : ""}>
            <summary>Legenda de cores</summary>
            <p>Cor e texto permanecem vinculados por uma chave estável; o texto é o fallback acessível.</p>
            <div class="semantic-legend-editor__list">${legends.map(legend => `<div><span style="--legend-preview:${escapeHtml(window.CATALOG_EDITOR_TOKENS.colors[legend.metadata?.token]?.value || "#f5f6f7")}"></span><strong>${escapeHtml(legend.metadata?.textLabel || legend.label)}<small>${escapeHtml(legend.metadata?.groupLabel || "Geral")}</small></strong><code>${escapeHtml(legend.metadata?.key)}</code><button type="button" data-color-legend-remove="${escapeHtml(legend.id)}" aria-label="Remover legenda">×</button></div>`).join("") || "<small>Nenhuma legenda criada.</small>"}</div>
            <div class="inspector-grid">
              <div class="inspector-field inspector-field--full"><label>Nome da legenda</label><input type="text" placeholder="CX 250" data-new-legend-label /></div>
              <div class="inspector-field inspector-field--full"><label>Grupo visual</label><input type="text" value="Embalagens" placeholder="Embalagens" data-new-legend-group /></div>
              <div class="inspector-field inspector-field--full"><label>Token de cor</label><select data-new-legend-token>${this.colorOptions("pack.250")}</select></div>
            </div>
            <label class="inspector-switch inspector-switch--wide"><input type="checkbox" data-new-legend-materialize checked /><span aria-hidden="true"></span><strong>Adicionar ao painel de legenda</strong></label>
            <button type="button" class="table-row-editor__add" data-color-legend-add>+ Criar legenda</button>
            <details class="table-bulk-entry legend-bulk-entry" ${this.legendBulkOpen ? "open" : ""}>
              <summary>Criar várias legendas <span>Nome ⇥ token ⇥ grupo</span></summary>
              <textarea rows="6" data-legend-bulk-text placeholder="CX 1000&#9;pack.1000&#9;Embalagens&#10;CX 500&#9;pack.500&#9;Embalagens"></textarea>
              <label class="inspector-switch inspector-switch--wide"><input type="checkbox" data-legend-bulk-materialize checked /><span aria-hidden="true"></span><strong>Adicionar ao painel de legenda</strong></label>
              <button type="button" class="table-row-editor__add" data-legend-bulk-apply>Aplicar lista</button>
              ${this.legendBulkFeedback ? `<small role="status">${escapeHtml(this.legendBulkFeedback)}</small>` : ""}
            </details>
          </details>
          <p class="inspector-note">As linhas pertencem a <code>${escapeHtml(component.props.collectionId || "tableRows")}</code>. A tabela guarda colunas, ordem dos IDs e vínculos semânticos; valores continuam na coleção.</p>
        </section>`;
    }

    renderDuplicationSection() {
      return `
        <section class="inspector-section inspector-section--duplication">
          <h3 class="inspector-section__title">Duplicação e distribuição</h3>
          <div class="inspector-grid">
            <div class="inspector-field"><label>Direção</label><select data-duplicate-direction><option value="right">Direita</option><option value="left">Esquerda</option><option value="down">Abaixo</option><option value="up">Acima</option></select></div>
            <div class="inspector-field"><label>Cálculo</label><select data-duplicate-mode><option value="gap">Espaçamento</option><option value="offset">Deslocamento</option></select></div>
            <div class="inspector-field"><label>Distância</label><input type="number" min="0" max="1000" step="1" value="16" data-duplicate-distance /></div>
            <div class="inspector-field"><label>Cópias</label><input type="number" min="1" max="20" step="1" value="1" data-duplicate-count /></div>
          </div>
          <button type="button" class="duplicate-series-button" data-duplicate-series>Criar e distribuir cópias</button>
          <p class="inspector-note">“Espaçamento” soma o tamanho do componente à distância. “Deslocamento” usa somente a distância informada.</p>
        </section>`;
    }

    renderTemplateSection(component) {
      return `
        <section class="inspector-section inspector-section--template">
          <h3 class="inspector-section__title">Componente reutilizável</h3>
          <button type="button" class="template-save-button" data-save-component-template>Salvar em Meus componentes</button>
          <p class="inspector-note">Salva uma cópia completa da subárvore, incluindo slots, tokens, legendas e valores de tabela. Cada inserção recebe novos IDs e numeração editorial.</p>
        </section>`;
    }

    renderProductBindingSection(component) {
      if (component.type !== "product-card") return "";
      const binding = component.binding || { productId: null, templateId: null, overrides: {} };
      const product = this.store.getProduct(binding.productId);
      const products = this.store.getProducts();
      const templates = this.store.getProductTemplates();
      const presentation = window.CatalogPresentations?.normalizePresentation?.(component.presentation, component.type) || { presetId: "product-standard", mode: "standard", density: "standard", responsiveState: "auto" };
      const presets = window.CatalogPresentations?.presetsFor?.("product-card") || [];
      const fieldLabels = {
        title: "Título",
        specOne: "Especificação 1",
        specTwo: "Especificação 2",
        code: "Código",
        package: "Embalagem",
        price: "Preço",
        assetId: "Arte principal"
      };
      return `
        <section class="inspector-section inspector-section--product-binding" data-product-binding-state="${product ? "linked" : "local"}">
          <div class="inspector-section__heading">
            <h3 class="inspector-section__title">Vínculo de conteúdo</h3>
            <span>${product ? "Sincronizado" : "Local"}</span>
          </div>
          <div class="product-binding-summary">
            <strong>${escapeHtml(product?.label || "Conteúdo autônomo")}</strong>
            <span>${product ? "Alterações no inventário chegam a este card sem trocar seus IDs." : "Escolha um produto do inventário para reutilizar conteúdo."}</span>
          </div>
          <div class="inspector-grid">
            <div class="inspector-field inspector-field--full"><label>Produto</label><select data-card-product-id><option value="">Sem vínculo</option>${products.map(item => `<option value="${escapeHtml(item.id)}" ${binding.productId === item.id ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></div>
            <div class="inspector-field inspector-field--full"><label>Template de apresentação</label><select data-card-template-id><option value="">Apresentação atual</option>${templates.map(item => `<option value="${escapeHtml(item.id)}" ${binding.templateId === item.id ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select><small>Troca estrutura e tokens, preservando o conteúdo e o número editorial.</small></div>
          </div>
          <div class="presentation-intent-grid">
            <div class="inspector-field inspector-field--full"><label>Preset</label><select data-presentation-path="presetId">${presets.map(preset => `<option value="${escapeHtml(preset.id)}" ${presentation.presetId === preset.id ? "selected" : ""}>${escapeHtml(preset.label)} · v${escapeHtml(preset.version)}</option>`).join("")}</select></div>
            <div class="inspector-field"><label>Modo</label><select data-presentation-path="mode">${Object.entries(window.CatalogPresentations?.MODES || {}).map(([value, item]) => `<option value="${escapeHtml(value)}" ${presentation.mode === value ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></div>
            <div class="inspector-field"><label>Densidade</label><select data-presentation-path="density">${Object.entries(window.CatalogPresentations?.DENSITIES || {}).map(([value, item]) => `<option value="${escapeHtml(value)}" ${presentation.density === value ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></div>
            <div class="inspector-field inspector-field--full"><label>Estado responsivo</label><select data-presentation-path="responsiveState"><option value="auto" ${presentation.responsiveState === "auto" ? "selected" : ""}>Automático pela largura</option><option value="compact" ${presentation.responsiveState === "compact" ? "selected" : ""}>Forçar compacto</option><option value="wide" ${presentation.responsiveState === "wide" ? "selected" : ""}>Forçar amplo</option></select></div>
          </div>
          <p class="inspector-note">Preset define a intenção inicial; modo e densidade são overrides explícitos. O estado responsivo continua automático.</p>
          ${product ? `<div class="product-override-list"><span>Overrides locais explícitos</span>${Object.entries(fieldLabels).map(([field, label]) => `<label class="inspector-check"><input type="checkbox" data-product-override="${field}" ${binding.overrides?.[field] ? "checked" : ""} /> ${escapeHtml(label)}</label>`).join("")}</div>` : ""}
          <p class="inspector-note">Ao editar um campo sincronizado dentro do card, o override correspondente é ativado. Desmarque-o para receber novamente o valor do inventário.</p>
        </section>`;
    }

    commonValue(items, getter) {
      if (!items.length) return "";
      const first = getter(items[0]);
      return items.every(item => getter(item) === first) ? first : "";
    }

    taskStateKey(component) {
      return component?.type || "unknown";
    }

    rememberTaskState(component = this.store.getSelected()) {
      if (!component) return;
      this.taskStateByType.set(this.taskStateKey(component), {
        activeTab: this.activeTab,
        showAllProperties: this.showAllProperties,
        tableColumnsOpen: this.tableColumnsOpen,
        tableBulkOpen: this.tableBulkOpen,
        legendEditorOpen: this.legendEditorOpen,
        galleryBulkOpen: this.galleryBulkOpen,
        legendBulkOpen: this.legendBulkOpen
      });
    }

    captureRenderedTaskState() {
      if (!this.lastComponentType || !this.lastComponentId) return;
      this.taskStateByType.set(this.lastComponentType, {
        activeTab: this.activeTab,
        showAllProperties: this.showAllProperties,
        tableColumnsOpen: this.root.querySelector(".table-column-editor")?.open === true,
        tableBulkOpen: this.root.querySelector(".table-bulk-entry:not(.gallery-bulk-entry):not(.legend-bulk-entry)")?.open === true,
        legendEditorOpen: this.root.querySelector(".semantic-legend-editor")?.open === true,
        galleryBulkOpen: this.root.querySelector(".gallery-bulk-entry")?.open === true,
        legendBulkOpen: this.root.querySelector(".legend-bulk-entry")?.open === true
      });
    }

    restoreTaskState(component, definition) {
      const saved = this.taskStateByType.get(this.taskStateKey(component));
      this.activeTab = saved?.activeTab || (definition.container ? "structure" : "content");
      this.showAllProperties = saved?.showAllProperties === true;
      this.tableColumnsOpen = saved?.tableColumnsOpen === true;
      this.tableBulkOpen = saved?.tableBulkOpen === true;
      this.legendEditorOpen = saved?.legendEditorOpen === true;
      this.galleryBulkOpen = saved?.galleryBulkOpen === true;
      this.legendBulkOpen = saved?.legendBulkOpen === true;
      this.tableBulkFeedback = "";
      this.galleryBulkFeedback = "";
      this.legendBulkFeedback = "";
    }

    renderBatch(components) {
      const records = components.map(component => this.store.findComponent(component.id)).filter(Boolean);
      const contextLabel = records[0]?.parent?.name || this.store.getPage().name;
      const cards = Array.from(new Map(components.map(component => this.store.getProductCard(component.id)).filter(Boolean).map(card => [card.id, card])).values());
      const tables = this.store.getTablesForComponents(components);
      const tableSchemas = this.store.getTableSchemas();
      const accentEligible = components.filter(component => window.CATALOG_COMPONENT_REGISTRY[component.type]?.styleFields?.includes("accentColor"));
      const textEligible = components.filter(component => window.CATALOG_COMPONENT_REGISTRY[component.type]?.styleFields?.includes("textColor"));
      const density = this.commonValue(cards, card => card.presentation?.density || "standard");
      const mode = this.commonValue(cards, card => card.presentation?.mode || "standard");
      const presetId = this.commonValue(cards, card => card.presentation?.presetId || "product-standard");
      const accentColor = this.commonValue(accentEligible, component => component.style?.accentColor || "brand.primary");
      const textColor = this.commonValue(textEligible, component => component.style?.textColor || "text.primary");
      const frameValues = Object.fromEntries(["x", "y", "width", "height"].map(path => [path, this.commonValue(components, component => Math.round(component.frame[path]))]));
      const geometryReport = this.store.getSelectionGeometryReport(components.map(component => component.id));
      const mixedOption = value => value ? "" : '<option value="" selected disabled>Valores diferentes — escolher para aplicar</option>';
      const presets = Object.values(window.CatalogPresentations?.PRESETS || {});
      const separatorPresets = Object.values(window.CATALOG_SEPARATOR_PRESETS || {});
      const typeCounts = components.reduce((counts, component) => {
        const label = window.CATALOG_COMPONENT_REGISTRY[component.type]?.label || component.type;
        counts[label] = (counts[label] || 0) + 1;
        return counts;
      }, {});

      this.root.dataset.hasSelection = "true";
      this.root.dataset.multiSelection = "true";
      this.captureRenderedTaskState();
      this.lastComponentId = null;
      this.lastComponentType = null;
      this.root.innerHTML = `
        <header class="inspector-header inspector-header--batch">
          <div class="inspector-header__top">
            <div><span class="panel-kicker">Seleção múltipla</span><h2>${components.length} componentes</h2></div>
            <div class="inspector-header__actions">
              <button type="button" class="inspector-duplicate" data-batch-duplicate title="Duplicar seleção" aria-label="Duplicar seleção">${icon("duplicate", "inspector-action__icon")}</button>
              <button type="button" class="inspector-delete" data-batch-delete title="Excluir seleção" aria-label="Excluir seleção">×</button>
            </div>
          </div>
          <div class="inspector-context-line"><span>Dentro de</span><strong>${escapeHtml(contextLabel)}</strong></div>
          <div class="batch-type-summary">${Object.entries(typeCounts).map(([label, count]) => `<span>${count}× ${escapeHtml(label)}</span>`).join("")}</div>
        </header>
        <div class="inspector-tab-panel batch-inspector">
          <section class="inspector-section">
            <h3 class="inspector-section__title">Geometria do conjunto</h3>
            <p class="inspector-note">Precisão direta, relacional e numérica na mesma seleção. Itens gerenciados passam a posição independente; uma ação desfaz o comando inteiro.</p>
            <div class="batch-geometry-status" data-geometry-state="${geometryReport.ok ? "valid" : "warning"}"><strong>${geometryReport.ok ? "Seleção sem conflitos detectados" : `${geometryReport.issues.length} conflito(s) geométrico(s)`}</strong><span>${geometryReport.ok ? "Nenhuma colisão ou extrapolação vinculada à seleção." : "Revise colisões e conteúdo fora dos limites antes de exportar."}</span></div>
            <div class="inspector-section__heading"><h4>Relações</h4><span>alinhar e distribuir</span></div>
            <div class="batch-command-grid" aria-label="Alinhamento da seleção">
              <button type="button" data-batch-align="left" title="Alinhar à esquerda">← Esquerda</button>
              <button type="button" data-batch-align="center" title="Centralizar horizontalmente">↔ Centro</button>
              <button type="button" data-batch-align="right" title="Alinhar à direita">Direita →</button>
              <button type="button" data-batch-align="top" title="Alinhar ao topo">↑ Topo</button>
              <button type="button" data-batch-align="middle" title="Centralizar verticalmente">↕ Meio</button>
              <button type="button" data-batch-align="bottom" title="Alinhar à base">Base ↓</button>
            </div>
            <div class="inspector-actions inspector-actions--grid">
              <button type="button" data-batch-distribute="horizontal" ${components.length < 3 ? "disabled" : ""}>Distribuir ↔</button>
              <button type="button" data-batch-distribute="vertical" ${components.length < 3 ? "disabled" : ""}>Distribuir ↕</button>
              <button type="button" data-batch-equalize="width">Igualar larguras</button>
              <button type="button" data-batch-equalize="height">Igualar alturas</button>
            </div>
            <div class="batch-numeric-editor">
              <div class="inspector-section__heading"><h4>Valores exatos</h4><span>aplicar à seleção</span></div>
              <div class="batch-frame-grid">
                ${["x", "y", "width", "height"].map(path => `<div class="batch-frame-field"><label>${path === "width" ? "Largura" : path === "height" ? "Altura" : path.toUpperCase()}</label><input type="number" step="1" value="${frameValues[path] ?? ""}" placeholder="Misto" data-batch-frame-value="${path}" /><button type="button" data-batch-frame-apply="${path}">Aplicar</button></div>`).join("")}
              </div>
              <div class="inspector-section__heading"><h4>Deslocamento</h4><span>delta relativo</span></div>
              <div class="inspector-grid">
                <div class="inspector-field"><label>Delta X</label><input type="number" step="1" value="0" data-batch-delta="x" /></div>
                <div class="inspector-field"><label>Delta Y</label><input type="number" step="1" value="0" data-batch-delta="y" /></div>
              </div>
              <button type="button" class="inspector-action--primary inspector-action--wide" data-batch-delta-apply>Aplicar deslocamento</button>
            </div>
            <div class="batch-spacing-editor">
              <div class="inspector-section__heading"><h4>Espaçamento definido</h4><span>2 ou mais irmãos</span></div>
              <div class="inspector-grid">
                <div class="inspector-field"><label>Eixo</label><select data-batch-spacing-axis><option value="auto">Automático</option><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option></select></div>
                <div class="inspector-field"><label>Preset</label><select data-batch-gap-preset><option value="6">Compacto · 6 px</option><option value="12" selected>Padrão · 12 px</option><option value="20">Confortável · 20 px</option><option value="custom">Personalizado</option></select></div>
                <div class="inspector-field inspector-field--full"><label>Distância</label><input type="number" min="0" max="1000" step="1" value="12" data-batch-gap /></div>
              </div>
              <label class="inspector-switch inspector-switch--wide"><input type="checkbox" data-batch-separators /><span aria-hidden="true"></span><strong>Adicionar separadores entre os itens</strong></label>
              <div class="inspector-field inspector-field--full"><label>Preset da linha</label><select data-batch-separator-preset>${separatorPresets.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join("")}</select><small>Separadores exigem gap superior a 6 px e continuam editáveis como átomos.</small></div>
              <button type="button" class="inspector-action--primary" data-batch-spacing-apply>Aplicar espaçamento</button>
            </div>
          </section>
          ${cards.length ? `<section class="inspector-section">
            <div class="inspector-section__heading"><h3 class="inspector-section__title">Apresentação dos cards</h3><span>${cards.length} elegível(is)</span></div>
            <div class="inspector-grid">
              <div class="inspector-field inspector-field--full"><label>Preset</label><select data-batch-presentation="presetId">${mixedOption(presetId)}${presets.map(preset => `<option value="${escapeHtml(preset.id)}" ${presetId === preset.id ? "selected" : ""}>${escapeHtml(preset.label)}</option>`).join("")}</select></div>
              <div class="inspector-field"><label>Modo</label><select data-batch-presentation="mode">${mixedOption(mode)}${Object.entries(window.CatalogPresentations?.MODES || {}).map(([value, item]) => `<option value="${escapeHtml(value)}" ${mode === value ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></div>
              <div class="inspector-field"><label>Densidade</label><select data-batch-presentation="density">${mixedOption(density)}${Object.entries(window.CatalogPresentations?.DENSITIES || {}).map(([value, item]) => `<option value="${escapeHtml(value)}" ${density === value ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></div>
            </div>
          </section>` : ""}
          ${tables.length ? `<section class="inspector-section">
            <div class="inspector-section__heading"><h3 class="inspector-section__title">Esquema das tabelas</h3><span>${tables.length} elegível(is)</span></div>
            <p class="inspector-note">Aplica a mesma estrutura de colunas em uma única transação, preservando valores pelo papel semântico.</p>
            <div class="inspector-field inspector-field--full"><label>Esquema reutilizável</label><select data-batch-table-schema>${tableSchemas.map(schema => `<option value="${escapeHtml(schema.id)}">${escapeHtml(schema.label)} · ${escapeHtml(schema.description)}</option>`).join("")}</select></div>
            <button type="button" class="inspector-action--primary inspector-action--wide" data-batch-table-schema-apply>Aplicar a ${tables.length} tabela(s)</button>
          </section>` : ""}
          ${accentEligible.length || textEligible.length ? `<section class="inspector-section">
            <div class="inspector-section__heading"><h3 class="inspector-section__title">Visual compartilhado</h3><span>somente elegíveis</span></div>
            <div class="inspector-grid">
              ${accentEligible.length ? `<div class="inspector-field inspector-field--full"><label>Cor de destaque · ${accentEligible.length}</label><select data-batch-style="accentColor">${mixedOption(accentColor)}${this.colorOptions(accentColor)}</select></div>` : ""}
              ${textEligible.length ? `<div class="inspector-field inspector-field--full"><label>Cor do texto · ${textEligible.length}</label><select data-batch-style="textColor">${mixedOption(textColor)}${this.colorOptions(textColor)}</select></div>` : ""}
            </div>
          </section>` : ""}
          <section class="inspector-section batch-shortcuts">
            <h3 class="inspector-section__title">Atalhos</h3>
            <p><kbd>Shift</kbd>/<kbd>Ctrl</kbd>/<kbd>⌘</kbd> + clique adiciona ou remove. <kbd>Ctrl/⌘ A</kbd> seleciona os irmãos do contexto.</p>
            <div class="inspector-actions inspector-actions--grid">
              <button type="button" data-batch-duplicate>Duplicar conjunto</button>
              <button type="button" data-batch-delete>Excluir conjunto</button>
            </div>
          </section>
        </div>`;
    }

    render() {
      const selectedComponents = this.store.getSelectedComponents();
      if (selectedComponents.length > 1) {
        this.renderBatch(selectedComponents);
        return;
      }
      this.root.dataset.multiSelection = "false";
      const component = this.store.getSelected();
      const record = this.store.getSelectedRecord();
      if (!component || !record) {
        this.root.dataset.hasSelection = "false";
        this.captureRenderedTaskState();
        this.lastComponentId = null;
        this.lastComponentType = null;
        this.root.innerHTML = `
          <div class="inspector-empty">
            <span class="inspector-empty__icon" aria-hidden="true">↖</span>
            <strong>Nenhum componente selecionado</strong>
            <p>Selecione um item da página para editar posição, tamanho e estilos definidos na biblioteca.</p>
          </div>`;
        return;
      }

      const definition = window.CATALOG_COMPONENT_REGISTRY[component.type];
      if (this.lastComponentId !== component.id) {
        this.captureRenderedTaskState();
        this.lastComponentId = component.id;
        this.lastComponentType = component.type;
        this.restoreTaskState(component, definition);
      }
      const contextLabel = record.parent ? record.parent.name : this.store.getPage().name;
      const minimum = this.store.getContentMinimum(component);
      const minimumProfile = this.store.getMinimumProfile(component);
      const geometryResolution = this.store.getLastGeometryResolution(component.id);
      const geometryAdjusted = geometryResolution && ["x", "y", "width", "height"].some(key => geometryResolution.requested[key] !== geometryResolution.resolved[key]);
      const contentSection = definition.contentFields?.length ? `
        <section class="inspector-section">
          <h3 class="inspector-section__title">Conteúdo</h3>
          <div class="inspector-grid">${definition.contentFields.map(field => this.field(field, component)).join("")}</div>
        </section>` : "";
      const styleSection = definition.styleFields?.length ? `
        <section class="inspector-section">
          <h3 class="inspector-section__title">Biblioteca visual</h3>
          <div class="inspector-grid">${definition.styleFields.map(name => this.styleField(name, component)).join("")}</div>
          <p class="inspector-note">Cores, tipografia, bordas e raios são selecionados apenas pelos tokens formalizados na biblioteca.</p>
        </section>` : "";
      const identificationSection = `
        <section class="inspector-section">
          <h3 class="inspector-section__title">Identificação</h3>
          <div class="inspector-grid">
            <div class="inspector-field inspector-field--full"><label>Nome da camada</label><input type="text" value="${escapeHtml(component.name)}" data-component-name /></div>
          </div>
        </section>`;
      const geometrySection = `
        <section class="inspector-section">
          <h3 class="inspector-section__title">Posição e tamanho</h3>
          <div class="inspector-grid">
            ${["x", "y", "width", "height"].map(key => `<div class="inspector-field"><label>${key === "width" ? "Largura" : key === "height" ? "Altura" : key.toUpperCase()}</label><input type="number" step="1" value="${Math.round(component.frame[key])}" data-frame-path="${key}" /></div>`).join("")}
          </div>
          <div class="inspector-checks" style="margin-top:10px">
            <label class="inspector-check"><input type="checkbox" data-constraint-path="snapX" ${component.constraints.snapX ? "checked" : ""} /> Snap X</label>
            <label class="inspector-check"><input type="checkbox" data-constraint-path="snapY" ${component.constraints.snapY ? "checked" : ""} /> Snap Y</label>
            <label class="inspector-check"><input type="checkbox" data-constraint-path="freeX" ${component.constraints.freeX ? "checked" : ""} /> Livre X</label>
            <label class="inspector-check"><input type="checkbox" data-constraint-path="freeY" ${component.constraints.freeY ? "checked" : ""} /> Livre Y</label>
          </div>
          <div class="minimum-size-note"><span>Mínimo técnico</span><strong>${Math.ceil(minimumProfile.technical.width)} × ${Math.ceil(minimumProfile.technical.height)} px</strong></div>
          <div class="minimum-size-note"><span>Calculado pelo conteúdo</span><strong>${Math.ceil(minimum.width)} × ${Math.ceil(minimum.height)} px</strong></div>
          ${geometryAdjusted ? `<div class="geometry-resolution-note"><strong>Pedido → aplicado</strong><span>${Math.round(geometryResolution.requested.width)} × ${Math.round(geometryResolution.requested.height)} → ${Math.round(geometryResolution.resolved.width)} × ${Math.round(geometryResolution.resolved.height)} px</span><small>${geometryResolution.reasons.includes("minimum-or-content") ? "O mínimo técnico ou o conteúdo exigiu mais espaço." : "A grade ou os limites do contexto ajustaram a posição."}</small></div>` : ""}
          <div class="recommended-minimum-editor">
            <label class="inspector-switch inspector-switch--wide"><input type="checkbox" data-custom-minimum-enabled ${minimumProfile.custom ? "checked" : ""} /><span aria-hidden="true"></span><strong>Personalizar tamanho recomendado</strong></label>
            <div class="inspector-grid">
              <div class="inspector-field"><label>Largura recomendada</label><input type="number" min="${Math.ceil(minimumProfile.technical.width)}" step="1" value="${Math.ceil(minimumProfile.custom?.width || minimumProfile.recommended.width)}" data-custom-minimum-path="width" ${minimumProfile.custom ? "" : "disabled"} /></div>
              <div class="inspector-field"><label>Altura recomendada</label><input type="number" min="${Math.ceil(minimumProfile.technical.height)}" step="1" value="${Math.ceil(minimumProfile.custom?.height || minimumProfile.recommended.height)}" data-custom-minimum-path="height" ${minimumProfile.custom ? "" : "disabled"} /></div>
            </div>
          </div>
          <p class="inspector-note">O técnico protege conteúdo e estrutura. O recomendado orienta presets e pode ser personalizado sem virar uma barreira rígida. Grid: ${component.constraints.gridUnit} px.</p>
        </section>`;

      this.root.dataset.hasSelection = "true";

      this.root.innerHTML = `
        <header class="inspector-header">
          <div class="inspector-header__top">
            <div>
              <span class="panel-kicker">${record.parent ? "Peça interna" : "Componente"}</span>
              <h2>${escapeHtml(definition.label)}</h2>
              <code>${escapeHtml(component.id)}</code>
            </div>
            <div class="inspector-header__actions">
              <button type="button" class="inspector-duplicate" data-duplicate-component title="Duplicar componente" aria-label="Duplicar componente">${icon("duplicate", "inspector-action__icon")}</button>
              <button type="button" class="inspector-delete" data-delete-component title="Excluir componente" aria-label="Excluir componente">×</button>
            </div>
          </div>
          <div class="inspector-context-line"><span>Dentro de</span><strong>${escapeHtml(contextLabel)}</strong></div>
          <button type="button" class="inspector-disclosure" data-toggle-all-properties aria-pressed="${String(this.showAllProperties)}">${this.showAllProperties ? "Ocultar avançado" : "Mostrar avançado"}</button>
        </header>
        <nav class="inspector-tabs" role="tablist" aria-label="Categorias de propriedades">
          <button type="button" role="tab" data-inspector-tab="content" aria-selected="${String(this.activeTab === "content")}"><span aria-hidden="true">◎</span> Conteúdo</button>
          <button type="button" role="tab" data-inspector-tab="structure" aria-selected="${String(this.activeTab === "structure")}"><span aria-hidden="true">▦</span> Layout</button>
          <button type="button" role="tab" data-inspector-tab="style" aria-selected="${String(this.activeTab === "style")}"><span aria-hidden="true">⌁</span> Visual</button>
        </nav>
        <div class="inspector-tab-panel" role="tabpanel" data-inspector-panel="structure" ${this.activeTab === "structure" ? "" : "hidden"}>
          ${this.renderContainerSection(component, definition)}
          ${this.renderSlotSection(component, record)}
          ${this.renderTemplateSection(component)}
          ${this.renderDuplicationSection(component)}
        </div>
        <div class="inspector-tab-panel" role="tabpanel" data-inspector-panel="content" ${this.activeTab === "content" ? "" : "hidden"}>
          ${this.renderProductBindingSection(component)}
          ${this.renderAssetSection(component)}
          ${this.renderGallerySection(component)}
          ${this.renderTableRowsSection(component)}
          ${contentSection}
        </div>
        <div class="inspector-tab-panel" role="tabpanel" data-inspector-panel="style" ${this.activeTab === "style" ? "" : "hidden"}>
          ${styleSection || '<div class="inspector-tab-empty">Este tipo não expõe tokens visuais.</div>'}
        </div>
        ${this.showAllProperties ? `<details class="inspector-advanced" open><summary data-toggle-all-properties>Avançado</summary>${geometrySection}${identificationSection}</details>` : '<button type="button" class="inspector-secondary-disclosure" data-toggle-all-properties>Mostrar posição, tamanho, mínimos e identificação</button>'}`;
    }

    update(patch) {
      const component = this.store.getSelected();
      if (component) this.store.updateComponent(component.id, patch);
    }

    handleDisclosureToggle(event) {
      if (event.target.matches(".table-column-editor")) this.tableColumnsOpen = event.target.open;
      if (event.target.matches(".table-bulk-entry:not(.gallery-bulk-entry):not(.legend-bulk-entry)")) this.tableBulkOpen = event.target.open;
      if (event.target.matches(".gallery-bulk-entry")) this.galleryBulkOpen = event.target.open;
      if (event.target.matches(".legend-bulk-entry")) this.legendBulkOpen = event.target.open;
      if (event.target.matches(".semantic-legend-editor")) this.legendEditorOpen = event.target.open;
      this.rememberTaskState();
    }

    handleChange(event) {
      const target = event.target;
      const selectedIds = this.store.getSelectedIds();
      if (selectedIds.length > 1 && target.matches("[data-batch-gap-preset]")) {
        const input = this.root.querySelector("[data-batch-gap]");
        if (input) {
          input.disabled = target.value !== "custom";
          if (target.value !== "custom") input.value = target.value;
        }
        return;
      }
      if (selectedIds.length > 1 && target.matches("[data-batch-presentation]")) {
        const path = target.dataset.batchPresentation;
        if (path === "presetId") {
          const preset = window.CatalogPresentations?.PRESETS?.[target.value];
          this.store.setPresentationBatch(selectedIds, { presetId: target.value, mode: preset?.mode, density: preset?.density });
        } else {
          this.store.setPresentationBatch(selectedIds, { [path]: target.value, ...(path === "density" ? { responsiveState: target.value === "compact" ? "compact" : "auto" } : {}) });
        }
        return;
      }
      if (selectedIds.length > 1 && target.matches("[data-batch-style]")) {
        this.store.setStyleBatch(selectedIds, { [target.dataset.batchStyle]: target.value });
        return;
      }
      const component = this.store.getSelected();
      if (target.matches("[data-table-row-path]")) {
        this.store.updateTableRow(component.id, target.dataset.tableRowId, { [target.dataset.tableRowPath]: target.value });
      } else if (target.matches("[data-table-column-path]")) {
        const columns = this.store.getTableColumns(component).map(column => column.key === target.dataset.tableColumnKey
          ? { ...column, [target.dataset.tableColumnPath]: target.dataset.tableColumnPath === "width" ? Number(target.value) : target.value }
          : column);
        this.store.updateTableColumns(component.id, columns);
      } else if (target.matches("[data-table-cell-legend]")) {
        this.store.setTableCellLegend(component.id, target.dataset.tableRowId, target.dataset.tableColumnKey, target.value || null);
      } else if (target.matches("[data-card-product-id]")) {
        if (target.value) this.store.bindProduct(component.id, target.value, { preserveOverrides: true });
        else this.store.unbindProduct(component.id);
      } else if (target.matches("[data-card-template-id]")) {
        this.store.setCardPresentationTemplate(component.id, target.value || null);
      } else if (target.matches("[data-product-override]")) {
        this.store.setCardOverride(component.id, target.dataset.productOverride, target.checked);
      } else if (target.matches("[data-presentation-path]")) {
        const path = target.dataset.presentationPath;
        if (path === "presetId") {
          const preset = window.CatalogPresentations?.PRESETS?.[target.value];
          this.store.setComponentPresentation(component.id, { presetId: target.value, mode: preset?.mode, density: preset?.density });
        } else {
          this.store.setComponentPresentation(component.id, { [path]: target.value });
        }
      } else if (target.matches("[data-custom-minimum-enabled]")) {
        const width = this.root.querySelector('[data-custom-minimum-path="width"]')?.value;
        const height = this.root.querySelector('[data-custom-minimum-path="height"]')?.value;
        this.store.setRecommendedMinimum(component.id, { enabled: target.checked, width, height });
      } else if (target.matches("[data-custom-minimum-path]")) {
        const width = this.root.querySelector('[data-custom-minimum-path="width"]')?.value;
        const height = this.root.querySelector('[data-custom-minimum-path="height"]')?.value;
        this.store.setRecommendedMinimum(component.id, { enabled: true, width, height });
      } else if (target.matches("[data-frame-path]")) {
        const record = this.store.getSelectedRecord();
        const key = target.dataset.framePath;
        const value = Number(target.value);
        if (component.slot?.name) this.store.markSlotFree(component.id);
        if (record?.parent && window.CATALOG_COMPONENT_REGISTRY[record.parent.type]?.container?.autoLayout) this.store.markLayoutFree(component.id);
        this.update({ frame: { [key]: value } });
      } else if (target.matches("[data-constraint-path]")) {
        this.update({ constraints: { [target.dataset.constraintPath]: target.checked } });
      } else if (target.matches("[data-style-path]")) {
        this.update({ style: { [target.dataset.stylePath]: target.value } });
      } else if (target.matches('[data-prop-path="number"]') && component.type === "title-symbol") {
        const plan = this.store.getCardNumberChangePlan(component.id, target.value);
        if (!plan.cardId) {
          this.update({ props: { number: target.value } });
          return;
        }
        const options = {};
        if (plan.kind === "duplicate") {
          options.compact = window.confirm(`O número ${String(plan.requested).padStart(2, "0")} já existe. Reajustar os cards posteriores para compactar a sequência?`);
        } else if (plan.kind === "above") {
          options.continueFrom = window.confirm(`O número ${String(plan.requested).padStart(2, "0")} está acima da sequência atual. Continuar os próximos cards a partir dele?`);
        }
        this.store.updateCardNumber(component.id, target.value, options);
      } else if (target.matches('[data-prop-path="presetId"]') && component.type === "separator") {
        const preset = window.CATALOG_SEPARATOR_PRESETS?.[target.value];
        if (preset) this.update({ props: { presetId: preset.id, thickness: preset.thickness, cap: preset.cap, marker: preset.marker } });
      } else if (target.matches("[data-prop-path]")) {
        const value = target.dataset.propType === "number" ? Number(target.value) : target.dataset.propType === "checkbox" ? target.checked : target.value;
        this.update({ props: { [target.dataset.propPath]: value } });
      } else if (target.matches("[data-component-name]")) {
        this.update({ name: target.value });
      } else if (target.matches("[data-layout-path]")) {
        const key = target.dataset.layoutPath;
        const value = ["gap", "padding", "columns"].includes(key) ? Number(target.value) : target.value;
        this.update({ layout: { [key]: value } });
      } else if (target.matches("[data-layout-responsive]")) {
        const key = target.dataset.layoutResponsive;
        const value = key === "enabled" ? target.checked : key === "breakpoint" ? Number(target.value) : target.value;
        this.update({ layout: { responsive: { [key]: value } } });
      } else if (target.matches("[data-layout-item-managed]")) {
        const component = this.store.getSelected();
        this.store.setComponentLayoutAuthority(component.id, target.checked);
      } else if (target.matches("[data-slot-span]")) {
        const component = this.store.getSelected();
        if (!this.store.updateSlotSpan(component.id, Number(target.value))) this.render();
      } else if (target.matches("[data-slot-name]")) {
        const component = this.store.getSelected();
        const slotName = target.value || null;
        let replace = false;
        if (slotName) {
          const parentId = this.store.getParentId(component.id);
          const slot = this.store.getSlotDefinitions(parentId).find(item => item.name === slotName);
          const requestedSpan = component.slot?.span || 1;
          const usage = this.store.getSlotUsage(parentId, slotName, component.id);
          if (slot && usage + requestedSpan > slot.capacity) {
            replace = window.confirm(`O slot “${slot.label}” já está ocupado. Substituir o conteúdo atual?`);
            if (!replace) {
              this.render();
              return;
            }
          }
        }
        this.store.moveComponentToSlot(component.id, slotName, { replace, slotSpan: component.slot?.span || 1 });
      }
    }

    handleClick(event) {
      const selectedIds = this.store.getSelectedIds();
      if (selectedIds.length > 1) {
        const align = event.target.closest("[data-batch-align]");
        const distribute = event.target.closest("[data-batch-distribute]");
        const equalize = event.target.closest("[data-batch-equalize]");
        const frameApply = event.target.closest("[data-batch-frame-apply]");
        if (align) this.store.alignComponents(selectedIds, align.dataset.batchAlign);
        else if (distribute) this.store.distributeComponents(selectedIds, distribute.dataset.batchDistribute);
        else if (equalize) this.store.transformComponents(selectedIds, { kind: "equalize", path: equalize.dataset.batchEqualize });
        else if (frameApply) {
          const path = frameApply.dataset.batchFrameApply;
          const value = this.root.querySelector(`[data-batch-frame-value="${path}"]`)?.value;
          if (value !== "") this.store.transformComponents(selectedIds, { kind: "set", path, value });
        }
        else if (event.target.closest("[data-batch-delta-apply]")) {
          const x = Number(this.root.querySelector('[data-batch-delta="x"]')?.value || 0);
          const y = Number(this.root.querySelector('[data-batch-delta="y"]')?.value || 0);
          if (x || y) this.store.transformComponents(selectedIds, { kind: "delta", values: { x, y } });
        }
        else if (event.target.closest("[data-batch-spacing-apply]")) {
          try {
            this.store.spaceComponents(selectedIds, {
              axis: this.root.querySelector("[data-batch-spacing-axis]")?.value || "auto",
              gap: this.root.querySelector("[data-batch-gap]")?.value || 0,
              separators: this.root.querySelector("[data-batch-separators]")?.checked === true,
              separatorPresetId: this.root.querySelector("[data-batch-separator-preset]")?.value || "subtle"
            });
          } catch (error) {
            const status = document.getElementById("documentStatus");
            if (status) status.textContent = error.message;
          }
        }
        else if (event.target.closest("[data-batch-table-schema-apply]")) {
          this.store.applyTableSchema(selectedIds, this.root.querySelector("[data-batch-table-schema]")?.value);
        }
        else if (event.target.closest("[data-batch-duplicate]")) this.store.duplicateComponents(selectedIds);
        else if (event.target.closest("[data-batch-delete]")) this.store.deleteComponents(selectedIds);
        else return;
        return;
      }
      const component = this.store.getSelected();
      if (!component) return;
      const tab = event.target.closest("[data-inspector-tab]");
      if (tab) {
        this.activeTab = tab.dataset.inspectorTab;
        this.rememberTaskState(component);
        this.render();
      } else if (event.target.closest("[data-toggle-all-properties]")) {
        this.showAllProperties = !this.showAllProperties;
        this.rememberTaskState(component);
        this.render();
      } else if (event.target.closest("[data-delete-component]")) {
        this.store.deleteComponent(component.id);
      } else if (event.target.closest("[data-duplicate-component]")) {
        this.store.duplicateComponent(component.id);
      } else if (event.target.closest("[data-save-component-template]")) {
        const label = window.prompt("Nome do componente em Meus componentes:", component.name || "Componente salvo");
        if (label?.trim()) this.store.saveComponentAsTemplate(component.id, label.trim());
      } else if (event.target.closest("[data-duplicate-series]")) {
        this.store.duplicateComponentSeries(component.id, {
          direction: this.root.querySelector("[data-duplicate-direction]")?.value,
          mode: this.root.querySelector("[data-duplicate-mode]")?.value,
          distance: this.root.querySelector("[data-duplicate-distance]")?.value,
          count: this.root.querySelector("[data-duplicate-count]")?.value
        });
      } else if (event.target.closest("[data-gallery-bulk-apply]")) {
        this.galleryBulkOpen = true;
        const parsed = window.CatalogManualEntry.parseGallery(this.root.querySelector("[data-gallery-bulk-text]")?.value || "");
        if (!parsed.rows.length) this.galleryBulkFeedback = parsed.issues[0]?.message || "Nenhuma variação válida foi encontrada.";
        else {
          try {
            const items = this.store.applyGalleryItemsBulk(component.id, parsed.rows, { mode: this.root.querySelector("[data-gallery-bulk-mode]")?.value || "replace" });
            const warning = parsed.issues.find(issue => issue.severity === "warning");
            this.galleryBulkFeedback = `${items.length} imagem(ns) na galeria${warning ? `; ${warning.message}` : ""}.`;
          } catch (error) { this.galleryBulkFeedback = error.message; }
        }
        this.render();
      } else if (event.target.closest("[data-table-bulk-apply]")) {
        this.tableBulkOpen = true;
        const text = this.root.querySelector("[data-table-bulk-text]")?.value || "";
        const mode = this.root.querySelector("[data-table-bulk-mode]")?.value || "replace";
        const parsed = window.CatalogManualEntry.parseTable(text, this.store.getTableColumns(component));
        if (!parsed.rows.length) {
          this.tableBulkFeedback = parsed.issues[0]?.message || "Nenhuma linha válida foi encontrada.";
          this.render();
          return;
        }
        try {
          const rows = this.store.replaceTableRowsBulk(component.id, parsed.rows, { mode });
          const warning = parsed.issues.find(issue => issue.severity === "warning");
          this.tableBulkFeedback = `${rows.length} linha(s) na tabela${warning ? `; ${warning.message}` : ""}.`;
        } catch (error) {
          this.tableBulkFeedback = error.message;
        }
        this.render();
      } else if (event.target.closest("[data-table-schema-apply]")) {
        this.store.applyTableSchema([component.id], this.root.querySelector("[data-table-schema]")?.value);
      } else if (event.target.closest("[data-table-row-add]")) {
        const values = Object.fromEntries(this.store.getTableColumns(component).map(column => [column.key, column.role === "price" ? "R$ 0,00" : column.role === "identifier" ? "0000" : ""]));
        this.store.addTableRow(component.id, values);
      } else if (event.target.closest("[data-table-column-add]")) {
        this.tableColumnsOpen = true;
        this.store.addTableColumn(component.id);
      } else if (event.target.closest("[data-table-column-remove]")) {
        this.tableColumnsOpen = true;
        this.store.removeTableColumn(component.id, event.target.closest("[data-table-column-remove]").dataset.tableColumnRemove);
      } else if (event.target.closest("[data-color-legend-add]")) {
        this.legendEditorOpen = true;
        const label = this.root.querySelector("[data-new-legend-label]")?.value?.trim();
        const token = this.root.querySelector("[data-new-legend-token]")?.value;
        const groupLabel = this.root.querySelector("[data-new-legend-group]")?.value?.trim() || "Geral";
        const materialize = this.root.querySelector("[data-new-legend-materialize]")?.checked === true;
        if (label) this.store.upsertColorLegend({ label, token, textLabel: label, groupLabel }, { materialize, groupLabel });
      } else if (event.target.closest("[data-legend-bulk-apply]")) {
        this.legendEditorOpen = true;
        this.legendBulkOpen = true;
        const parsed = window.CatalogManualEntry.parseLegends(this.root.querySelector("[data-legend-bulk-text]")?.value || "");
        if (!parsed.rows.length) this.legendBulkFeedback = parsed.issues[0]?.message || "Nenhuma legenda válida foi encontrada.";
        else {
          try {
            const items = this.store.upsertColorLegendsBulk(parsed.rows, { materialize: this.root.querySelector("[data-legend-bulk-materialize]")?.checked === true });
            const warning = parsed.issues.find(issue => issue.severity === "warning");
            this.legendBulkFeedback = `${items.length} legenda(s) criada(s)${warning ? `; ${warning.message}` : ""}.`;
          } catch (error) { this.legendBulkFeedback = error.message; }
        }
        this.render();
      } else if (event.target.closest("[data-color-legend-remove]")) {
        this.legendEditorOpen = true;
        this.store.removeColorLegend(event.target.closest("[data-color-legend-remove]").dataset.colorLegendRemove);
      } else if (event.target.closest("[data-table-row-remove]")) {
        const button = event.target.closest("[data-table-row-remove]");
        this.store.removeTableRow(component.id, button.dataset.tableRowId);
      } else if (event.target.closest("[data-table-row-move]")) {
        const button = event.target.closest("[data-table-row-move]");
        this.store.reorderTableRow(component.id, button.dataset.tableRowId, Number(button.dataset.tableRowMove));
      } else if (event.target.closest("[data-restore-default-child]")) {
        const button = event.target.closest("[data-restore-default-child]");
        this.store.restoreDefaultChild(component.id, button.dataset.slotName, button.dataset.childType);
      } else if (event.target.closest("[data-add-contextual-separator]")) {
        this.store.addContextualSeparator(component.id);
      } else if (event.target.closest("[data-enter-selected-container]")) {
        this.store.setEditingContext(component.id);
      } else if (event.target.closest("[data-exit-context]")) {
        this.store.exitEditingContext();
      } else if (event.target.closest("[data-reintegrate-layout]")) {
        this.store.setComponentLayoutAuthority(component.id, true);
      } else if (event.target.closest("[data-apply-layout]")) {
        this.store.applyAutoLayout(component.id);
      } else {
        const reorder = event.target.closest("[data-reorder]");
        if (reorder) this.store.reorderComponent(component.id, Number(reorder.dataset.reorder));
      }
    }
  }

  window.CatalogInspectorPanel = InspectorPanel;
})();
