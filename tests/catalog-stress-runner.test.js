/* Auditoria 05.18 — validação estática do batch de estresse e modo --list. */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const runnerPath = path.join(root, "tools", "run-catalog-stress.js");
const auditRunnerPath = path.join(root, "tools", "run-catalog-tests.js");
const stressFiles = [
  path.join(root, "tests", "stress-domain-history-05.18.test.js"),
  path.join(root, "tests", "browser-stress-interface-05.18.test.js")
];
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(fs.existsSync(runnerPath), "O executor do batch de estresse não existe.");
stressFiles.forEach(file => assert(fs.existsSync(file), `Arquivo de estresse ausente: ${path.relative(root, file)}.`));

for (const file of [runnerPath, ...stressFiles]) {
  const checked = spawnSync(process.execPath, ["--check", file], { cwd: root, encoding: "utf8" });
  assert(checked.status === 0, `Erro de sintaxe em ${path.relative(root, file)}: ${checked.stderr || checked.stdout}`);
}

const source = fs.readFileSync(runnerPath, "utf8");
for (const flag of ["--list", "--node", "--browser", "--all", "--repeat", "--seed", "--output", "--timeout"]) {
  assert(source.includes(flag), `O executor de estresse não declara ${flag}.`);
}
assert(source.includes("CATALOG_STRESS_SEED"), "A semente não é propagada aos testes.");
assert(source.includes("CATALOG_STRESS_OUTPUT_DIR"), "O diretório de evidências não é propagado.");
assert(source.includes("CATALOG_STRESS_TIMEOUT_MS"), "O timeout não é propagado nem configurável.");
assert(source.includes("ETIMEDOUT") && source.includes("killSignal"), "O executor não classifica ou encerra testes travados.");
assert(source.includes("stress-batch-summary.json"), "O batch não produz resumo consolidado.");
assert(source.includes("python -m http.server 8080"), "A recuperação para servidor ausente não foi documentada no executor.");
assert(!/execSync|shell\s*:\s*true|npm\s+(?:run|test)|npx\s+/.test(source), "O executor introduziu dependência de shell ou npm.");

const temporaryOutput = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-stress-runner-test-"));
const listed = spawnSync(process.execPath, [runnerPath, "--list", "--repeat=3", "--seed=42", "--timeout=45000", `--output=${temporaryOutput}`], {
  cwd: root,
  encoding: "utf8"
});
assert(listed.status === 0, `O modo --list do estresse falhou: ${listed.stderr || listed.stdout}`);
assert(listed.stdout.includes("repetições: 3") && listed.stdout.includes("semente inicial: 42"), "O plano não refletiu repetição e semente.");
assert(listed.stdout.includes("timeout por teste: 45000 ms"), "O plano não refletiu o timeout configurado.");
assert(listed.stdout.includes("tests/stress-domain-history-05.18.test.js"), "O teste de domínio não aparece no plano.");
assert(listed.stdout.includes("tests/browser-stress-interface-05.18.test.js"), "O teste de Chromium não aparece no plano.");
assert(!fs.existsSync(path.join(temporaryOutput, "stress-batch-summary.json")), "O modo --list executou a suíte ou escreveu resumo indevidamente.");

const auditList = spawnSync(process.execPath, [auditRunnerPath, "--list"], { cwd: root, encoding: "utf8" });
assert(auditList.status === 0, `A listagem da regressão falhou: ${auditList.stderr || auditList.stdout}`);
assert(auditList.stdout.includes("tests/catalog-stress-runner.test.js"), "A validação leve do batch não entrou na regressão integral.");
assert(auditList.stdout.includes("tests/stress-domain-history-05.18.test.js") && auditList.stdout.includes("tests/browser-stress-interface-05.18.test.js"), "A regressão integral omitiu uma carga pesada.");

fs.rmSync(temporaryOutput, { recursive: true, force: true });
console.log("✓ Batch de estresse possui sintaxe válida, timeout, execução reproduzível e resumo próprio; a suíte integral inclui suas cargas.");
