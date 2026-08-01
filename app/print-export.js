(function () {
  "use strict";

  class CatalogPrintExport {
    constructor(store) {
      this.store = store;
      this.restoreTitle = null;
      this.bindLifecycle();
    }

    bindLifecycle() {
      window.addEventListener("beforeprint", () => document.documentElement.dataset.printing = "true");
      window.addEventListener("afterprint", () => this.cleanup());
    }

    printCurrentPage() {
      const page = this.store.getPage();
      if (!page) return false;
      const structural = window.CatalogDocumentValidator?.validate?.(this.store.getExportDocument(), { target: "draft" }) || { ok: true, target: "draft", issues: [] };
      const visual = window.CatalogVisualTextIntegrity?.audit?.({ root: document.getElementById("componentLayer"), target: "draft", surface: "print-preflight" });
      const report = visual ? window.CatalogVisualTextIntegrity.mergeReport(structural, visual) : structural;
      const blocking = report.issues.filter(issue => issue.severity === "error");
      this.lastPreflight = { ...report, blockingCount: blocking.length };
      if (blocking.length && !window.confirm(`A verificação encontrou ${blocking.length} problema(s) estrutural(is) ou visual(is). Imprimir mesmo assim?`)) return false;
      document.documentElement.dataset.printing = "true";
      this.restoreTitle = document.title;
      document.title = "catalogo-a4";
      window.print();
      window.setTimeout(() => this.cleanup(), 250);
      return true;
    }

    cleanup() {
      delete document.documentElement.dataset.printing;
      if (this.restoreTitle) document.title = this.restoreTitle;
      this.restoreTitle = null;
    }
  }

  window.CatalogPrintExport = CatalogPrintExport;
})();
