(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.5";

  function installStyles() {
    if (typeof document === "undefined" || document.querySelector(`[data-icon-scale-contract="${CONTRACT_VERSION}"]`)) return false;
    const style = document.createElement("style");
    style.dataset.iconScaleContract = CONTRACT_VERSION;
    style.textContent = `
.editor-component--footer-item > .component-children-layer > .editor-component--icon[data-slot-name="icon"] .component-icon__svg {
  width: min(83.333333%, 26px);
  height: min(83.333333%, 26px);
  max-width: 100%;
  max-height: 100%;
}
`;
    document.head.appendChild(style);
    return true;
  }

  function install() {
    return { version: CONTRACT_VERSION, stylesInstalled: installStyles() };
  }

  window.CatalogIconScaleContract = Object.freeze({ VERSION: CONTRACT_VERSION, install });
})();
