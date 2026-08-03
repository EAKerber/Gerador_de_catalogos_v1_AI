"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const readJSON = relative => JSON.parse(read(relative));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const checkpoint = readJSON("docs/project/CHECKPOINT.json");
assert(checkpoint.phase === "v1-forensic-autopsy", "O checkpoint não identifica a fase forense.");
assert(checkpoint.productState?.v1 === "frozen-technical-prototype", "A V1 não está congelada como protótipo técnico.");
assert(checkpoint.productState?.publicationReady === false, "O checkpoint promove a V1 indevidamente.");
assert(checkpoint.productState?.v2ImplementationAuthorized === false, "O checkpoint autorizou implementação V2 prematura.");
assert(checkpoint.productState?.lastFunctionalIncrement === "05.60", "O checkpoint confundiu governança documental com incremento funcional.");
assert(checkpoint.repositoryState?.permanentDocumentationBranch === null, "Uma segunda fonte documental permanente foi criada.");
assert(checkpoint.repositoryState?.archiveCreated === false, "O checkpoint declara snapshot ainda não comprovado.");
assert(checkpoint.nextAction?.productCodeChangesAllowed === false, "O próximo passo permite mudança de produto.");

for (const required of [
  "AGENTS.md",
  "docs/START-HERE.md",
  "docs/project/STATUS.md",
  "docs/ADR-029-encerramento-v1-e-governanca-forense.md",
  "docs/autopsy/README.md"
]) {
  assert(checkpoint.requiredReading.includes(required), `Leitura obrigatória ausente: ${required}.`);
  assert(fs.existsSync(path.join(root, required)), `Leitura obrigatória aponta para arquivo ausente: ${required}.`);
}

const status = read("docs/project/STATUS.md");
const checkpointNumber = checkpoint.checkpointId.match(/^\d+\.\d+/)?.[0];
assert(checkpointNumber && status.includes(`Checkpoint de governança:** \`${checkpointNumber}\``), "STATUS e CHECKPOINT divergem sobre a transição.");
assert(status.includes("Nenhum código do produto deve mudar nessa etapa"), "STATUS não bloqueia mutação no próximo passo.");

const startHere = read("docs/START-HERE.md");
for (const required of checkpoint.requiredReading.filter(relative => relative !== "docs/START-HERE.md")) {
  assert(startHere.includes(required), `START-HERE não torna descobrível a leitura obrigatória: ${required}.`);
}

for (const entrypoint of [
  "README.md",
  "CONTRIBUTING.md",
  "docs/BACKLOG.md",
  "docs/ROADMAP.md",
  "docs/PRODUCT-DEFINITION.md",
  "docs/FEATURE-CATALOG.md",
  "docs/LLM-CATALOG-AUTHORING-FLOW.md",
  "docs/GITHUB-OPERATIONS.md",
  "docs/DEVELOPMENT-HANDOFF-05.58.md"
]) {
  assert(read(entrypoint).includes("docs/START-HERE.md"), `${entrypoint} não encaminha ao estado vigente.`);
}

const agents = read("AGENTS.md");
assert(agents.includes("transição forense da V1"), "AGENTS.md não declara a fase antes das regras operacionais.");
assert(agents.includes("não existe branch documental permanente"), "AGENTS.md reabriu uma segunda fonte de verdade.");
assert(agents.includes("Poda é uma operação posterior ao snapshot"), "AGENTS.md permite higiene destrutiva prematura.");

const handoff = read("docs/DEVELOPMENT-HANDOFF-05.58.md");
assert(handoff.includes("SUPERADO COMO PONTO DE RETOMADA"), "O handoff antigo ainda pode ser lido como fila ativa.");

console.log("✓ Entrypoints convergem no checkpoint forense e bloqueiam desenvolvimento prematuro.");
