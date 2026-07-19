(function () {
  "use strict";

  function number(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function computeFitScale(options) {
    const padding = options.padding || {};
    const availableWidth = Math.max(1, number(options.viewportWidth, 1) - number(padding.left, 0) - number(padding.right, 0));
    const availableHeight = Math.max(1, number(options.viewportHeight, 1) - number(padding.top, 0) - number(padding.bottom, 0));
    const pageWidth = Math.max(1, number(options.pageWidth, 794));
    const pageHeight = Math.max(1, number(options.pageHeight, 1123));
    const minimum = number(options.minimum, 0.25);
    const maximum = number(options.maximum, 1);
    const raw = Math.min(availableWidth / pageWidth, availableHeight / pageHeight, maximum);
    return Math.max(minimum, Math.floor(raw * 1000) / 1000);
  }

  function nextWheelZoom(current, deltaY, options = {}) {
    const minimum = number(options.minimum, 0.25);
    const maximum = number(options.maximum, 2);
    const step = number(options.step, 0.05);
    const direction = Number(deltaY) < 0 ? 1 : -1;
    return Math.round(Math.max(minimum, Math.min(maximum, number(current, 0.7) + direction * step)) * 100) / 100;
  }

  class WorkspaceLayout {
    constructor(store) {
      this.store = store;
      this.shell = document.querySelector(".editor-shell");
      this.viewport = document.getElementById("workspaceViewport");
      this.zoomSelect = document.getElementById("zoomSelect");
      this.scale = number(store.getState().editor.zoom, 0.7);
      this.bind();
    }

    bind() {
      document.querySelectorAll("[data-toggle-panel]").forEach(button => {
        button.addEventListener("click", () => {
          const side = button.dataset.togglePanel;
          const key = side === "left" ? "leftPanelCollapsed" : "rightPanelCollapsed";
          this.store.setEditorSetting(key, !this.store.getState().editor[key]);
        });
      });
      window.addEventListener("resize", () => this.recalculate());
      this.viewport?.addEventListener("wheel", event => {
        if (!event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        const current = this.store.getState().editor.zoomMode === "manual"
          ? this.store.getState().editor.zoom
          : this.scale;
        this.store.setEditorSettings({ zoomMode: "manual", zoom: nextWheelZoom(current, event.deltaY) });
      }, { passive: false });
      if (window.ResizeObserver && this.viewport) {
        this.resizeObserver = new ResizeObserver(() => this.recalculate());
        this.resizeObserver.observe(this.viewport);
      }
    }

    panelState(side, collapsed) {
      const button = document.querySelector(`[data-toggle-panel="${side}"]`);
      const panel = document.querySelector(`.side-panel--${side}`);
      if (!button || !panel) return;
      button.setAttribute("aria-expanded", String(!collapsed));
      button.setAttribute("aria-label", `${collapsed ? "Expandir" : "Recolher"} painel ${side === "left" ? "esquerdo" : "direito"}`);
      button.title = button.getAttribute("aria-label");
      button.textContent = side === "left" ? (collapsed ? "›" : "‹") : (collapsed ? "‹" : "›");
      panel.dataset.collapsed = String(collapsed);
    }

    render(state = this.store.getState()) {
      const leftCollapsed = Boolean(state.editor.leftPanelCollapsed);
      const rightCollapsed = Boolean(state.editor.rightPanelCollapsed);
      this.shell.dataset.leftPanelCollapsed = String(leftCollapsed);
      this.shell.dataset.rightPanelCollapsed = String(rightCollapsed);
      this.panelState("left", leftCollapsed);
      this.panelState("right", rightCollapsed);
      this.recalculate(state);
    }

    recalculate(state = this.store.getState()) {
      if (!this.viewport) return this.scale;
      const page = this.store.getPage();
      const mode = state.editor.zoomMode === "manual" ? "manual" : "fit";
      if (mode === "fit") {
        const style = getComputedStyle(this.viewport);
        this.scale = computeFitScale({
          viewportWidth: this.viewport.clientWidth,
          viewportHeight: this.viewport.clientHeight,
          pageWidth: page.size.width,
          pageHeight: page.size.height,
          padding: {
            left: parseFloat(style.paddingLeft) || 0,
            right: parseFloat(style.paddingRight) || 0,
            top: parseFloat(style.paddingTop) || 0,
            bottom: parseFloat(style.paddingBottom) || 0
          },
          minimum: 0.25,
          maximum: 1
        });
      } else {
        this.scale = Math.max(0.1, Math.min(4, number(state.editor.zoom, 0.7)));
      }
      document.documentElement.style.setProperty("--editor-zoom", String(this.scale));
      this.viewport.dataset.zoomMode = mode;
      this.viewport.dataset.effectiveZoom = String(this.scale);
      if (this.zoomSelect) {
        const fitOption = this.zoomSelect.querySelector('option[value="fit"]');
        if (fitOption) fitOption.textContent = `Ajustar (${Math.round(this.scale * 100)}%)`;
      }
      return this.scale;
    }

    getScale() {
      return this.scale;
    }
  }

  window.CatalogWorkspaceGeometry = { computeFitScale, nextWheelZoom };
  window.CatalogWorkspaceLayout = WorkspaceLayout;
})();
