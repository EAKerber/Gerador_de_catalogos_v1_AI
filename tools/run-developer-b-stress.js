#!/usr/bin/env node
"use strict";

const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const has = name => args.includes(name);
const valueFor = (name, fallback) => {
  const prefix = `${name}=`;
  const argument = args.find(item => item.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : fallback;
};

const listOnly = has("--list");
const runAll = has("--all");
const runBrowser = runAll || has("--browser");
const runNode = runAll || has("--node") || (!runBrowser && !listOnly);
const repeat = Math.max(1, Math.min(50, Math.round(Number(valueFor("--repeat", "1")) || 1)));
const baseSeed = Number(valueFor("--seed", process.env.CATALOG_STRESS_SEED || "5182026"));
const timeoutMs = Math.max(10000, Math.min(15 * 60 * 1000, Math.round(Number(valueFor("--timeout", process.env.CATALOG_STRESS_TIMEOUT_MS || "180000")) || 180000)));
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const outputRoot = path.resolve(valueFor("--output", process.env.CATALOG_STRESS_OUTPUT_DIR || "/tmp/catalog-developer-b-stress-batch"));
const tests = {
  node: ["tests/stress-domain-history-05.18.test.js"],
  browser: ["tests/browser-stress-interface-05.18.test.js"]
};

function printPlan() {
  console.log("Batch de estresse Developer B / 05.18");
  console.log(`  repetições: ${repeat}`);
  console.log(`  semente inicial: ${baseSeed}`);
  console.log(`  timeout por teste: ${timeoutMs} ms`);
  console.log(`  saída: ${outputRoot}`);
  console.log(`  URL do editor: ${baseURL}`);
  console.log("\nDomínio:");
  tests.node.forEach(file => console.log(`  - ${file}`));
  console.log("\nChromium:");
  tests.browser.forEach(file => console.log(`  - ${file}`));
}

function probe(url) {
  return new Promise(resolve => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      resolve(false);
      return;
    }
    const client = parsed.protocol === "https:" ? https : http;
    const request = client.get(parsed, response => {
      response.resume();
      resolve(Boolean(response.statusCode && response.statusCode < 500));
    });
    request.setTimeout(2500, () => request.destroy());
    request.on("error", () => resolve(false));
  });
}

function execute(file, seed, runOutput) {
  const startedAt = Date.now();
  const execution = spawnSync(process.execPath, [path.join(root, file)], {
    cwd: root,
    env: {
      ...process.env,
      CATALOG_STRESS_SEED: String(seed),
      CATALOG_STRESS_OUTPUT_DIR: runOutput,
      CATALOG_STRESS_TIMEOUT_MS: String(timeoutMs),
      CATALOG_BASE_URL: baseURL
    },
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    timeout: timeoutMs,
    killSignal: "SIGTERM"
  });
  if (execution.stdout) process.stdout.write(execution.stdout);
  if (execution.stderr) process.stderr.write(execution.stderr);
  return {
    file,
    seed,
    status: execution.status,
    signal: execution.signal || null,
    timedOut: execution.error?.code === "ETIMEDOUT",
    error: execution.error ? { code: execution.error.code || null, message: execution.error.message } : null,
    durationMs: Date.now() - startedAt,
    stdoutTail: String(execution.stdout || "").trim().split("\n").slice(-10),
    stderrTail: String(execution.stderr || "").trim().split("\n").slice(-20)
  };
}

async function main() {
  printPlan();
  if (listOnly) return;
  fs.mkdirSync(outputRoot, { recursive: true });

  if (runBrowser && !(await probe(baseURL))) {
    console.error(`\nServidor não acessível em ${baseURL}. Inicie na raiz com: python -m http.server 8080`);
    process.exitCode = 2;
    return;
  }

  const results = [];
  for (let iteration = 0; iteration < repeat; iteration += 1) {
    const seed = baseSeed + iteration;
    const runOutput = path.join(outputRoot, `run-${String(iteration + 1).padStart(2, "0")}-seed-${seed}`);
    fs.mkdirSync(runOutput, { recursive: true });
    console.log(`\n=== Execução ${iteration + 1}/${repeat} · seed ${seed} ===`);

    if (runNode) {
      for (const file of tests.node) results.push({ phase: "node", iteration: iteration + 1, output: runOutput, ...execute(file, seed, runOutput) });
    }
    if (runBrowser) {
      for (const file of tests.browser) results.push({ phase: "browser", iteration: iteration + 1, output: runOutput, ...execute(file, seed, runOutput) });
    }
  }

  const failures = results.filter(result => result.status !== 0 || result.timedOut || result.error);
  const summary = {
    suite: "Developer B 05.18 stress batch",
    generatedAt: new Date().toISOString(),
    baseURL,
    outputRoot,
    baseSeed,
    repeat,
    timeoutMs,
    phases: { node: runNode, browser: runBrowser },
    totals: {
      executions: results.length,
      passed: results.length - failures.length,
      failed: failures.length,
      timedOut: failures.filter(result => result.timedOut).length,
      durationMs: results.reduce((total, result) => total + result.durationMs, 0)
    },
    results,
    status: failures.length ? "failed" : "passed"
  };
  fs.writeFileSync(path.join(outputRoot, "stress-batch-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);

  if (failures.length) {
    console.error(`\n✗ Batch encerrado com ${failures.length} falha(s). Resumo: ${path.join(outputRoot, "stress-batch-summary.json")}`);
    failures.forEach(failure => console.error(`  - seed ${failure.seed} · ${failure.phase} · ${failure.file} · ${failure.timedOut ? "timeout" : `status ${failure.status}`}${failure.signal ? ` · ${failure.signal}` : ""}`));
    process.exitCode = 1;
    return;
  }

  console.log(`\n✓ Batch concluído sem bloqueadores em ${results.length} execução(ões). Resumo: ${path.join(outputRoot, "stress-batch-summary.json")}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
