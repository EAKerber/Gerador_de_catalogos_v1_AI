/* Encerramento Developer B — validação estática e modo --list do executor de auditoria. */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const runnerPath = path.join(root, "tools", "run-developer-b-audit.js");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(fs.existsSync(runnerPath), "O executor de auditoria não existe.");
const source = fs.readFileSync(runnerPath, "utf8");

for (const flag of ["--list", "--node", "--browser", "--build", "--all"]) {
  assert(source.includes(`\"${flag}\"`), `O executor não reconhece ${flag}.`);
}
assert(source.includes('file.includes("05.18")'), "A descoberta não está limitada à fila 05.18.");
assert(source.includes('file.startsWith("browser-")'), "A separação entre Node e Chromium não está declarada.");
assert(source.includes('build-developer-b-authoring-kit.js'), "O executor não referencia o build específico da branch.");
assert(source.includes('process.env.CATALOG_BASE_URL'), "O endereço do servidor de navegador não é configurável.");
assert(source.includes('python -m http.server 8080'), "A mensagem de recuperação para servidor ausente não está presente.");
assert(!/execSync|shell\s*:\s*true|npm\s+(?:run|test)|npx\s+/.test(source), "O executor introduziu dependência de shell ou npm não existente no projeto.");

const execution = spawnSync(process.execPath, [runnerPath, "--list"], {
  cwd: root,
  encoding: "utf8"
});
assert(execution.status === 0, `O modo --list falhou: ${execution.stderr || execution.stdout}`);
assert(execution.stdout.includes("Node (") && execution.stdout.includes("Chromium ("), "O modo --list não separou as suítes.");
for (const expected of [
  "tests/developer-b-audit-runner-05.18.test.js",
  "tests/fact-recipe-05.18.17.test.js",
  "tests/callout-recipe-audit-05.18.19.test.js",
  "tests/browser-fact-recipe-05.18.17.test.js",
  "tests/browser-callout-audit-05.18.19.test.js"
]) {
  assert(execution.stdout.includes(expected), `O inventário não inclui ${expected}.`);
}

const listed = execution.stdout.split("\n").filter(line => line.trim().startsWith("tests/")).map(line => line.trim());
assert(listed.length === new Set(listed).size, "O inventário contém testes duplicados.");
assert(listed.every(file => file.includes("05.18") && file.endsWith(".test.js")), "O inventário incluiu arquivo fora do escopo 05.18.");

console.log(`✓ Executor Developer B descobriu ${listed.length} testes 05.18, separou Node/Chromium e permaneceu independente de npm.`);
