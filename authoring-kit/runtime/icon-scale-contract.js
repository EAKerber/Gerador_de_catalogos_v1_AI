(function () {
  "use strict";

  const CONTRACT_VERSION = "05.19.5";

  function install() {
    return { version: CONTRACT_VERSION, stylesInstalled: false };
  }

  window.CatalogIconScaleContract = Object.freeze({ VERSION: CONTRACT_VERSION, install });

  install();
})();
