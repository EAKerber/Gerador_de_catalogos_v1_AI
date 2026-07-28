/* Incremento 05.38 — projeção da biblioteca por intenção no renderer canônico. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

global.window = global;
global.location = { href: "http://127.0.0.1:8080/index.html" };
global.document = {
  currentScript: { src: "http://127.0.0.1:8080/app/component-palette-intent-contract.js" },
  querySelector() { return null; },
  createElement() {
    return {
      dataset: {},
      addEventListener() {},
      appendChild() {}
    };
  },
  head: { appendChild() {} },
  getElementById() {
    return { addEventListener() {} };
  }
};
global.CATALOG_EDITOR_TOKENS = {};
global.CATALOG_COMPONENT_REGISTRY = {};
global.CatalogEditorIcon = () => "";

vm.runInThisContext(read("app/renderer.js"), { filename: "app/renderer.js" });
const canonicalRenderPalette = CatalogEditorRenderer.prototype.renderPalette;
vm.runInThisContext(read("app/component-palette-intent-contract.js"), {
  filename: "app/component-palette-intent-contract.js"
});

assert(CatalogComponentPaletteIntentContract.install() === true, "O contrato não reconheceu o renderer canônico.");
assert(CatalogEditorRenderer.prototype.renderPalette === canonicalRenderPalette, "A instalação substituiu renderPalette.");
assert(CatalogComponentPaletteIntentContract.install() === true, "A reinstalação deixou de ser idempotente.");
assert(CatalogEditorRenderer.prototype.renderPalette === canonicalRenderPalette, "A reinstalação alterou a identidade do método.");

const rendererSource = read("app/renderer.js");
const contractSource = read("app/component-palette-intent-contract.js");
assert(rendererSource.includes("CatalogComponentPaletteIntentContract?.enhance?.(this)"), "O renderer canônico não projeta a biblioteca por intenção.");
assert(!contractSource.includes("Renderer.prototype.renderPalette ="), "O contrato voltou a substituir o método do renderer.");
assert(contractSource.includes("enhance })"), "O contrato não expõe a projeção declarativa ao renderer.");

console.log("✓ Biblioteca por intenção preservada sem substituição tardia de renderPalette.");
