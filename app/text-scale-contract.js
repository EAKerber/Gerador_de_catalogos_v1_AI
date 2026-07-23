(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.3";

  function installStyles() {
    if (typeof document === "undefined" || document.querySelector(`[data-text-scale-contract="${CONTRACT_VERSION}"]`)) return false;
    const style = document.createElement("style");
    style.dataset.textScaleContract = CONTRACT_VERSION;
    style.textContent = `
.editor-component--footer-item > .component-children-layer > .editor-component--text[data-slot-name="title"] .component-text p {
  font-size: calc(min(var(--component-title-size, 10px), 11px) * var(--text-content-scale, 1));
}
.editor-component--footer-item > .component-children-layer > .editor-component--text[data-slot-name="subtitle"] .component-text p {
  font-size: calc(8px * var(--text-content-scale, 1));
}
`;
    document.head.appendChild(style);
    return true;
  }

  function install() {
    return { version: CONTRACT_VERSION, stylesInstalled: installStyles() };
  }

  window.CatalogTextScaleContract = Object.freeze({ VERSION: CONTRACT_VERSION, install });
})();
