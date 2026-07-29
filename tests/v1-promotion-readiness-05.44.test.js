"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const readiness = read("docs/V1-PROMOTION-READINESS-05.44.md");
const increment = read("docs/INCREMENT-05.44.md");
const roadmap = read("docs/ROADMAP.md");
const backlog = read("docs/BACKLOG.md");
const policy = read("docs/VISUAL-EVIDENCE-POLICY.md");
const reference = fs.readFileSync(path.join(root, "docs/reference/catalogo-base.jpeg"));
const referenceHash = crypto.createHash("sha256").update(reference).digest("hex");

assert(
  referenceHash === "4262171d057c6daedd47cd192600fa9f826d739552b4a4c84f38c917c010f2f6",
  "A referência técnica versionada divergiu do arquivo canônico da V1."
);
assert(readiness.includes(referenceHash), "O checkpoint não vincula a referência técnica ao hash real.");
assert(readiness.includes("38 commits à frente e zero atrás"), "O delta main→development não foi registrado.");
assert(readiness.includes("somente `main` e `development`"), "O estado pós-poda não foi registrado.");
assert(readiness.includes("autorização explícita do usuário"), "A promoção deixou de exigir autorização explícita.");
assert(readiness.includes("não foi promovida a baseline canônica"), "O benchmark promocional foi tratado como baseline.");
assert(increment.includes("nenhum runtime, schema ou manifesto alterado"), "O limite documental do 05.44 está ausente.");
assert(roadmap.includes("Incremento 05.44 — Checkpoint final de consolidação da V1"), "O Roadmap não registra o 05.44.");
assert(backlog.includes("Poda e encerramento histórico") && backlog.includes("Concluído após o 05.43"), "O Backlog ainda não publica o estado pós-poda.");
assert(!backlog.includes("Encerrar PR #1 e excluir a branch histórica | Aguardando"), "O Backlog mantém a poda concluída como pendência.");
assert(/decisão explícita, não uma\s+lacuna da suíte/.test(policy), "A política não distingue ausência deliberada de baseline.");

console.log("✓ Checkpoint 05.44 fixa referência, estado pós-poda e autorização da promoção.");
