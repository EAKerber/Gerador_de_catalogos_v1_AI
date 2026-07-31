#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");

const root = path.resolve(__dirname, "..");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const visualRoot = path.join(root, "authoring-kit-visual");
const document = JSON.parse(fs.readFileSync(path.join(visualRoot, "examples/first-page.document.json"), "utf8"));

const visit = (children, callback) => (children || []).forEach(component => {
  callback(component);
  visit(component.children, callback);
});

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.CatalogEditor?.store && window.CatalogEditorStartup?.state === "ready");
    await page.evaluate(source => {
      CatalogEditor.store.replaceDocument(source, { preserveEditor: false, changeType: "visual-guide-capture" });
      CatalogEditor.store.setEditorSettings({ zoomMode: "fit", gridVisible: false, showGuides: false });
    }, document);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(visualRoot, "interface/editor-current.png"), fullPage: false });
    await page.locator("#pageCanvas").screenshot({ path: path.join(visualRoot, "tutorials/01-first-page/current-canvas.png") });

    let tableId = null;
    let footerItemId = null;
    (document.pages || []).forEach(pageItem => visit(pageItem.children, component => {
      if (!tableId && component.type === "data-table") tableId = component.id;
      if (!footerItemId && component.type === "footer-item") footerItemId = component.id;
    }));
    if (tableId) {
      await page.evaluate(componentId => CatalogEditor.store.selectComponentInContext(componentId), tableId);
      await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(visualRoot, "tutorials/04-table-columns/editor-table-selected.png"), fullPage: false });
    }
    if (footerItemId) {
      await page.evaluate(componentId => CatalogEditor.store.selectComponentInContext(componentId), footerItemId);
      await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(visualRoot, "tutorials/06-footer-span/editor-footer-selected.png"), fullPage: false });
    }
    console.log("✓ Capturas reais do guia visual atualizadas em 1366×768.");
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
