(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.audit.4";
  function synchronizeHistoryBaseline(store) {
    return store?.synchronizeHistoryBaseline?.() || null;
  }

  function stabilizeStore(store) {
    return store?.stabilizeManagedReflow?.() || { roots: 0, passes: 0 };
  }

  function install() {
    const Store = window.CatalogDocumentStore;
    return Boolean(
      Store?.__reflowHistoryStabilityContractVersion === CONTRACT_VERSION
      && Store.prototype?.stabilizeManagedReflow
      && Store.prototype?.synchronizeHistoryBaseline
      && Store.prototype?.getLastReflowStability
    );
  }

  window.CatalogReflowHistoryStabilityContract = Object.freeze({
    VERSION: CONTRACT_VERSION,
    install,
    stabilizeStore,
    synchronizeHistoryBaseline
  });

  install();
})();
