const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.CATALOG_COMPONENT_REGISTRY = {
  box: { minSize: { width: 40, height: 30 } },
  container: {
    minSize: { width: 100, height: 80 },
    container: { autoLayout: true },
    defaultLayout: { mode: "row", padding: 10, gap: 10, columns: 2, responsive: { enabled: true, breakpoint: 180, mode: "column" } }
  }
};
vm.runInThisContext(fs.readFileSync(path.join(root, "app/layout-engine.js"), "utf8"));

function assert(condition, message) { if (!condition) throw new Error(message); }

const container = {
  type: "container",
  frame: { x: 0, y: 0, width: 300, height: 120 },
  constraints: { minWidth: 100, minHeight: 80 },
  layout: { mode: "row", padding: 10, gap: 10, columns: 2, responsive: { enabled: true, breakpoint: 180, mode: "column" } },
  children: [
    { id: "a", type: "box", frame: { x: 0, y: 0, width: 40, height: 30 }, constraints: { minWidth: 40, minHeight: 30 }, layoutItem: { managed: true } },
    { id: "b", type: "box", frame: { x: 0, y: 0, width: 40, height: 30 }, constraints: { minWidth: 40, minHeight: 30 }, layoutItem: { managed: true } }
  ]
};

assert(CatalogLayoutEngine.effectiveMode(container) === "row", "Modo amplo incorreto.");
assert(CatalogLayoutEngine.effectiveMode(container, 170) === "column", "Breakpoint responsivo incorreto.");
CatalogLayoutEngine.applyAutoLayout(container);
assert(container.children[0].frame.x < container.children[1].frame.x, "Layout em linha falhou.");

const snapped = CatalogLayoutEngine.snapFrame(
  { x: 95, y: 10, width: 50, height: 40 },
  {
    mode: "move",
    siblings: [{ id: "target", frame: { x: 150, y: 10, width: 50, height: 40 } }],
    containerSize: { width: 400, height: 300 },
    tolerance: 6,
    equalSpacing: false,
    snapX: true,
    snapY: true
  }
);
assert(snapped.frame.x === 100, "Snap de borda não alinhou o componente.");
assert(snapped.guides.some(guide => guide.axis === "x"), "Guia vertical não foi emitida.");

console.log("✓ Snap inteligente, guias e layout responsivo validados.");
