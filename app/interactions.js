(function () {
  "use strict";

  class EditorInteractions {
    constructor(store) {
      this.store = store;
      this.page = document.getElementById("pageCanvas");
      this.layer = document.getElementById("componentLayer");
      this.guideLayer = document.getElementById("smartGuideLayer");
      this.palette = document.getElementById("componentPalette");
      this.layers = document.getElementById("layerList");
      this.breadcrumb = document.getElementById("contextBreadcrumb");
      this.session = null;
      this.activeDropSlot = null;
      this.draggedType = null;
      this.draggedTemplateId = null;
      this.bind();
    }

    bind() {
      this.palette.addEventListener("dragstart", event => {
        const item = event.target.closest("[data-component-type]");
        if (!item) return;
        this.draggedType = item.dataset.componentType;
        this.draggedTemplateId = item.dataset.templateId || null;
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData("application/x-catalog-component", item.dataset.componentType);
        if (this.draggedTemplateId) event.dataTransfer.setData("application/x-catalog-template", this.draggedTemplateId);
        event.dataTransfer.setData("text/plain", item.dataset.componentType);
      });
      this.palette.addEventListener("dragend", () => {
        this.draggedType = null;
        this.draggedTemplateId = null;
        this.clearDropIndicators();
        this.clearGuides();
      });
      this.palette.addEventListener("click", event => {
        const contextualAction = event.target.closest("[data-context-action]");
        if (contextualAction) {
          event.preventDefault();
          event.stopPropagation();
          try {
            this.store.performContextualAction(contextualAction.dataset.contextAction, contextualAction.dataset.contextComponentId);
          } catch (error) {
            this.reportError(error);
          }
          return;
        }
        const remove = event.target.closest("[data-delete-template]");
        if (remove) {
          event.preventDefault();
          event.stopPropagation();
          if (window.confirm("Excluir este componente de Meus componentes?")) this.store.removeComponentTemplate(remove.dataset.deleteTemplate);
          return;
        }
        const template = event.target.closest("[data-insert-template]");
        const component = event.target.closest("[data-insert-component]");
        if (!template && !component) return;
        event.preventDefault();
        event.stopPropagation();
        try {
          if (template) this.store.insertComponentFromTemplate(template.dataset.insertTemplate);
          else this.store.insertComponent(component.dataset.insertComponent);
        } catch (error) {
          this.reportError(error);
        }
      });
      this.palette.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const item = event.target.closest("[data-component-type]");
        if (!item) return;
        event.preventDefault();
        try {
          if (item.dataset.templateId) this.store.insertComponentFromTemplate(item.dataset.templateId);
          else this.store.insertComponent(item.dataset.componentType);
        } catch (error) {
          this.reportError(error);
        }
      });

      this.page.addEventListener("dragover", event => this.handleDragOver(event));
      this.page.addEventListener("dragleave", event => {
        if (!this.page.contains(event.relatedTarget)) this.clearDropIndicators();
      });
      this.page.addEventListener("drop", event => this.handleDrop(event));
      this.page.addEventListener("pointerdown", event => this.handlePointerDown(event));
      this.page.addEventListener("dblclick", event => {
        const component = event.target.closest("[data-component-id]");
        if (component && this.store.isContainer(component.dataset.componentId)) {
          this.store.setEditingContext(component.dataset.componentId);
        }
      });

      this.layers.addEventListener("click", event => {
        const enter = event.target.closest("[data-enter-container]");
        if (enter) {
          this.store.setEditingContext(enter.dataset.enterContainer);
          return;
        }
        const item = event.target.closest("[data-layer-id]");
        if (item) this.store.selectComponentInContext(item.dataset.layerId, { toggle: event.shiftKey || event.ctrlKey || event.metaKey });
      });

      this.breadcrumb.addEventListener("click", event => {
        const exit = event.target.closest("[data-exit-context]");
        if (exit) {
          this.store.exitEditingContext();
          return;
        }
        const item = event.target.closest("[data-context-id]");
        if (item) this.store.setEditingContext(item.dataset.contextId || null);
      });

      this.page.addEventListener("click", event => {
        const enter = event.target.closest("[data-enter-container]");
        if (enter) {
          event.stopPropagation();
          this.store.setEditingContext(enter.dataset.enterContainer);
        }
      });

      window.addEventListener("pointermove", event => this.handlePointerMove(event));
      window.addEventListener("pointerup", () => this.handlePointerUp());
      window.addEventListener("keydown", event => this.handleKeyDown(event));
    }

    contextElement(contextId) {
      return contextId ? this.layer.querySelector(`[data-component-id="${CSS.escape(contextId)}"]`) : this.page;
    }

    reportError(error) {
      console.warn(error);
      const status = document.getElementById("documentStatus");
      if (status) status.textContent = error?.message || "Não foi possível concluir a inserção.";
    }

    isInsideContext(event, contextId) {
      const element = this.contextElement(contextId);
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    }

    pointInContext(event, contextId) {
      const element = this.contextElement(contextId);
      const rect = element.getBoundingClientRect();
      const zoom = window.CatalogWorkspace?.getScale() || this.store.getState().editor.zoom;
      return { x: (event.clientX - rect.left) / zoom, y: (event.clientY - rect.top) / zoom };
    }

    snap(value, unit, enabled) {
      return enabled ? Math.round(value / unit) * unit : value;
    }

    slotAtPoint(contextId, point, type) {
      if (!contextId) return null;
      const parent = this.store.findComponent(contextId)?.component;
      if (!parent) return null;
      const slots = this.store.getSlotDefinitions(contextId);
      return slots.find(slot => {
        if (!slot.accepts.includes(type)) return false;
        const frame = window.CatalogComponentGeometry.slotFrame(parent, slot.name);
        return point.x >= frame.x && point.x <= frame.x + frame.width && point.y >= frame.y && point.y <= frame.y + frame.height;
      }) || null;
    }

    showDropSlot(contextId, slotName) {
      if (this.activeDropSlot === slotName) return;
      this.layer.querySelectorAll(".component-slot[data-drop-target='true']").forEach(node => node.dataset.dropTarget = "false");
      this.activeDropSlot = slotName || null;
      if (!contextId || !slotName) return;
      const context = this.contextElement(contextId);
      const slot = context?.querySelector(`:scope > .component-slots [data-slot-name="${CSS.escape(slotName)}"]`);
      if (slot) slot.dataset.dropTarget = "true";
    }

    clearDropIndicators() {
      this.page.dataset.dropActive = "false";
      this.showDropSlot(null, null);
    }

    clearGuides() {
      if (this.guideLayer) this.guideLayer.innerHTML = "";
    }

    renderGuides(guides, contextId) {
      if (!this.guideLayer) return;
      const state = this.store.getState();
      if (!state.editor.showGuides || !guides?.length) {
        this.clearGuides();
        return;
      }
      const offset = this.store.getAbsoluteOffset(contextId);
      const size = this.store.getContainerSize(contextId);
      this.guideLayer.innerHTML = guides.map(guide => {
        const spacing = guide.type === "spacing";
        if (guide.axis === "x") {
          const x = offset.x + guide.value;
          return `<div class="smart-guide smart-guide--vertical" data-guide-type="${guide.type}" style="left:${x}px;top:${offset.y}px;height:${size.height}px"><span>${spacing ? `= ${Math.round(guide.gap)} px` : guide.anchor || "alinhado"}</span></div>`;
        }
        const y = offset.y + guide.value;
        return `<div class="smart-guide smart-guide--horizontal" data-guide-type="${guide.type}" style="left:${offset.x}px;top:${y}px;width:${size.width}px"><span>${spacing ? `= ${Math.round(guide.gap)} px` : guide.anchor || "alinhado"}</span></div>`;
      }).join("");
    }

    dragType(event) {
      return this.draggedType || event.dataTransfer.getData("application/x-catalog-component") || event.dataTransfer.getData("text/plain");
    }

    dragTemplateId(event) {
      return this.draggedTemplateId || event.dataTransfer.getData("application/x-catalog-template") || null;
    }

    smartSnap(frame, componentId, contextId, mode, snapX, snapY, disabled = false) {
      const state = this.store.getState();
      if (disabled || !state.editor.smartSnapEnabled || (!snapX && !snapY)) return { frame, guides: [] };
      return window.CatalogLayoutEngine.snapFrame(frame, {
        mode,
        siblings: this.store.getContextSiblings(contextId, componentId),
        containerSize: this.store.getContainerSize(contextId),
        safeMargin: contextId ? 0 : this.store.getPage().grid.safeMargin,
        tolerance: state.editor.snapTolerance,
        equalSpacing: state.editor.equalSpacingEnabled,
        snapX,
        snapY
      });
    }

    handleDragOver(event) {
      event.preventDefault();
      const contextId = this.store.getState().editor.editingContextId;
      const type = this.dragType(event);
      const allowed = Boolean(type && this.store.isTypeAllowed(type, contextId));
      const inside = this.isInsideContext(event, contextId);
      event.dataTransfer.dropEffect = allowed && inside ? "copy" : "none";
      this.page.dataset.dropActive = String(allowed && inside);
      if (!allowed || !inside) {
        this.showDropSlot(null, null);
        return;
      }
      const point = this.pointInContext(event, contextId);
      const slot = this.slotAtPoint(contextId, point, type);
      this.showDropSlot(contextId, slot?.name || null);
    }

    handleDrop(event) {
      event.preventDefault();
      const type = this.dragType(event);
      const templateId = this.dragTemplateId(event);
      const contextId = this.store.getState().editor.editingContextId;
      if (!type || !this.store.isTypeAllowed(type, contextId) || !this.isInsideContext(event, contextId)) {
        this.clearDropIndicators();
        return;
      }

      const definition = window.CATALOG_COMPONENT_REGISTRY[type];
      const point = this.pointInContext(event, contextId);
      const slot = this.slotAtPoint(contextId, point, type);
      let replace = false;
      if (slot) {
        const occupants = this.store.getSlotOccupants(contextId, slot.name);
        if (occupants.length >= slot.capacity) {
          replace = window.confirm(`O slot “${slot.label}” já está ocupado. Substituir o conteúdo atual?`);
          if (!replace) {
            this.clearDropIndicators();
            return;
          }
        }
      }

      const state = this.store.getState();
      const globalSnap = state.editor.snapEnabled && !event.altKey;
      const unit = definition.gridUnit;
      const templateFrame = templateId
        ? this.store.getInsertableTemplate(templateId)?.metadata?.component?.frame
        : null;
      const defaultWidth = Number(templateFrame?.width) || definition.defaultFrame.width;
      const defaultHeight = Number(templateFrame?.height) || definition.defaultFrame.height;
      let frame = {
        x: this.snap(point.x - defaultWidth / 2, unit, globalSnap),
        y: this.snap(point.y - defaultHeight / 2, unit, globalSnap),
        width: defaultWidth,
        height: defaultHeight
      };
      if (!slot) {
        const snapped = this.smartSnap(frame, null, contextId, "move", globalSnap, globalSnap, event.altKey);
        frame = snapped.frame;
      }

      try {
        if (templateId) this.store.addComponentFromTemplate(templateId, frame, { parentId: contextId, slotName: slot?.name || null, replace });
        else this.store.addComponent(type, frame, { parentId: contextId, slotName: slot?.name || null, replace });
      } catch (error) {
        this.reportError(error);
      }
      this.draggedType = null;
      this.draggedTemplateId = null;
      this.clearDropIndicators();
      this.clearGuides();
    }

    handlePointerDown(event) {
      if (event.target.closest("[data-enter-container], [data-open-asset-library], [data-use-asset], [data-clear-asset]")) return;
      const contextId = this.store.getState().editor.editingContextId;
      let hitElement = event.target.closest("[data-component-id]");
      while (hitElement && hitElement.dataset.componentId !== contextId && (hitElement.dataset.parentId || null) !== contextId) {
        hitElement = hitElement.parentElement?.closest("[data-component-id]") || null;
      }
      if (!hitElement) {
        this.store.setSelection(null);
        return;
      }
      const componentId = hitElement.dataset.componentId;
      const parentId = hitElement.dataset.parentId || null;
      const resizing = Boolean(event.target.closest("[data-resize-handle]"));

      const additive = event.shiftKey || event.ctrlKey || event.metaKey;
      if (additive) {
        this.store.setSelection(componentId, { toggle: true });
        event.preventDefault();
        return;
      }
      if (this.store.getState().editor.selectedComponentId !== componentId || this.store.getSelectedIds().length > 1) this.store.setSelection(componentId);
      if (componentId === contextId || parentId !== contextId) {
        event.preventDefault();
        return;
      }

      const record = this.store.findComponent(componentId);
      if (!record) return;
      const component = record.component;
      const liveElement = this.layer.querySelector(`[data-component-id="${CSS.escape(componentId)}"]`) || hitElement;
      const point = this.pointInContext(event, parentId);
      const parentAutoLayout = Boolean(record.parent && window.CATALOG_COMPONENT_REGISTRY[record.parent.type]?.container?.autoLayout);
      this.session = {
        mode: resizing ? "resize" : "move",
        componentId,
        parentId,
        element: liveElement,
        startPoint: point,
        startFrame: { ...component.frame },
        axisLock: null,
        wasSlotted: Boolean(component.slot?.name),
        wasAutoManaged: Boolean(parentAutoLayout && component.layoutItem?.managed !== false)
      };
      event.preventDefault();
    }

    handlePointerMove(event) {
      if (!this.session) return;
      const record = this.store.findComponent(this.session.componentId);
      const component = record?.component;
      if (!component) return;
      const point = this.pointInContext(event, this.session.parentId);
      let dx = point.x - this.session.startPoint.x;
      let dy = point.y - this.session.startPoint.y;

      if (event.shiftKey && this.session.mode === "move") {
        if (!this.session.axisLock) this.session.axisLock = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
        if (this.session.axisLock === "x") dy = 0;
        else dx = 0;
      }

      const state = this.store.getState();
      const globalSnap = state.editor.snapEnabled && !event.altKey;
      const unit = component.constraints.gridUnit || this.store.getPage().grid.unit;
      const snapX = globalSnap && component.constraints.snapX && !component.constraints.freeX;
      const snapY = globalSnap && component.constraints.snapY && !component.constraints.freeY;
      let candidate;

      if (this.session.mode === "move") {
        candidate = {
          ...this.session.startFrame,
          x: this.snap(this.session.startFrame.x + dx, unit, snapX),
          y: this.snap(this.session.startFrame.y + dy, unit, snapY)
        };
      } else {
        candidate = {
          ...this.session.startFrame,
          width: this.snap(this.session.startFrame.width + dx, unit, snapX),
          height: this.snap(this.session.startFrame.height + dy, unit, snapY)
        };
      }

      const smart = this.smartSnap(candidate, component.id, this.session.parentId, this.session.mode, snapX, snapY, event.altKey);
      const next = this.store.clampFrame(smart.frame, component, this.session.parentId);
      this.renderGuides(smart.guides, this.session.parentId);
      this.session.previewFrame = next;
      Object.assign(this.session.element.style, {
        left: `${next.x}px`,
        top: `${next.y}px`,
        width: `${next.width}px`,
        height: `${next.height}px`
      });
    }

    handlePointerUp() {
      if (!this.session) return;
      if (this.session.previewFrame) {
        if (this.session.wasSlotted) this.store.markSlotFree(this.session.componentId);
        if (this.session.wasAutoManaged) this.store.markLayoutFree(this.session.componentId);
        this.store.updateComponent(this.session.componentId, { frame: this.session.previewFrame });
      }
      this.session = null;
      this.clearGuides();
    }

    handleKeyDown(event) {
      const editingField = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      if (!editingField && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) this.store.redo();
        else this.store.undo();
        return;
      }
      if (!editingField && event.ctrlKey && event.key.toLowerCase() === "y") {
        event.preventDefault();
        this.store.redo();
        return;
      }
      if (editingField) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
        event.preventDefault();
        this.store.selectContextChildren();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        const selectedIds = this.store.getSelectedIds();
        if (selectedIds.length) {
          event.preventDefault();
          if (selectedIds.length > 1) this.store.duplicateComponents(selectedIds);
          else this.store.duplicateComponent(selectedIds[0]);
        }
        return;
      }
      if (event.key === "Escape" && this.store.getState().editor.editingContextId) {
        this.store.exitEditingContext();
        return;
      }
      if (event.key === "Enter") {
        const selected = this.store.getSelected();
        if (selected && this.store.isContainer(selected.id)) this.store.setEditingContext(selected.id);
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        const selectedIds = this.store.getSelectedIds();
        if (selectedIds.length > 1) this.store.deleteComponents(selectedIds);
        else if (selectedIds.length === 1) this.store.deleteComponent(selectedIds[0]);
      }
    }
  }

  window.CatalogEditorInteractions = EditorInteractions;
})();
