/* Incremento 05.21 — breadcrumb resiliente e determinístico. */
"use strict";

const assert = require("assert");
const { planBreadcrumb } = require("../app/context-navigation.js");

const path = ["area", "card", "gallery", "art"].map(id => ({ id, name: id }));
const deep = planBreadcrumb(path);

assert.deepStrictEqual(deep.hidden.map(item => item.id), ["area", "card"], "Os ancestrais intermediários não foram condensados.");
assert.deepStrictEqual(deep.visible.map(item => item.id), ["gallery", "art"], "Pai imediato e contexto atual precisam permanecer visíveis.");

const shallow = planBreadcrumb(path.slice(0, 2));
assert.deepStrictEqual(shallow.hidden, [], "Uma hierarquia curta não deve criar menu de overflow.");
assert.deepStrictEqual(shallow.visible.map(item => item.id), ["area", "card"], "A hierarquia curta deve permanecer integral.");

const empty = planBreadcrumb(null);
assert.deepStrictEqual(empty, { hidden: [], visible: [] }, "A página raiz precisa produzir um plano vazio e estável.");

console.log("✓ Breadcrumb 05.21 preserva raiz, pai e contexto atual e condensa somente o miolo.");
