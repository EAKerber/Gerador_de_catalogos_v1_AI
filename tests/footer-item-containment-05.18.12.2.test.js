/* DB-05.19.3 — geometria e recorte do footer-item pertencem às superfícies canônicas. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const sandbox = {
  window: {},
  document: undefined,
  console,
  Object,
  Number,
  Math,
  Array,
  String
};
sandbox.window.window = sandbox.window;
sandbox.window.CatalogEditorIcon = () => "";
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "app", "component-registry.js"), "utf8"), sandbox, { filename: "component-registry.js" });

const definition = sandbox.window.CATALOG_COMPONENT_REGISTRY["footer-item"];
const titleSlot = definition.container.slots.find(slot => slot.name === "title");
const subtitleSlot = definition.container.slots.find(slot => slot.name === "subtitle");
const titleFrameBeforeShim = titleSlot.getFrame;
const subtitleFrameBeforeShim = subtitleSlot.getFrame;

vm.runInContext(fs.readFileSync(path.join(root, "app", "footer-item-containment-contract.js"), "utf8"), sandbox, { filename: "footer-item-containment-contract.js" });
assert(sandbox.window.CatalogFooterItemContainmentContract.install(), "O shim não encontrou footer-item no registro.");
assert(titleSlot.getFrame === titleFrameBeforeShim && subtitleSlot.getFrame === subtitleFrameBeforeShim, "O shim ainda substitui a geometria canônica.");

function component(width, height, slots = ["icon", "title", "subtitle"]) {
  return {
    type: "footer-item",
    frame: { x: 0, y: 0, width, height },
    children: slots.map((name, index) => ({ id: `${name}-${index}`, type: name === "icon" ? "icon" : "text", slot: { name } }))
  };
}

function framesFor(source) {
  return {
    title: titleSlot.getFrame(source),
    subtitle: subtitleSlot.getFrame(source)
  };
}

function assertContained(source) {
  const frames = framesFor(source);
  for (const [name, frame] of Object.entries(frames)) {
    assert(frame.x >= 0 && frame.y >= 0, `${name} começou fora do footer-item: ${JSON.stringify(frame)}.`);
    assert(frame.x + frame.width <= source.frame.width, `${name} vazou horizontalmente: ${JSON.stringify(frame)} em ${JSON.stringify(source.frame)}.`);
    assert(frame.y + frame.height <= source.frame.height, `${name} vazou verticalmente: ${JSON.stringify(frame)} em ${JSON.stringify(source.frame)}.`);
  }
  assert(frames.title.y + frames.title.height <= frames.subtitle.y, `Título e subtítulo se sobrepõem: ${JSON.stringify(frames)}.`);
  return frames;
}

for (const [width, height] of [[80, 64], [80, 77], [112, 96]]) {
  const frames = assertContained(component(width, height));
  assert(frames.title.height >= 14, `Título ficou abaixo do mínimo legível em ${width}×${height}.`);
  assert(frames.subtitle.height >= 14, `Subtítulo ficou abaixo do mínimo legível em ${width}×${height}.`);
}

const minimum = framesFor(component(80, 64));
assert(minimum.title.height === 14 && minimum.subtitle.height === 14, `O mínimo 64 px não foi dividido em 14 + 14 px: ${JSON.stringify(minimum)}.`);
assert(minimum.subtitle.y + minimum.subtitle.height === 61, "O subtítulo não preservou o inset inferior de 3 px.");

const subtitleOnly = framesFor(component(80, 40, ["subtitle"]));
assert(subtitleOnly.subtitle.x === 4 && subtitleOnly.subtitle.width === 72, `A largura do subtítulo isolado não está contida: ${JSON.stringify(subtitleOnly.subtitle)}.`);
assert(subtitleOnly.subtitle.y + subtitleOnly.subtitle.height === 37, "O subtítulo isolado não preservou o inset inferior.");

const helperFrames = sandbox.window.CatalogFooterItemContainmentContract.textFrames(component(80, 64));
assert(JSON.stringify(helperFrames) === JSON.stringify(minimum), "O helper de compatibilidade divergiu da geometria canônica.");

const css = fs.readFileSync(path.join(root, "styles", "components.css"), "utf8");
assert(css.includes('.editor-component--footer-item:not([data-active-context="true"]) > .component-children-layer'), "O recorte de preview não está no CSS canônico.");
assert(css.includes(".editor-component--footer-item > .component-children-layer > .editor-component--text {"), "Os mínimos defensivos dos textos não estão no CSS canônico.");
assert(css.includes("overflow: hidden !important"), "O recorte de impressão não está no CSS canônico.");

const appRegistry = fs.readFileSync(path.join(root, "app", "component-registry.js"), "utf8");
const kitRegistry = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "component-registry.js"), "utf8");
const appShim = fs.readFileSync(path.join(root, "app", "footer-item-containment-contract.js"), "utf8");
const kitShim = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "footer-item-containment-contract.js"), "utf8");
assert(appRegistry === kitRegistry, "O registro canônico divergiu entre editor e AuthoringKit.");
assert(appShim === kitShim, "O shim divergiu entre editor e AuthoringKit.");
assert(sandbox.window.CatalogFooterItemContainmentContract.VERSION === "05.19.3", "Versão inesperada do shim.");

console.log("✓ Geometria e recorte do footer-item pertencem ao registro e CSS canônicos; shim não altera o runtime.");
