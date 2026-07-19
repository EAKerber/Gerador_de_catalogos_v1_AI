(function () {
  "use strict";

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const escapeHtml = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  class DocumentImporter {
    constructor(store, options = {}) {
      this.store = store;
      this.packageManager = options.packageManager || null;
      this.onImported = options.onImported || (() => {});
      this.dialog = document.getElementById("importDocumentDialog");
      this.input = document.getElementById("documentImportFileInput");
      this.dropzone = this.dialog?.querySelector("[data-document-import-dropzone]");
      this.analysisRoot = this.dialog?.querySelector("[data-document-import-analysis]");
      this.filename = this.dialog?.querySelector("[data-document-import-filename]");
      this.verdict = this.dialog?.querySelector("[data-document-import-verdict]");
      this.summary = this.dialog?.querySelector("[data-document-import-summary]");
      this.issues = this.dialog?.querySelector("[data-document-import-issues]");
      this.feedback = this.dialog?.querySelector("[data-document-import-feedback]");
      this.confirmButton = this.dialog?.querySelector("[data-confirm-document-import]");
      this.pending = null;
      this.readToken = 0;
      this.bind();
    }

    bind() {
      if (!this.dialog) return;
      this.dialog.addEventListener("click", event => {
        if (event.target.closest("[data-close-document-import]")) this.close();
        else if (event.target.closest("[data-confirm-document-import]")) this.commit();
      });
      this.input?.addEventListener("change", event => this.inspectFile(event.target.files?.[0]));
      ["dragenter", "dragover"].forEach(type => this.dropzone?.addEventListener(type, event => {
        event.preventDefault();
        this.dropzone.dataset.dragActive = "true";
      }));
      ["dragleave", "drop"].forEach(type => this.dropzone?.addEventListener(type, event => {
        event.preventDefault();
        this.dropzone.dataset.dragActive = "false";
      }));
      this.dropzone?.addEventListener("drop", event => this.inspectFile(event.dataTransfer?.files?.[0]));
      this.dialog.addEventListener("cancel", event => {
        event.preventDefault();
        this.close();
      });
    }

    open() {
      this.reset();
      if (!this.dialog.open) this.dialog.showModal();
    }

    close() {
      this.readToken += 1;
      this.pending = null;
      if (this.dialog?.open) this.dialog.close();
    }

    reset() {
      this.readToken += 1;
      this.pending = null;
      if (this.input) this.input.value = "";
      if (this.analysisRoot) this.analysisRoot.hidden = true;
      if (this.feedback) this.feedback.textContent = "O arquivo será analisado sem modificar o documento aberto.";
      if (this.confirmButton) {
        this.confirmButton.disabled = true;
        this.confirmButton.textContent = "Importar documento";
      }
      if (this.dropzone) this.dropzone.dataset.dragActive = "false";
    }

    async inspectFile(file) {
      const token = ++this.readToken;
      this.pending = null;
      if (this.confirmButton) this.confirmButton.disabled = true;
      if (!file) return;
      const packageFile = this.packageManager?.isPackageFile(file);
      const jsonFile = file.name.toLowerCase().endsWith(".json") || file.type === "application/json";
      if (!packageFile && !jsonFile) {
        this.showFileError(file.name, "Escolha um CatalogSource, um JSON do editor ou um pacote ZIP portátil.");
        return;
      }
      if (!packageFile && file.size > MAX_FILE_SIZE) {
        this.showFileError(file.name, "O arquivo excede o limite de 10 MB deste incremento.");
        return;
      }
      this.feedback.textContent = packageFile ? "Verificando ZIP, manifestos, hashes e assets…" : "Lendo e validando o documento…";
      if (packageFile) {
        let analysis;
        try {
          analysis = await this.packageManager.analyzePackage(file);
        } catch (error) {
          if (token !== this.readToken) return;
          this.showFileError(file.name, `O pacote não pôde ser analisado: ${error.message}`);
          return;
        }
        if (token !== this.readToken) return;
        this.pending = analysis.ok ? { analysis, fileName: file.name, kind: "package" } : null;
        this.renderAnalysis(file.name, analysis);
        this.confirmButton.disabled = !analysis.ok;
        this.feedback.textContent = analysis.ok
          ? "Revise o relatório e confirme o commit atômico de documento e assets."
          : "O pacote não alterou o projeto aberto. Corrija os erros indicados.";
        return;
      }
      let source;
      try {
        source = JSON.parse(await file.text());
      } catch (error) {
        if (token !== this.readToken) return;
        this.showFileError(file.name, `JSON inválido: ${error.message}`);
        return;
      }
      if (token !== this.readToken) return;
      const sourceCatalog = source?.sourceFormat === "CatalogSource";
      const analysis = sourceCatalog
        ? window.CatalogCompiler.compile(source)
        : this.store.analyzeDocument(source);
      const kind = sourceCatalog ? "source" : "json";
      this.pending = analysis.ok ? { analysis, fileName: file.name, kind } : null;
      this.renderAnalysis(file.name, analysis);
      this.confirmButton.disabled = !analysis.ok;
      this.feedback.textContent = analysis.ok
        ? sourceCatalog
          ? "Revise o plano, as decisões e o gate geométrico; confirme para gerar o catálogo em uma única ação reversível."
          : "Revise o resumo e confirme para substituir o documento aberto."
        : sourceCatalog
          ? "A geração foi bloqueada antes de alterar o documento. Corrija os erros indicados."
          : "Corrija os erros indicados antes de importar.";
    }

    showFileError(fileName, message) {
      const analysis = {
        ok: false,
        sourceVersion: "—",
        targetVersion: window.CATALOG_SCHEMA_VERSION,
        summary: { pages: 0, components: 0, products: 0, templates: 0, assets: 0, tableRows: 0 },
        issues: [{ severity: "error", code: "FILE_ERROR", message }]
      };
      this.renderAnalysis(fileName, analysis);
      this.feedback.textContent = "O arquivo não pode ser importado.";
    }

    renderAnalysis(fileName, analysis) {
      this.analysisRoot.hidden = false;
      this.filename.textContent = fileName;
      const sourceCatalog = analysis.kind === "source";
      this.verdict.textContent = analysis.ok ? (sourceCatalog ? "Pronto para gerar" : "Pronto para importar") : (sourceCatalog ? "Geração bloqueada" : "Importação bloqueada");
      this.verdict.dataset.state = analysis.ok ? "ready" : "blocked";
      this.confirmButton.textContent = analysis.kind === "package" ? "Importar pacote" : sourceCatalog ? "Gerar catálogo" : "Importar documento";
      const summary = analysis.summary || {};
      const cards = [
        ["Páginas", summary.pages],
        ["Componentes", summary.components],
        ["Produtos", summary.products],
        ["Templates", summary.templates],
        ["Assets", summary.assets],
        ["Linhas", summary.tableRows],
        ...(analysis.kind === "package" ? [["Assets no ZIP", summary.packageAssets]] : []),
        ...(sourceCatalog ? [["Ações", summary.actionsRequired], ["Colisões", summary.collisions], ["Overflow", summary.overflows]] : [])
      ];
      this.summary.innerHTML = cards.map(([label, value]) => `<div><strong>${Number(value) || 0}</strong><span>${escapeHtml(label)}</span></div>`).join("") +
        `<div class="document-import-summary__version"><strong>${escapeHtml(analysis.sourceVersion)} → ${escapeHtml(analysis.targetVersion)}</strong><span>${analysis.kind === "package" ? "Pacote" : sourceCatalog ? "Fonte → schema" : "Schema"}</span></div>`;
      this.issues.innerHTML = (analysis.issues || []).map(issue => `
        <article class="document-import-issue" data-severity="${escapeHtml(issue.severity)}">
          <span>${issue.severity === "error" ? "Erro" : issue.severity === "warning" ? "Aviso" : "Informação"}</span>
          <p>${escapeHtml(issue.message)}</p>
        </article>`).join("");
    }

    async commit() {
      if (!this.pending?.analysis?.ok) return;
      const { analysis, fileName, kind } = this.pending;
      this.confirmButton.disabled = true;
      this.feedback.textContent = kind === "package" ? "Persistindo assets e documento…" : kind === "source" ? "Materializando plano, bindings e frames…" : "Importando documento…";
      try {
        if (kind === "package") await this.packageManager.commitPackage(analysis);
        else {
          this.store.replaceDocument(analysis.document, {
            changeType: kind === "source" ? "document-compiled" : "document-imported",
            importSummary: { ...analysis.summary, fileName, sourceVersion: analysis.sourceVersion }
          });
        }
        this.close();
        this.onImported({ fileName, analysis, kind });
      } catch (error) {
        this.feedback.textContent = `O commit falhou sem substituir o documento: ${error.message}`;
        this.confirmButton.disabled = false;
      }
    }
  }

  window.CatalogDocumentImporter = DocumentImporter;
})();
