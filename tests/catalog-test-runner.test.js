"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const runnerPath = path.join(root, "tools", "run-catalog-tests.js");
const { classifyFailure, planShards } = require(runnerPath);
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(fs.existsSync(runnerPath), "O executor integral não existe.");
const source = fs.readFileSync(runnerPath, "utf8");
for (const flag of ["--list", "--list-shards", "--node", "--browser", "--build", "--all"]) {
  assert(source.includes(`"${flag}"`), `O executor não reconhece ${flag}.`);
}
assert(source.includes('file.endsWith(".test.js")'), "A descoberta não cobre todos os testes.");
assert(!source.includes('file.includes("05.18")'), "A descoberta ainda está presa ao incremento 05.18.");
assert(source.includes('file.startsWith("browser-")'), "A separação entre Node e Chromium não está declarada.");
assert(source.includes("build-authoring-kit.js"), "O executor não usa o build canônico.");
assert(source.includes("CATALOG_TEST_TIMEOUT_MS") && source.includes("ETIMEDOUT"), "O executor não encerra ou classifica testes travados.");
assert(source.includes("CATALOG_PROMOTIONAL_REMEDIATION_ENFORCE"), "O gate promocional não é bloqueante por padrão.");
assert(source.includes("CATALOG_TEST_SHARD_COUNT") && source.includes("CATALOG_TEST_SHARD_INDEX"), "O executor não permite particionar a suíte Chromium.");
assert(source.includes("CATALOG_INFRA_RETRY_LIMIT"), "O executor não limita explicitamente a repetição infraestrutural.");
assert(source.includes("infrastructure-timeout") && source.includes('"functional"'), "O executor não distingue falha funcional de infraestrutura.");
assert(source.includes("Chromium executável:") && source.includes("Chromium versão:"), "O executor não diagnostica caminho e versão do Chromium.");
assert(source.includes("browserTestWeights"), "O executor não declara custos estáveis para os testes Chromium longos.");
assert(!/execSync|shell\s*:\s*true|npx\s+/.test(source), "O executor introduziu shell ou resolução de dependência não determinística.");

const execution = spawnSync(process.execPath, [runnerPath, "--list"], { cwd: root, encoding: "utf8" });
assert(execution.status === 0, `O modo --list falhou: ${execution.stderr || execution.stdout}`);
assert(execution.stdout.includes("Node (") && execution.stdout.includes("Chromium ("), "O modo --list não separou as suítes.");
for (const expected of [
  "tests/catalog-test-runner.test.js",
  "tests/startup-contracts.test.js",
  "tests/fact-recipe-05.18.17.test.js",
  "tests/commerce-offer-unit-recipe-05.20.13.test.js",
  "tests/browser-reference-manual-audit-05.17.test.js",
  "tests/browser-promotional-remediation-acceptance-05.20.10.test.js",
  "tests/browser-callout-layout-diagnostic-05.20.15.test.js",
  "tests/stress-domain-history-05.18.test.js",
  "tests/browser-stress-interface-05.18.test.js"
]) {
  assert(execution.stdout.includes(expected), `O inventário integral não inclui ${expected}.`);
}

const listed = execution.stdout.split("\n").filter(line => line.trim().startsWith("tests/")).map(line => line.trim());
const expectedCount = fs.readdirSync(path.join(root, "tests")).filter(file => file.endsWith(".test.js")).length;
assert(listed.length === expectedCount, `O inventário listou ${listed.length} de ${expectedCount} testes.`);
assert(listed.length === new Set(listed).size, "O inventário contém testes duplicados.");

const browserFiles = listed.filter(file => path.basename(file).startsWith("browser-"));
assert(classifyFailure({ error: { code: "ETIMEDOUT" } }) === "infrastructure-timeout", "Timeout não foi classificado como infraestrutura.");
assert(classifyFailure({ signal: "SIGSEGV" }) === "infrastructure-signal", "Sinal nativo não foi classificado como infraestrutura.");
assert(classifyFailure({ stdout: "", stderr: "fatal library error", status: 1 }) === "infrastructure-browser", "Queda explícita do browser não foi classificada como infraestrutura.");
assert(classifyFailure({ stdout: "", stderr: "AssertionError", status: 1 }) === "functional", "Asserção funcional foi classificada como infraestrutura.");
const directShardPlan = planShards(browserFiles.map(file => path.basename(file)), 4);
assert(directShardPlan.length === 4, "O planejamento direto não produziu quatro shards.");
const shardExecution = spawnSync(process.execPath, [runnerPath, "--list-shards"], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, CATALOG_TEST_SHARD_COUNT: "4", CATALOG_TEST_SHARD_INDEX: "0" }
});
assert(shardExecution.status === 0, `O plano de shards falhou: ${shardExecution.stderr || shardExecution.stdout}`);
const shardPlan = JSON.parse(shardExecution.stdout);
const assignedFiles = shardPlan.flatMap(shard => shard.files);
assert(assignedFiles.length === browserFiles.length, "O particionamento perdeu testes Chromium.");
assert(new Set(assignedFiles).size === browserFiles.length, "O particionamento duplicou testes Chromium.");
assert(Math.max(...shardPlan.map(shard => shard.weight)) - Math.min(...shardPlan.map(shard => shard.weight)) <= 1, "Os custos estáveis dos shards Chromium estão desequilibrados.");

console.log(`✓ Executor canônico descobriu todos os ${listed.length} testes, incluindo 05.20 e estresse.`);
