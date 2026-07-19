(function () {
  "use strict";

  const escapeHtml = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const productValues = product => ({
    title: product?.metadata?.values?.title || "",
    specOne: product?.metadata?.values?.specOne || "",
    specTwo: product?.metadata?.values?.specTwo || "",
    code: product?.metadata?.values?.code || "",
    package: product?.metadata?.values?.package || "",
    price: product?.metadata?.values?.price || "",
    assetId: product?.metadata?.values?.assetId || "",
    attributesText: window.CatalogSource?.formatLines?.(product?.metadata?.attributes, "attribute") || "",
    highlightsText: window.CatalogSource?.formatLines?.(product?.metadata?.highlights, "highlight") || "",
    applicationsText: window.CatalogSource?.formatLines?.(product?.metadata?.applications, "application") || ""
  });

  class ProductCatalog {
    constructor(store) {
      this.store = store;
      this.root = document.getElementById("productCatalogRoot");
      this.editingProductId = null;
      this.selectedProductIds = new Set();
      this.activeSubcatalogId = "all";
      this.cardColumns = 3;
      this.feedback = "Cadastre produtos para vincular conteúdo aos cards sem reconstruir a página.";
      this.root?.addEventListener("submit", event => this.handleSubmit(event));
      this.root?.addEventListener("change", event => this.handleChange(event));
      this.root?.addEventListener("click", event => this.handleClick(event));
    }

    visibleProducts() {
      const products = this.store.getProducts();
      if (this.activeSubcatalogId === "all") return products;
      const subcatalog = this.store.getSubcatalogs().find(item => item.id === this.activeSubcatalogId);
      return subcatalog ? products.filter(product => subcatalog.metadata?.productIds?.includes(product.id)) : products;
    }

    render() {
      if (!this.root) return;
      const editing = this.store.getProduct(this.editingProductId);
      if (this.editingProductId && !editing) this.editingProductId = null;
      const values = productValues(editing);
      const products = this.visibleProducts();
      const subcatalogs = this.store.getSubcatalogs();
      const assets = this.store.getCollection("assets")?.items || [];
      const variants = editing?.metadata?.variants || [];
      const commercialRows = editing?.metadata?.commercialRows || [];
      const selectedCard = this.store.getProductCard(this.store.getSelected());
      const selectedIds = Array.from(this.selectedProductIds).filter(productId => this.store.getProduct(productId));

      this.root.innerHTML = `
        <section class="product-catalog__summary">
          <div><strong>${this.store.getProducts().length}</strong><span>produtos</span></div>
          <div><strong>${subcatalogs.length}</strong><span>subcatálogos</span></div>
          <div><strong>${selectedCard ? "1" : "0"}</strong><span>card alvo</span></div>
        </section>
        <details class="product-bulk-entry">
          <summary>Entrada rápida · colar tabela <span>reduz preenchimentos repetidos</span></summary>
          <p>Cole dados de Excel, Sheets ou CSV. A primeira linha pode usar: Título, Código, Embalagem, Preço, Especificação 1 e Especificação 2.</p>
          <textarea rows="7" data-products-bulk-text placeholder="Título&#9;Código&#9;Embalagem&#9;Preço&#9;Especificação 1&#9;Especificação 2&#10;PARAFUSO OVAL PHS&#9;1176&#9;CX 1000 UNID.&#9;R$ 35,90&#9;Cabeça oval&#9;Aço cromado"></textarea>
          <button type="button" class="product-primary-button" data-products-bulk-add>Adicionar produtos da tabela</button>
        </details>
        <form class="product-form" data-product-form autocomplete="off">
          <div class="product-form__heading">
            <div><span class="panel-kicker">${editing ? "Editando" : "Novo item"}</span><h3>${editing ? escapeHtml(editing.label) : "Cadastrar produto"}</h3></div>
            ${editing ? '<button type="button" class="product-link-button" data-product-cancel>Cancelar</button>' : ""}
          </div>
          <div class="product-form__grid">
            <label class="product-field product-field--full">Título<input name="title" required value="${escapeHtml(values.title)}" placeholder="PARAFUSO OVAL PHS" /></label>
            <label class="product-field">Código<input name="code" value="${escapeHtml(values.code)}" placeholder="1176" /></label>
            <label class="product-field">Embalagem<input name="package" value="${escapeHtml(values.package)}" placeholder="CX 1000 UNID." /></label>
            <label class="product-field">Preço<input name="price" value="${escapeHtml(values.price)}" placeholder="R$ 35,90" /></label>
            <label class="product-field">Especificação 1<input name="specOne" value="${escapeHtml(values.specOne)}" placeholder="Alta resistência" /></label>
            <label class="product-field product-field--full">Especificação 2<input name="specTwo" value="${escapeHtml(values.specTwo)}" placeholder="Aço cromado" /></label>
            <label class="product-field product-field--full">Arte principal
              <select name="assetId"><option value="">Sem arte vinculada</option>${assets.map(asset => `<option value="${escapeHtml(asset.id)}" ${values.assetId === asset.id ? "selected" : ""}>${escapeHtml(asset.label)}</option>`).join("")}</select>
            </label>
          </div>
          <details class="product-semantic-fields" ${editing && (values.attributesText || values.highlightsText || values.applicationsText) ? "open" : ""}>
            <summary>Detalhes semânticos <span>opcional</span></summary>
            <p>Esses dados orientam agentes e apresentações sem obrigar o card a exibir tudo.</p>
            <label class="product-field">Atributos <textarea name="attributesText" rows="3" placeholder="Material: Aço cromado&#10;Medida: 4,0×16">${escapeHtml(values.attributesText)}</textarea></label>
            <label class="product-field">Destaques <textarea name="highlightsText" rows="3" placeholder="Alta resistência&#10;Cabeça oval">${escapeHtml(values.highlightsText)}</textarea></label>
            <label class="product-field">Aplicações <textarea name="applicationsText" rows="3" placeholder="MDF&#10;Madeira maciça">${escapeHtml(values.applicationsText)}</textarea></label>
            <small>Esses campos podem ser preenchidos manualmente ou pelo kit/agente.</small>
          </details>
          ${editing ? `<details class="product-variant-editor" open>
            <summary>Variações semânticas <span>${variants.length}</span></summary>
            <p>Uma variação pode materializar uma imagem legendada e uma linha comercial nos cards vinculados. Depois disso, cada representação continua editável.</p>
            <div class="product-variant-list">${variants.map(variant => {
              const row = commercialRows.find(item => (variant.commercialRowIds || []).includes(item.id) || item.variantId === variant.id) || { values: {} };
              return `<article data-product-variant="${escapeHtml(variant.id)}">
                <div class="product-form__grid">
                  <label class="product-field product-field--full">Nome<input data-variant-path="label" value="${escapeHtml(variant.label)}" /></label>
                  <label class="product-field product-field--full">Arte<select data-variant-path="assetId"><option value="">Sem arte</option>${assets.map(asset => `<option value="${escapeHtml(asset.id)}" ${variant.assetIds?.[0] === asset.id ? "selected" : ""}>${escapeHtml(asset.label)}</option>`).join("")}</select></label>
                  <label class="product-field">Código<input data-variant-value="code" value="${escapeHtml(row.values?.code || "")}" /></label>
                  <label class="product-field">Embalagem<input data-variant-value="package" value="${escapeHtml(row.values?.package || "")}" /></label>
                  <label class="product-field">Preço<input data-variant-value="price" value="${escapeHtml(row.values?.price || "")}" /></label>
                </div>
                <div class="product-variant-actions"><button type="button" data-variant-save="${escapeHtml(variant.id)}">Salvar variação</button><button type="button" data-variant-remove="${escapeHtml(variant.id)}">Remover</button></div>
              </article>`;
            }).join("") || "<small>Nenhuma variação cadastrada.</small>"}</div>
            <section class="product-variant-new">
              <div class="product-form__grid">
                <label class="product-field product-field--full">Nova variação<input data-new-variant-label placeholder="Branco" /></label>
                <label class="product-field product-field--full">Arte opcional<select data-new-variant-asset><option value="">Sem arte</option>${assets.map(asset => `<option value="${escapeHtml(asset.id)}">${escapeHtml(asset.label)}</option>`).join("")}</select></label>
                <label class="product-field">Código<input data-new-variant-value="code" /></label>
                <label class="product-field">Embalagem<input data-new-variant-value="package" /></label>
                <label class="product-field">Preço<input data-new-variant-value="price" /></label>
              </div>
              <label class="product-switch"><input type="checkbox" data-new-variant-art checked /><span>Adicionar imagem aos cards vinculados</span></label>
              <label class="product-switch"><input type="checkbox" data-new-variant-row checked /><span>Adicionar linha comercial vinculada</span></label>
              <button type="button" class="product-primary-button" data-variant-add>Adicionar variação</button>
            </section>
          </details>` : ""}
          <button class="product-primary-button" type="submit">${editing ? "Salvar alterações" : "Adicionar ao inventário"}</button>
        </form>
        <section class="subcatalog-toolbar" aria-label="Filtros do inventário">
          <label>Exibir<select data-subcatalog-filter><option value="all">Catálogo geral</option>${subcatalogs.map(item => `<option value="${escapeHtml(item.id)}" ${this.activeSubcatalogId === item.id ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></label>
          <div class="subcatalog-toolbar__actions">
            <button type="button" data-subcatalog-create>Subcatálogo da seleção</button>
            ${this.activeSubcatalogId !== "all" ? '<button type="button" data-subcatalog-delete>Excluir filtro</button>' : ""}
          </div>
        </section>
        <section class="product-batch-actions" aria-label="Ações para produtos selecionados">
          <div class="product-batch-actions__heading"><strong>${selectedIds.length} selecionado(s)</strong><span>Uma ação cria, organiza e vincula os cards.</span></div>
          <div class="product-batch-actions__selection"><button type="button" data-products-select-visible>Selecionar visíveis</button><button type="button" data-products-clear-selection ${selectedIds.length ? "" : "disabled"}>Limpar</button></div>
          <label>Colunas da grade<select data-product-card-columns><option value="2" ${this.cardColumns === 2 ? "selected" : ""}>2 colunas</option><option value="3" ${this.cardColumns === 3 ? "selected" : ""}>3 colunas</option><option value="4" ${this.cardColumns === 4 ? "selected" : ""}>4 colunas</option></select></label>
          <button type="button" class="product-primary-button" data-products-create-cards ${selectedIds.length ? "" : "disabled"}>Criar cards da seleção</button>
        </section>
        <p class="product-catalog__feedback" role="status">${escapeHtml(this.feedback)}</p>
        <div class="product-list" data-product-list>
          ${products.length ? products.map(product => {
            const item = productValues(product);
            const usage = this.store.getProductUsage(product.id).length;
            return `<article class="product-list-item" data-product-id="${escapeHtml(product.id)}">
              <label class="product-list-item__select"><input type="checkbox" data-product-select value="${escapeHtml(product.id)}" ${this.selectedProductIds.has(product.id) ? "checked" : ""} /><span class="sr-only">Selecionar ${escapeHtml(product.label)}</span></label>
              <div class="product-list-item__body"><strong>${escapeHtml(product.label)}</strong><span>${escapeHtml(item.code || "Sem código")} · ${escapeHtml(item.package || "Sem embalagem")}</span><b>${escapeHtml(item.price || "Sem preço")}</b><small>${(product.metadata?.attributes?.length || 0)} atributo(s) · ${(product.metadata?.highlights?.length || 0)} destaque(s)</small></div>
              <span class="product-list-item__usage">${usage ? `${usage} card${usage > 1 ? "s" : ""}` : "livre"}</span>
              <div class="product-list-item__actions">
                <button type="button" data-product-bind="${escapeHtml(product.id)}" ${selectedCard ? "" : "disabled"}>Vincular</button>
                <button type="button" data-product-edit="${escapeHtml(product.id)}">Editar</button>
                <button type="button" data-product-delete="${escapeHtml(product.id)}">×</button>
              </div>
            </article>`;
          }).join("") : '<div class="product-list-empty"><strong>Nenhum produto neste recorte</strong><span>Cadastre um item ou volte ao Catálogo geral.</span></div>'}
        </div>`;
      if (!editing) this.root.querySelector("[data-product-form]")?.reset();
    }

    handleSubmit(event) {
      const form = event.target.closest("[data-product-form]");
      if (!form) return;
      event.preventDefault();
      const data = new FormData(form);
      const values = Object.fromEntries(data.entries());
      if (this.editingProductId) {
        this.store.updateProduct(this.editingProductId, values);
        this.feedback = "Produto atualizado; cards vinculados foram sincronizados respeitando overrides locais.";
      } else {
        const product = this.store.createProduct(values);
        this.selectedProductIds.add(product.id);
        this.feedback = "Produto adicionado ao catálogo geral.";
      }
      this.editingProductId = null;
      this.render();
    }

    handleChange(event) {
      if (event.target.matches("[data-product-select]")) {
        if (event.target.checked) this.selectedProductIds.add(event.target.value);
        else this.selectedProductIds.delete(event.target.value);
        this.render();
      } else if (event.target.matches("[data-subcatalog-filter]")) {
        this.activeSubcatalogId = event.target.value;
        this.render();
      } else if (event.target.matches("[data-product-card-columns]")) {
        this.cardColumns = Number(event.target.value) || 3;
      }
    }

    handleClick(event) {
      if (event.target.closest("[data-variant-add]") && this.editingProductId) {
        const commercialValues = Object.fromEntries([...this.root.querySelectorAll("[data-new-variant-value]")].map(input => [input.dataset.newVariantValue, input.value]));
        try {
          this.store.addProductVariant(this.editingProductId, {
            label: this.root.querySelector("[data-new-variant-label]")?.value || "",
            assetId: this.root.querySelector("[data-new-variant-asset]")?.value || null,
            commercialValues
          }, {
            materializeVisual: this.root.querySelector("[data-new-variant-art]")?.checked === true,
            materializeRow: this.root.querySelector("[data-new-variant-row]")?.checked === true
          });
          this.feedback = "Variação criada e vinculada às representações escolhidas.";
        } catch (error) {
          this.feedback = error.message;
        }
        this.render();
        return;
      }
      const variantSave = event.target.closest("[data-variant-save]");
      if (variantSave && this.editingProductId) {
        const article = variantSave.closest("[data-product-variant]");
        const commercialValues = Object.fromEntries([...article.querySelectorAll("[data-variant-value]")].map(input => [input.dataset.variantValue, input.value]));
        this.store.updateProductVariant(this.editingProductId, variantSave.dataset.variantSave, {
          label: article.querySelector('[data-variant-path="label"]')?.value,
          assetId: article.querySelector('[data-variant-path="assetId"]')?.value || null,
          commercialValues
        });
        this.feedback = "Variação atualizada; o rótulo local das imagens foi preservado.";
        this.render();
        return;
      }
      const variantRemove = event.target.closest("[data-variant-remove]");
      if (variantRemove && this.editingProductId) {
        if (!window.confirm("Remover a variante semântica e suas representações vinculadas?")) return;
        this.store.removeProductVariant(this.editingProductId, variantRemove.dataset.variantRemove);
        this.feedback = "Variação e representações vinculadas removidas.";
        this.render();
        return;
      }
      if (event.target.closest("[data-products-bulk-add]")) {
        const text = this.root.querySelector("[data-products-bulk-text]")?.value || "";
        const parsed = window.CatalogManualEntry.parseProducts(text);
        if (!parsed.rows.length) {
          this.feedback = parsed.issues[0]?.message || "Nenhum produto válido foi encontrado.";
          this.render();
          return;
        }
        const created = this.store.createProductsBulk(parsed.rows);
        created.forEach(product => this.selectedProductIds.add(product.id));
        const warnings = parsed.issues.filter(issue => issue.severity === "warning").length;
        this.feedback = `${created.length} produto(s) adicionado(s) em uma transação${warnings ? `; ${warnings} linha(s) ignorada(s)` : ""}.`;
        this.render();
        return;
      }
      if (event.target.closest("[data-products-select-visible]")) {
        this.visibleProducts().forEach(product => this.selectedProductIds.add(product.id));
        this.feedback = `${this.selectedProductIds.size} produto(s) selecionado(s).`;
        this.render();
        return;
      }
      if (event.target.closest("[data-products-clear-selection]")) {
        this.selectedProductIds.clear();
        this.feedback = "Seleção de produtos limpa.";
        this.render();
        return;
      }
      if (event.target.closest("[data-products-create-cards]")) {
        const ids = Array.from(this.selectedProductIds).filter(productId => this.store.getProduct(productId));
        if (!ids.length) return;
        try {
          const result = this.store.createCardsForProducts(ids, { columns: this.cardColumns, density: "compact" });
          this.feedback = `${result.cards.length} card(s) criado(s), vinculados e organizados em ${this.cardColumns} coluna(s).`;
        } catch (error) {
          this.feedback = `Não foi possível criar os cards: ${error.message}`;
        }
        this.render();
        return;
      }
      const edit = event.target.closest("[data-product-edit]");
      const remove = event.target.closest("[data-product-delete]");
      const bind = event.target.closest("[data-product-bind]");
      if (edit) {
        this.editingProductId = edit.dataset.productEdit;
        this.render();
        this.root.querySelector('[name="title"]')?.focus();
      } else if (event.target.closest("[data-product-cancel]")) {
        this.editingProductId = null;
        this.render();
      } else if (bind) {
        const card = this.store.getProductCard(this.store.getSelected());
        if (!card) return;
        this.store.bindProduct(card.id, bind.dataset.productBind);
        this.feedback = "Produto vinculado ao card selecionado.";
      } else if (remove) {
        const productId = remove.dataset.productDelete;
        const usage = this.store.getProductUsage(productId).length;
        if (usage && !window.confirm(`Este produto está ligado a ${usage} card(s). Remover o produto e manter os cards como conteúdo local?`)) return;
        this.store.removeProduct(productId, { detach: true });
        this.selectedProductIds.delete(productId);
        this.feedback = "Produto removido; os cards existentes mantiveram a última apresentação como conteúdo local.";
      } else if (event.target.closest("[data-subcatalog-create]")) {
        const ids = Array.from(this.selectedProductIds).filter(productId => this.store.getProduct(productId));
        if (!ids.length) {
          this.feedback = "Selecione ao menos um produto antes de criar o subcatálogo.";
          this.render();
          return;
        }
        const label = window.prompt("Nome do subcatálogo:", "Seleção de produtos");
        if (!label?.trim()) return;
        const subcatalog = this.store.createSubcatalog(label.trim(), ids);
        this.activeSubcatalogId = subcatalog.id;
        this.feedback = `Subcatálogo criado com ${ids.length} produto(s).`;
        this.render();
      } else if (event.target.closest("[data-subcatalog-delete]")) {
        if (!window.confirm("Excluir este subcatálogo? Os produtos do catálogo geral serão preservados.")) return;
        this.store.removeSubcatalog(this.activeSubcatalogId);
        this.activeSubcatalogId = "all";
        this.feedback = "Subcatálogo removido; o inventário geral foi preservado.";
        this.render();
      }
    }
  }

  window.CatalogProductCatalog = ProductCatalog;
})();
