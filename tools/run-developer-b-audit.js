#!/usr/bin/env node
"use strict";

const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const testsRoot = path.join(root, "tests");
const args = new Set(process.argv.slice(2));
const listOnly = args.has("--list");
const runAll = args.has("--all");
const runBrowser = runAll || args.has("--browser");
const runBuild = runAll || args.has("--build");
const runNode = runAll || args.has("--node") || (!runBrowser && !runBuild && !listOnly);
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";

function discover() {
  const files = fs.readdirSync(testsRoot)
    .filter(file => file.endsWith(".test.js") && file.includes("05.18"))
    .filter(file => !file.includes("stress-"))
    .sort((left, right) => left.localeCompare(right));
  return {
    node: files.filter(file => !file.startsWith("browser-")),
    browser: files.filter(file => file.startsWith("browser-"))
  };
}

function printList(suites) {
  console.log(`Node (${suites.node.length})`);
  suites.node.forEach(file => console.log(`  tests/${file}`));
  console.log(`\nChromium (${suites.browser.length})`);
  suites.browser.forEach(file => console.log(`  tests/${file}`));
  console.log("\nTestes de estresse são executados separadamente por tools/run-developer-b-stress.js.");
}

function runFiles(label, files) {
  const failures = [];
  console.log(`\n=== ${label}: ${files.length} teste(s) ===`);
  files.forEach((file, index) => {
    console.log(`\n[${index + 1}/${files.length}] ${file}`);
    const execution = spawnSync(process.execPath, [path.join(testsRoot, file)], {
      cwd: root,
      env: process.env,
      encoding: "utf8"
    });
    if (execution.stdout) process.stdout.write(execution.stdout);
    if (execution.stderr) process.stderr.write(execution.stderr);
    if (execution.status !== 0) failures.push({ file, status: execution.status, signal: execution.signal || null });
  });
  return failures;
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

function runBuildStep() {
  console.log("\n=== Build Developer B ===\n");
  const execution = spawnSync(process.execPath, [path.join(root, "tools", "build-developer-b-authoring-kit.js")], {
    cwd: root,
    env: process.env,
    encoding: "utf8"
  });
  if (execution.stdout) process.stdout.write(execution.stdout);
  if (execution.stderr) process.stderr.write(execution.stderr);
  return execution.status === 0 ? [] : [{ file: "tools/build-developer-b-authoring-kit.js", status: execution.status, signal: execution.signal || null }];
}

async function main() {
  const suites = discover();
  if (listOnly) {
    printList(suites);
    return;
  }

  const failures = [];
  if (runNode) failures.push(...runFiles("Contratos Node", suites.node));
  if (runBuild) failures.push(...runBuildStep());
  if (runBrowser) {
    const reachable = await probe(baseURL);
    if (!reachable) {
      console.error(`\nServidor não acessível em ${baseURL}. Inicie na raiz do projeto com: python -m http.server 8080`);
      process.exitCode = 2;
      return;
    }
    console.log(`\nServidor confirmado em ${baseURL}.`);
    failures.push(...runFiles("Chromium", suites.browser));
  }

  if (failures.length) {
    console.error(`\n✗ Auditoria concluída com ${failures.length} falha(s):`);
    failures.forEach(failure => console.error(`  - ${failure.file}: status ${failure.status}${failure.signal ? `, sinal ${failure.signal}` : ""}`));
    process.exitCode = 1;
    return;
  }

  console.log("\n✓ Auditoria Developer B concluída sem falhas nas etapas solicitadas.");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
