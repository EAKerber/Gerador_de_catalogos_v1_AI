(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.audit.2";
  const EPHEMERAL_CHANGE_TYPES = new Set(["init", "selection", "editing-context", "editor-setting", "document-saved", "history-undo", "history-redo"]);
  const clone = value => JSON.parse(JSON.stringify(value));

  function documentSnapshot(state) {
    const snapshot = clone(state);
    delete snapshot.editor;
    delete snapshot.updatedAt;
    return snapshot;
  }

  function stabilizeStore(store) {
    const state = store?.getState?.();
    if (!state?.pages) return { roots: 0, passes: 0 };
    let roots = 0;
    let passes = 0;
    state.pages.forEach(page => {
      (page.children || []).forEach(component => {
        if (!store.isContainer?.(component.id) || component.reflow?.mode === "manual") return;
        roots += 1;
        if (store.reflowComponentTree?.(component.id)) passes += 1;
      });
    });
    return { roots, passes };
  }

  function install() {
    const BaseStore = window.CatalogDocumentStore;
    if (!BaseStore) return false;
    if (BaseStore.__reflowHistoryStabilityContractVersion === CONTRACT_VERSION) return true;

    class ReflowStableDocumentStore extends BaseStore {
      constructor(initialState) {
        super(initialState);
        this.__lastReflowStability = stabilizeStore(this);
        const snapshot = documentSnapshot(this.state);
        const signature = JSON.stringify(snapshot);
        this.lastHistorySnapshot = snapshot;
        this.lastHistorySignature = signature;
        this.savedSignature = signature;
        this.dirty = false;
      }

      emit(change, options = {}) {
        const ephemeral = options.ephemeral === true || EPHEMERAL_CHANGE_TYPES.has(change?.type);
        if (!ephemeral && !this.historySuspended) this.__lastReflowStability = stabilizeStore(this);
        return super.emit(change, options);
      }

      restoreHistorySnapshot(snapshot) {
        super.restoreHistorySnapshot(snapshot);
        this.__lastReflowStability = stabilizeStore(this);
      }

      getLastReflowStability() {
        return this.__lastReflowStability ? { ...this.__lastReflowStability } : null;
      }
    }

    Object.defineProperty(ReflowStableDocumentStore, "__reflowHistoryStabilityContractVersion", { value: CONTRACT_VERSION });
    window.CatalogDocumentStore = ReflowStableDocumentStore;
    return true;
  }

  window.CatalogReflowHistoryStabilityContract = Object.freeze({
    VERSION: CONTRACT_VERSION,
    install,
    stabilizeStore
  });

  install();
})();
