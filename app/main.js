(function () {
  "use strict";

  const mainScriptURL = document.currentScript?.src || new URL("app/main.js", window.location.href).href;
  const runtimeContracts = [
    { file: "component-intent-registry.js", globalName: "CatalogComponentIntents" },
    { file: "component-intent-manifest-contract.js", globalName: "CatalogComponentIntentManifestContract" },
    { file: "component-placement-registry.js", globalName: "CatalogComponentPlacements" },
    { file: "component-placement-manifest-contract.js", globalName: "CatalogComponentPlacementManifestContract" },
    { file: "component-palette-intent-contract.js", globalName: "CatalogComponentPaletteIntentContract" },
    { file: "component-initial-placement-contract.js", globalName: "CatalogComponentInitialPlacementContract" },
    { file: "fact-recipe-contract.js", globalName: "CatalogFactRecipeContract" },
    { file: "callout-recipe-contract.js", globalName: "CatalogCalloutRecipeContract" },
    { file: "text-alignment-contract.js", globalName: "CatalogTextAlignmentContract" },
    { file: "text-scale-contract.js", globalName: "CatalogTextScaleContract" },
    { file: "text-overflow-contract.js", globalName: "CatalogTextOverflowContract" },
    { file: "product-hero-contract.js", globalName: "CatalogProductHeroContract" },
    { file: "product-technical-contract.js", globalName: "CatalogProductTechnicalContract" },
    { file: "product-variants-contract.js", globalName: "CatalogProductVariantsContract" },
    { file: "product-data-only-contract.js", globalName: "CatalogProductDataOnlyContract" }
  ];

  function loadRuntimeContract(contract) {
    if (window[contract.globalName]) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL(contract.file, mainScriptURL).href;
      script.dataset.runtimeContract = contract.globalName;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", () => reject(new Error(`Não foi possível carregar ${contract.file}.`)), { once: true });
      document.head.appendChild(script);
    });
  }

  async function loadRuntimeContracts() {
    for (const contract of runtimeContracts) await loadRuntimeContract(contract);
  }

  function installFrameCommandLayout() {
    if (document.querySelector('style[data-frame-command-layout="true"]')) return;
    const style = document.createElement("style");
    style.dataset.frameCommandLayout = "true";
    style.textContent = [
      '.inspector-root[data-has-selection="true"]:not([data-multi-selection="true"]) {',
      '  grid-template-rows: auto auto auto minmax(0, 1fr) auto;',
      '}'
    ].join("\n");
    document.head.appendChild(style);
  }

  function bootstrap() {
    window.CatalogComponentIntentManifestContract?.install();
    window.CatalogComponentPlacementManifestContract?.install();
    window.CatalogComponentPaletteIntentContract?.install();
    window.CatalogComponentInitialPlacementContract?.install();
    window.CatalogFactRecipeContract?.install();
    window.CatalogCalloutRecipeContract?.install();
    window.CatalogTextAlignmentContract?.install();
    window.CatalogTextScaleContract?.install();
    window.CatalogTextOverflowContract?.install();
    window.CatalogProductHeroContract?.install();
    window.CatalogProductTechnicalContract?.install();
    window.CatalogProductVariantsContract?.install();
    window.CatalogProductDataOnlyContract?.install();
    installFrameCommandLayout();

    function toast(message) {
      const template = document.getElementById("toastTemplate");
      const node = template.content.firstElementChild.cloneNode(true);
      node.textContent = message;
      document.body.appendChild(node);
      setTimeout(() => node.remove(), 2200);
    }

    const store = new window.CatalogDocumentStore(window.CatalogDocumentStore.load());
    const renderer = new window.CatalogEditorRenderer(store);
    const inspector = new window.CatalogInspectorPanel(store);
    const workspaceLayout = new window.CatalogWorkspaceLayout(store);
    const assetStorage = new window.CatalogAssetStorage();
    const projectPackage = new window.CatalogProjectPackageManager(store, assetStorage);
    const assetLibrary = new window.CatalogAssetLibrary(store, assetStorage);
    const productCatalog = new window.CatalogProductCatalog(store);
    const printExport = new window.CatalogPrintExport(store);
    const documentImporter = new window.CatalogDocumentImporter(store, {
      packageManager: projectPackage,
      onImported({ fileName, kind, analysis }) {
        if (kind === "source") toast(`Catálogo gerado a partir de “${fileName}” em ${analysis.summary.actionsRequired || 3} ações. Use Desfazer para recuperar o anterior.`);
        else toast(`${kind === "package" ? "Pacote" : "Documento"} “${fileName}” importado. Use Desfazer para recuperar o anterior.`);
      }
    });
    window.CatalogWorkspace = workspaceLayout;

    function syncZoomSelect(state) {
      const select = document.getElementById("zoomSelect");
      const custom = select.querySelector("option[data-custom-zoom]");
      if (state.editor.zoomMode !== "manual") {
        custom?.remove();
        select.value = "fit";
        return;
      }
      const value = String(Number(state.editor.zoom));
      const existing = Array.from(select.options).find(option => option.value === value);
      if (!existing) {
        custom?.remove();
        const option = document.createElement("option");
        option.value = value;
        option.dataset.customZoom = "true";
        option.textContent = `${Math.round(Number(value) * 100)}%`;
        select.appendChild(option);
      }
      select.value = value;
    }

    function setLeftPanelTab(tab) {
      document.querySelectorAll("[data-left-panel-tab]").forEach(button => {
        button.setAttribute("aria-selected", String(button.dataset.leftPanelTab === tab));
      });
      document.querySelectorAll("[data-left-panel-content]").forEach(panel => {
        panel.hidden = panel.dataset.leftPanelContent !== tab;
      });
    }

    function syncHistoryControls() {
      const history = store.getHistoryState();
      const undo = document.getElementById("undoButton");
      const redo = document.getElementById("redoButton");
      undo.disabled = !history.canUndo;
      redo.disabled = !history.canRedo;
      undo.title = history.canUndo ? `Desfazer: ${history.undoLabel} · Ctrl/Cmd+Z` : "Nada para desfazer";
      redo.title = history.canRedo ? `Refazer: ${history.redoLabel} · Ctrl/Cmd+Shift+Z ou Ctrl+Y` : "Nada para refazer";
      document.body.dataset.documentDirty = String(history.dirty);
      document.title = `${history.dirty ? "● " : ""}Catálogo V1 — Editor A4`;
    }

    renderer.renderPalette();
    new window.CatalogEditorInteractions(store);

    store.subscribe((state, change) => {
      renderer.render(state, change);
      inspector.render();
      workspaceLayout.render(state);
      assetLibrary.render(state, change);
      productCatalog.render(state, change);
      document.getElementById("gridToggle").checked = state.editor.gridVisible;
      document.getElementById("snapToggle").checked = state.editor.snapEnabled;
      document.getElementById("smartSnapToggle").checked = state.editor.smartSnapEnabled;
      document.getElementById("equalSpacingToggle").checked = state.editor.equalSpacingEnabled;
      document.getElementById("showGuidesToggle").checked = state.editor.showGuides;
      document.getElementById("snapToleranceSelect").value = String(state.editor.snapTolerance);
      syncZoomSelect(state);
      syncHistoryControls();
    });

    document.querySelectorAll("[data-left-panel-tab]").forEach(button => {
      button.addEventListener("click", () => setLeftPanelTab(button.dataset.leftPanelTab));
    });

    document.getElementById("gridToggle").addEventListener("change", event => store.setEditorSetting("gridVisible", event.target.checked));
    document.getElementById("snapToggle").addEventListener("change", event => store.setEditorSetting("snapEnabled", event.target.checked));
    document.getElementById("smartSnapToggle").addEventListener("change", event => store.setEditorSetting("smartSnapEnabled", event.target.checked));
    document.getElementById("equalSpacingToggle").addEventListener("change", event => store.setEditorSetting("equalSpacingEnabled", event.target.checked));
    document.getElementById("showGuidesToggle").addEventListener("change", event => store.setEditorSetting("showGuides", event.target.checked));
    document.getElementById("snapToleranceSelect").addEventListener("change", event => store.setEditorSetting("snapTolerance", Number(event.target.value)));
    document.getElementById("zoomSelect").addEventListener("change", event => {
      if (event.target.value === "fit") store.setEditorSettings({ zoomMode: "fit" });
      else store.setEditorSettings({ zoomMode: "manual", zoom: Number(event.target.value) });
    });
    document.getElementById("saveButton").addEventListener("click", () => { store.save(); toast("Documento salvo neste navegador."); });
    document.getElementById("undoButton").addEventListener("click", () => store.undo());
    document.getElementById("redoButton").addEventListener("click", () => store.redo());
    document.getElementById("importButton").addEventListener("click", () => documentImporter.open());
    document.getElementById("exportButton").addEventListener("click", () => {
      document.getElementById("exportMenu").open = false;
      store.exportJSON();
      toast("JSON exportado.");
    });
    async function exportPortablePackage(event, target) {
      const button = event.currentTarget;
      button.disabled = true;
      document.getElementById("exportMenu").open = false;
      try {
        const result = await projectPackage.exportPackage({ target });
        toast(`${target === "publication" ? "Publicação" : "Rascunho"} exportado com ${result.manifest.assets.length} asset(s).`);
      } catch (error) {
        console.error("Falha ao exportar pacote portátil.", error);
        toast(`Pacote não exportado: ${error.message}`);
      } finally {
        button.disabled = false;
      }
    }
    document.getElementById("exportPackageButton").addEventListener("click", event => exportPortablePackage(event, "draft"));
    document.getElementById("exportPublicationPackageButton").addEventListener("click", event => exportPortablePackage(event, "publication"));
    document.getElementById("exportAuthoringKitButton").addEventListener("click", event => {
      document.getElementById("exportMenu").open = false;
      projectPackage.exportAuthoringKit();
      toast("CatalogAuthoringKit 1.6.0 exportado.");
    });
    document.getElementById("printButton").addEventListener("click", () => {
      if (printExport.printCurrentPage()) toast("No diálogo do navegador, escolha Salvar como PDF.");
    });
    document.getElementById("newDocumentButton").addEventListener("click", () => {
      if (store.isDirty() && !window.confirm("Criar um novo documento? As alterações atuais poderão ser recuperadas com Desfazer enquanto esta sessão permanecer aberta.")) return;
      store.reset();
    });

    window.CatalogEditor = { store, renderer, inspector, workspaceLayout, assetStorage, assetLibrary, productCatalog, printExport, documentImporter, projectPackage };
  }

  loadRuntimeContracts()
    .then(bootstrap)
    .catch(error => {
      console.error("Contratos editoriais não carregados integralmente; iniciando editor com os contratos disponíveis.", error);
      bootstrap();
    });
})();
