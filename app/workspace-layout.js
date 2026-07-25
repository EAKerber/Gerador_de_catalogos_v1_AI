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
      this.panelWidths = { left: null, right: null };
      this.panelStoragePrefix = "catalog-editor:panel-width:";
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
      document.querySelectorAll("[data-resize-panel]").forEach(handle => {
        const side = handle.dataset.resizePanel;
        handle.addEventListener("pointerdown", event => this.startPanelResize(side, event));
        handle.addEventListener("dblclick", () => this.resetPanelWidth(side));
        handle.addEventListener("keydown", event => {
          if (!["ArrowLeft", "ArrowRight", "Home"].includes(event.key)) return;
          event.preventDefault();
          if (event.key === "Home") return this.resetPanelWidth(side);
          const direction = event.key === "ArrowRight" ? 1 : -1;
          const delta = side === "left" ? direction * 12 : direction * -12;
          this.setPanelWidth(side, this.currentPanelWidth(side) + delta);
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

    defaultPanelWidth(side) {
      const property = side === "left" ? "--left-panel-width" : "--right-panel-width";
      return number(getComputedStyle(document.documentElement).getPropertyValue(property), side === "left" ? 310 : 310);
    }

    currentPanelWidth(side) {
      return number(this.panelWidths[side], this.defaultPanelWidth(side));
    }

    panelLimits(side) {
      const minimum = this.defaultPanelWidth(side);
      const otherSide = side === "left" ? "right" : "left";
      const state = this.store.getState().editor;
      const otherCollapsed = Boolean(state[`${otherSide}PanelCollapsed`]);
      const otherWidth = otherCollapsed ? 42 : this.currentPanelWidth(otherSide);
      const shellWidth = Math.max(1, this.shell?.clientWidth || window.innerWidth);
      const maximum = Math.max(minimum, shellWidth - otherWidth - 420);
      return { minimum, maximum };
    }

    setPanelWidth(side, width, options = {}) {
      const limits = this.panelLimits(side);
      const resolved = Math.round(Math.max(limits.minimum, Math.min(limits.maximum, number(width, limits.minimum))));
      this.panelWidths[side] = resolved;
      this.shell?.style.setProperty(`--${side}-panel-width`, `${resolved}px`);
      const handle = document.querySelector(`[data-resize-panel="${side}"]`);
      handle?.setAttribute("aria-valuemin", String(limits.minimum));
      handle?.setAttribute("aria-valuemax", String(limits.maximum));
      handle?.setAttribute("aria-valuenow", String(resolved));
      if (options.persist !== false) {
        try { localStorage.setItem(`${this.panelStoragePrefix}${side}`, String(resolved)); } catch (_error) {}
      }
      this.recalculate();
      return resolved;
    }

    resetPanelWidth(side) {
      try { localStorage.removeItem(`${this.panelStoragePrefix}${side}`); } catch (_error) {}
      this.panelWidths[side] = null;
      this.shell?.style.removeProperty(`--${side}-panel-width`);
      this.setPanelWidth(side, this.defaultPanelWidth(side), { persist: false });
    }

    startPanelResize(side, event) {
      if (event.button !== 0 || this.store.getState().editor[`${side}PanelCollapsed`]) return;
      event.preventDefault();
      const handle = event.currentTarget;
      const startX = event.clientX;
      const startWidth = this.currentPanelWidth(side);
      const direction = side === "left" ? 1 : -1;
      handle.setPointerCapture?.(event.pointerId);
      document.body.dataset.resizingPanel = side;
      const move = moveEvent => this.setPanelWidth(side, startWidth + (moveEvent.clientX - startX) * direction);
      const stop = () => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", stop);
        handle.removeEventListener("pointercancel", stop);
        delete document.body.dataset.resizingPanel;
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", stop);
      handle.addEventListener("pointercancel", stop);
    }

    restorePanelWidths() {
      ["left", "right"].forEach(side => {
        if (this.panelWidths[side] !== null) return;
        let saved = null;
        try { saved = localStorage.getItem(`${this.panelStoragePrefix}${side}`); } catch (_error) {}
        this.panelWidths[side] = number(saved, this.defaultPanelWidth(side));
      });
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
      this.restorePanelWidths();
      const leftCollapsed = Boolean(state.editor.leftPanelCollapsed);
      const rightCollapsed = Boolean(state.editor.rightPanelCollapsed);
      this.shell.dataset.leftPanelCollapsed = String(leftCollapsed);
      this.shell.dataset.rightPanelCollapsed = String(rightCollapsed);
      this.panelState("left", leftCollapsed);
      this.panelState("right", rightCollapsed);
      this.setPanelWidthWithoutRecalculate("left");
      this.setPanelWidthWithoutRecalculate("right");
      this.recalculate(state);
    }

    recalculate(state = this.store.getState()) {
      if (!this.viewport) return this.scale;
      ["left", "right"].forEach(side => {
        if (this.panelWidths[side] !== null) this.setPanelWidthWithoutRecalculate(side);
      });
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

    setPanelWidthWithoutRecalculate(side) {
      const limits = this.panelLimits(side);
      const resolved = Math.round(Math.max(limits.minimum, Math.min(limits.maximum, this.currentPanelWidth(side))));
      this.panelWidths[side] = resolved;
      this.shell?.style.setProperty(`--${side}-panel-width`, `${resolved}px`);
      const handle = document.querySelector(`[data-resize-panel="${side}"]`);
      handle?.setAttribute("aria-valuemin", String(limits.minimum));
      handle?.setAttribute("aria-valuemax", String(limits.maximum));
      handle?.setAttribute("aria-valuenow", String(resolved));
    }

    getScale() {
      return this.scale;
    }
  }

  window.CatalogWorkspaceGeometry = { computeFitScale, nextWheelZoom };
  window.CatalogWorkspaceLayout = WorkspaceLayout;
})();
