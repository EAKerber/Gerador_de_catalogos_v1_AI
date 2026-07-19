(function () {
  "use strict";

  const ACCEPTED_TYPES = Object.freeze(["image/svg+xml", "image/png", "image/jpeg", "image/webp"]);
  const EXTENSION_TYPES = Object.freeze({ svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" });
  const MAX_FILE_SIZE = 25 * 1024 * 1024;
  const escapeHtml = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function resolvedAssetType(file) {
    if (ACCEPTED_TYPES.includes(file?.type)) return file.type;
    const extension = String(file?.name || "").split(".").pop().toLowerCase();
    return EXTENSION_TYPES[extension] || "";
  }

  function isAcceptedAssetFile(file) {
    return Boolean(file && resolvedAssetType(file) && Number(file.size) > 0 && Number(file.size) <= MAX_FILE_SIZE);
  }

  function formatBytes(value) {
    const bytes = Number(value) || 0;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function assetId() {
    return `asset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function measureImage(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        resolve({ width: image.naturalWidth || 0, height: image.naturalHeight || 0 });
        URL.revokeObjectURL(url);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("O arquivo não pôde ser interpretado como imagem."));
      };
      image.src = url;
    });
  }

  class AssetLibrary {
    constructor(store, storage) {
      this.store = store;
      this.storage = storage;
      this.dialog = document.getElementById("assetLibraryDialog");
      this.grid = document.getElementById("assetLibraryGrid");
      this.empty = document.getElementById("assetLibraryEmpty");
      this.feedback = document.getElementById("assetLibraryFeedback");
      this.input = document.getElementById("assetFileInput");
      this.dropzone = document.getElementById("assetDropzone");
      this.targetComponentId = null;
      this.objectUrls = new Map();
      this.pendingUrls = new Map();
      this.bind();
    }

    bind() {
      document.addEventListener("pointerdown", event => {
        if (event.target.closest("[data-open-asset-library], [data-use-asset], [data-clear-asset]")) event.stopPropagation();
      }, true);
      document.addEventListener("click", event => this.handleClick(event));
      this.input.addEventListener("change", event => {
        this.importFiles(event.target.files);
        event.target.value = "";
      });
      for (const eventName of ["dragenter", "dragover"]) {
        this.dropzone.addEventListener(eventName, event => {
          event.preventDefault();
          this.dropzone.dataset.dragActive = "true";
        });
      }
      for (const eventName of ["dragleave", "drop"]) {
        this.dropzone.addEventListener(eventName, event => {
          event.preventDefault();
          this.dropzone.dataset.dragActive = "false";
        });
      }
      this.dropzone.addEventListener("drop", event => this.importFiles(event.dataTransfer?.files));
    }

    selectedArtId() {
      const selected = this.store.getSelected();
      return selected?.type === "art" ? selected.id : null;
    }

    open(componentId = this.selectedArtId()) {
      const component = this.store.findComponent(componentId)?.component;
      if (!component || component.type !== "art") return;
      this.targetComponentId = component.id;
      if (this.store.getState().editor.selectedComponentId !== component.id) this.store.setSelection(component.id);
      this.feedback.textContent = "";
      this.renderLibrary();
      if (typeof this.dialog.showModal === "function") this.dialog.showModal();
      else this.dialog.setAttribute("open", "");
    }

    close() {
      if (typeof this.dialog.close === "function" && this.dialog.open) this.dialog.close();
      else this.dialog.removeAttribute("open");
    }

    handleClick(event) {
      const openButton = event.target.closest("[data-open-asset-library]");
      if (openButton) {
        event.preventDefault();
        this.open(openButton.dataset.componentId || this.selectedArtId());
        return;
      }
      const useButton = event.target.closest("[data-use-asset]");
      if (useButton) {
        event.preventDefault();
        this.useAsset(useButton.dataset.useAsset);
        return;
      }
      const clearButton = event.target.closest("[data-clear-asset]");
      if (clearButton) {
        event.preventDefault();
        const componentId = clearButton.dataset.componentId || this.selectedArtId();
        if (componentId) this.store.setComponentAsset(componentId, null);
        return;
      }
      if (event.target.closest("[data-close-asset-library]")) this.close();
    }

    async importFiles(fileList) {
      const files = Array.from(fileList || []);
      if (!files.length) return;
      this.feedback.textContent = `Importando ${files.length} arquivo(s)…`;
      let firstImported = null;
      const errors = [];
      for (const file of files) {
        try {
          if (!isAcceptedAssetFile(file)) throw new Error(`${file.name}: use SVG, PNG, JPG ou WebP com até 25 MB.`);
          const mimeType = resolvedAssetType(file);
          const binary = file.type === mimeType ? file : new Blob([file], { type: mimeType });
          const dimensions = await measureImage(binary);
          const id = assetId();
          await this.storage.put(id, binary);
          try {
            this.store.upsertCollectionItem("assets", {
              id,
              label: file.name.replace(/\.[^.]+$/, "") || file.name,
              metadata: {
                fileName: file.name,
                mimeType,
                size: file.size,
                width: dimensions.width,
                height: dimensions.height,
                createdAt: new Date().toISOString(),
                isVector: mimeType === "image/svg+xml",
                provenance: {
                  origin: "provided",
                  role: "generic",
                  relatedProductIds: [],
                  sourceAssetIds: [],
                  method: "direct-upload",
                  fidelity: "product-faithful",
                  generator: null
                },
                approval: { status: "review-required", publishAllowed: false, reviewedAt: null }
              },
              reference: { provider: "indexeddb", key: id }
            });
          } catch (error) {
            await this.storage.delete(id);
            throw error;
          }
          firstImported ||= id;
        } catch (error) {
          errors.push(error.message);
        }
      }
      if (firstImported && this.targetComponentId) this.store.setComponentAsset(this.targetComponentId, firstImported);
      this.feedback.textContent = errors.length ? errors.join(" ") : `${files.length} arquivo(s) adicionado(s) à biblioteca.`;
      this.renderLibrary();
      if (firstImported && !errors.length) this.close();
    }

    useAsset(id) {
      const targetId = this.targetComponentId || this.selectedArtId();
      if (!targetId || !this.store.getAsset(id)) return;
      this.store.setComponentAsset(targetId, id);
      this.close();
    }

    renderLibrary() {
      const assets = this.store.getCollection("assets")?.items || [];
      this.empty.hidden = assets.length > 0;
      this.grid.innerHTML = assets.map(item => {
        const metadata = item.metadata || {};
        const details = [metadata.width && metadata.height ? `${metadata.width}×${metadata.height}` : null, formatBytes(metadata.size)].filter(Boolean).join(" · ");
        return `
          <article class="asset-card" data-asset-card="${escapeHtml(item.id)}">
            <div class="asset-card__preview component-art__preview" data-asset-preview data-asset-id="${escapeHtml(item.id)}" data-fit="contain" data-focal-x="50" data-focal-y="50" data-vector-mode="original">
              <img data-asset-image alt="" />
              <span data-asset-vector aria-hidden="true"></span>
              <span class="component-art__missing">Prévia indisponível</span>
            </div>
            <div class="asset-card__meta"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(metadata.mimeType || "Imagem")}</span><small>${escapeHtml(details)}</small></div>
            <button type="button" data-use-asset="${escapeHtml(item.id)}">Usar esta arte</button>
          </article>`;
      }).join("");
      this.hydratePreviews(this.dialog);
    }

    async urlFor(item) {
      if (this.objectUrls.has(item.id)) return this.objectUrls.get(item.id);
      if (this.pendingUrls.has(item.id)) return this.pendingUrls.get(item.id);
      const pending = (async () => {
        if (item.reference?.provider !== "indexeddb") return item.reference?.key || null;
        const blob = await this.storage.get(item.reference.key);
        if (!blob) return null;
        const url = URL.createObjectURL(blob);
        this.objectUrls.set(item.id, url);
        return url;
      })();
      this.pendingUrls.set(item.id, pending);
      try {
        return await pending;
      } finally {
        this.pendingUrls.delete(item.id);
      }
    }

    async hydratePreview(preview) {
      const item = this.store.getAsset(preview.dataset.assetId);
      const url = item ? await this.urlFor(item) : null;
      if (!preview.isConnected) return;
      if (!item || preview.dataset.assetId !== item.id) {
        preview.dataset.assetState = "missing";
        return;
      }
      preview.dataset.assetState = url ? "ready" : "missing";
      if (!url) return;
      const image = preview.querySelector("[data-asset-image]");
      const vector = preview.querySelector("[data-asset-vector]");
      const vectorAsToken = item.metadata?.mimeType === "image/svg+xml" && preview.dataset.vectorMode === "token";
      if (vectorAsToken) {
        vector.style.setProperty("--asset-url", `url(\"${url}\")`);
        image.removeAttribute("src");
        preview.dataset.assetRender = "vector-token";
      } else {
        image.src = url;
        image.alt = preview.dataset.assetAlt || item.label || "";
        vector.style.removeProperty("--asset-url");
        preview.dataset.assetRender = "image";
      }
    }

    hydratePreviews(root = document) {
      root.querySelectorAll("[data-asset-preview][data-asset-id]").forEach(preview => {
        if (preview.dataset.assetId) this.hydratePreview(preview).catch(error => {
          preview.dataset.assetState = "missing";
          console.warn("Não foi possível carregar a prévia da arte.", error);
        });
      });
    }

    render() {
      if (this.dialog.open) this.renderLibrary();
      this.hydratePreviews(document.getElementById("pageCanvas"));
    }
  }

  window.CatalogAssetUtils = { ACCEPTED_TYPES, MAX_FILE_SIZE, resolvedAssetType, isAcceptedAssetFile, formatBytes };
  window.CatalogAssetLibrary = AssetLibrary;
})();
