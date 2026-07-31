"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const backlog = fs.readFileSync(path.join(root, "docs/BACKLOG.md"), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(
  backlog.includes("Validação prática pós-promoção — ensaio de 2026-07-30"),
  "O backlog não registra o primeiro ensaio real do fluxo por agente."
);
assert(
  backlog.includes("main@0505893") && backlog.includes("baseline técnico"),
  "O marco promovido deixou de ser distinguido da aceitação prática."
);
assert(
  backlog.includes("Status atual: V1 — em revisão prática")
    && backlog.includes("linha autorizada"),
  "A V1 reaberta não está classificada explicitamente como em revisão prática."
);
assert(
  /aceitação do\s+fluxo principal do produto fica reaberta/.test(backlog),
  "O resultado do ensaio não reabriu a aceitação prática em development."
);
assert(
  backlog.includes("Posição e tamanho") && backlog.includes("aba **Layout**"),
  "A hierarquia esperada do inspetor não está explícita."
);
assert(
  backlog.includes("zoom do navegador em 100%"),
  "O gate de interface não bloqueia dependência de zoom externo."
);
assert(
  ["standard", "hero", "technical", "variants", "data-only"]
    .every(mode => backlog.includes(`\`${mode}\``)),
  "A auditoria da apresentação vertical não parte dos cinco modos existentes."
);
assert(
  backlog.includes("agente em início frio")
    && backlog.includes("sem o usuário precisar nomear a função escondida"),
  "O gate de descoberta do Authoring Kit não foi formalizado."
);
assert(
  /não reabre multipágina, colaboração, plataforma online, touch ou\s+expansão multimídia/.test(backlog),
  "A validação prática ampliou silenciosamente frentes congeladas."
);

console.log("✓ Ensaio real reabre aceitação prática sem apagar o baseline técnico da V1.");
