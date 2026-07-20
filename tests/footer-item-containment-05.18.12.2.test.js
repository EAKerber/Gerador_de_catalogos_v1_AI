/* DB-05.18.12.2 — geometria mínima contida do footer-item. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const definition = {
  minSize: { width: 80, height: 64 },
  container: {
    slots: [
      { name: "icon", getFrame: () => ({ x: 27, y: 4, width: 26, height: 26 }) },
      { name: "title", getFrame: () => ({ x: 4, y: 31, width: 80, height: 34 }) },
      { name: "subtitle", getFrame: () => ({ x: 4, y: 65, width: 80, height: 34 }) }
    ]
  }
};
const sandbox = {
  window: { CATALOG_COMPONENT_REGISTRY: { "footer-item": definition } },
  document: undefined,
  console,
  Object,
  Number,
  Math
};
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "app", "footer-item-containment-contract.js"), "utf8"), sandbox, { filename: "footer-item-containment-contract.js" });

const installed = sandbox.window.CatalogFooterItemContainmentContract.install();
assert(installed.geometryInstalled === true, "O contrato não substituiu a geometria do footer-item.");
assert(installed.stylesInstalled === false, "O teste sem DOM não deveria instalar estilos.");

function component(width, height, slots = ["icon", "title", "subtitle"]) {
  return {
    type: "footer-item",
    frame: { x: 0, y: 0, width, height },
    children: slots.map((name, index) => ({ id: `${name}-${index}`, type: name === "icon" ? "icon" : "text", slot: { name } }))
  };
}

function framesFor(source) {
  return Object.fromEntries(definition.container.slots
    .filter(slot => slot.name === "title" || slot.name === "subtitle")
    .map(slot => [slot.name, slot.getFrame(source)]));
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
  if (height >= 64) {
    assert(frames.title.height >= 14, `Título ficou abaixo do mínimo legível em ${width}×${height}.`);
    assert(frames.subtitle.height >= 14, `Subtítulo ficou abaixo do mínimo legível em ${width}×${height}.`);
  }
}

const minimum = framesFor(component(80, 64));
assert(minimum.title.height === 14 && minimum.subtitle.height === 14, `O mínimo 64 px não foi dividido em 14 + 14 px: ${JSON.stringify(minimum)}.`);
assert(minimum.subtitle.y + minimum.subtitle.height === 61, "O subtítulo não preservou o inset inferior de 3 px.");

const subtitleOnly = framesFor(component(80, 40, ["subtitle"]));
assert(subtitleOnly.subtitle.x === 4 && subtitleOnly.subtitle.width === 72, `A largura do subtítulo isolado não está contida: ${JSON.stringify(subtitleOnly.subtitle)}.`);
assert(subtitleOnly.subtitle.y + subtitleOnly.subtitle.height === 37, "O subtítulo isolado não preservou o inset inferior.");

const appSource = fs.readFileSync(path.join(root, "app", "footer-item-containment-contract.js"), "utf8");
const kitSource = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "footer-item-containment-contract.js"), "utf8");
assert(appSource === kitSource, "O contrato divergiu entre editor e AuthoringKit.");
assert(fs.readFileSync(path.join(root, "app", "main.js"), "utf8").includes('file: "footer-item-containment-contract.js"'), "O editor não carrega o contrato.");
const compilerSource = fs.readFileSync(path.join(root, "authoring-kit", "compiler", "compile-catalog.js"), "utf8");
assert(compilerSource.includes('"footer-item-containment-contract.js"'), "O compilador não carrega o contrato.");
assert(compilerSource.includes("CatalogFooterItemContainmentContract.install()"), "O compilador não instala o contrato.");

console.log("✓ DB-05.18.12.2 contém título e subtítulo no mínimo técnico sem alterar o schema.");
