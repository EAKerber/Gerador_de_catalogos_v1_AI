(function () {
  "use strict";

  const VERSION = "1.0.0";
  const MINIMUM_FONT_PT = 6;
  const TOLERANCE = 1;

  const round = value => Math.round(Number(value || 0) * 100) / 100;
  const visible = (element, style = getComputedStyle(element)) => {
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > TOLERANCE && rect.height > TOLERANCE;
  };
  const directText = element => Array.from(element.childNodes || [])
    .filter(node => node.nodeType === Node.TEXT_NODE)
    .map(node => node.textContent || "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const componentIdFor = element => element.closest("[data-component-id]")?.dataset.componentId || null;
  const pageIdFor = root => root?.closest?.("[data-page-id]")?.dataset.pageId || window.CatalogEditor?.store?.getPage?.()?.id || null;
  const rectValue = rect => ({ left: round(rect.left), top: round(rect.top), right: round(rect.right), bottom: round(rect.bottom), width: round(rect.width), height: round(rect.height) });
  const intersection = (left, right) => {
    const width = Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left));
    const height = Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));
    return { width: round(width), height: round(height), area: round(width * height) };
  };

  function textFragments(element) {
    const fragments = [];
    Array.from(element.childNodes || []).filter(node => node.nodeType === Node.TEXT_NODE && String(node.textContent || "").trim()).forEach(node => {
      const range = document.createRange();
      range.selectNodeContents(node);
      Array.from(range.getClientRects()).forEach(rect => {
        if (rect.width > TOLERANCE && rect.height > TOLERANCE) fragments.push(rectValue(rect));
      });
      range.detach?.();
    });
    return fragments;
  }

  function textRecords(root) {
    return Array.from(root.querySelectorAll("[data-component-id] .editor-component__content *"))
      .map(element => {
        const text = directText(element);
        if (!text) return null;
        const style = getComputedStyle(element);
        if (!visible(element, style)) return null;
        const fragments = textFragments(element);
        if (!fragments.length) return null;
        return {
          element,
          text,
          componentId: componentIdFor(element),
          selectorHint: `${element.tagName.toLowerCase()}${element.classList.length ? `.${Array.from(element.classList).join(".")}` : ""}`,
          fragments,
          box: rectValue(element.getBoundingClientRect()),
          style,
          fontPt: round(Number.parseFloat(style.fontSize) * .75)
        };
      })
      .filter(Boolean);
  }

  function objectRecords(root) {
    return Array.from(root.querySelectorAll("[data-component-id] .editor-component__content img, [data-component-id] .editor-component__content svg, [data-component-id] .component-separator"))
      .filter(element => visible(element))
      .map(element => ({
        element,
        componentId: componentIdFor(element),
        kind: element.matches("img") ? "image" : element.matches("svg") ? "icon" : "separator",
        box: rectValue(element.getBoundingClientRect())
      }));
  }

  function allowedOverlap(left, right) {
    if (left.element.contains(right.element) || right.element.contains(left.element)) return true;
    if (left.element.closest("[data-visual-overlap-allowed='true']") || right.element.closest("[data-visual-overlap-allowed='true']")) return true;
    const art = left.element.closest(".component-art");
    return Boolean(art && art === right.element.closest(".component-art") && left.element.closest(".component-art__caption"));
  }

  function fragmentsOverlap(left, right) {
    let largest = { width: 0, height: 0, area: 0 };
    left.forEach(leftRect => right.forEach(rightRect => {
      const overlap = intersection(leftRect, rightRect);
      if (overlap.area > largest.area) largest = overlap;
    }));
    return largest.width > TOLERANCE && largest.height > TOLERANCE ? largest : null;
  }

  function audit(options = {}) {
    const root = options.root || document.getElementById("componentLayer");
    const target = options.target === "publication" ? "publication" : "draft";
    const surface = String(options.surface || "editor");
    const minimumFontPt = Number(options.minimumFontPt) || MINIMUM_FONT_PT;
    const issues = [];
    const summary = { textNodes: 0, truncations: 0, textCollisions: 0, textObjectCollisions: 0, belowMinimum: 0, blockingIssues: 0, warnings: 0 };
    if (!root) return { available: false, target, surface, auditorVersion: VERSION, minimumFontPt, summary, issues: [{ severity: "warning", code: "VISUAL_TEXT_AUDIT_UNAVAILABLE", message: "A camada renderizada não está disponível; a integridade textual não foi medida." }] };

    const pageId = pageIdFor(root);
    const texts = textRecords(root);
    const objects = objectRecords(root);
    summary.textNodes = texts.length;
    const severity = target === "publication" ? "error" : "warning";
    const add = issue => issues.push({ severity: issue.code === "TEXT_BELOW_MINIMUM" ? "warning" : severity, pageId, ...issue });

    texts.forEach(record => {
      const horizontal = Math.max(0, record.element.scrollWidth - record.element.clientWidth);
      const vertical = Math.max(0, record.element.scrollHeight - record.element.clientHeight);
      const rangeOverflow = record.fragments.reduce((amount, fragment) => Math.max(amount, fragment.right - record.box.right, fragment.bottom - record.box.bottom, record.box.left - fragment.left, record.box.top - fragment.top), 0);
      if (horizontal > TOLERANCE || vertical > TOLERANCE || rangeOverflow > TOLERANCE) {
        const ellipsis = record.style.textOverflow === "ellipsis" && horizontal > TOLERANCE;
        summary.truncations += 1;
        add({
          code: ellipsis ? "TEXT_ELLIPSIS_APPLIED" : "TEXT_CONTENT_CLIPPED",
          message: ellipsis ? `“${record.text}” foi truncado com reticências.` : `“${record.text}” excede sua caixa renderizada.`,
          componentId: record.componentId,
          selectorHint: record.selectorHint,
          text: record.text,
          overflow: { horizontal: round(horizontal), vertical: round(vertical), range: round(Math.max(0, rangeOverflow)) }
        });
      }
      if (record.fontPt + .01 < minimumFontPt) {
        summary.belowMinimum += 1;
        add({ code: "TEXT_BELOW_MINIMUM", message: `“${record.text}” usa ${record.fontPt} pt, abaixo do mínimo recomendado de ${minimumFontPt} pt.`, componentId: record.componentId, selectorHint: record.selectorHint, text: record.text, fontPt: record.fontPt, minimumFontPt });
      }
    });

    for (let leftIndex = 0; leftIndex < texts.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < texts.length; rightIndex += 1) {
        const left = texts[leftIndex];
        const right = texts[rightIndex];
        if (allowedOverlap(left, right)) continue;
        const overlap = fragmentsOverlap(left.fragments, right.fragments);
        if (!overlap) continue;
        summary.textCollisions += 1;
        add({ code: "TEXT_TEXT_COLLISION", message: `Os textos “${left.text}” e “${right.text}” se sobrepõem.`, componentIds: [left.componentId, right.componentId].filter(Boolean), texts: [left.text, right.text], overlap });
      }
    }

    texts.forEach(text => objects.forEach(object => {
      if (allowedOverlap(text, object)) return;
      const overlap = fragmentsOverlap(text.fragments, [object.box]);
      if (!overlap) return;
      summary.textObjectCollisions += 1;
      add({ code: "TEXT_OBJECT_COLLISION", message: `O texto “${text.text}” se sobrepõe a ${object.kind === "image" ? "uma imagem" : object.kind === "icon" ? "um ícone" : "um divisor"}.`, componentIds: [text.componentId, object.componentId].filter(Boolean), text: text.text, objectKind: object.kind, overlap });
    }));

    summary.blockingIssues = issues.filter(issue => issue.severity === "error").length;
    summary.warnings = issues.filter(issue => issue.severity === "warning").length;
    if (!issues.length) issues.push({ severity: "info", code: "VISUAL_TEXT_INTEGRITY_READY", message: "Texto renderizado sem truncamento, colisão ou fonte abaixo do mínimo.", pageId });
    return { available: true, target, surface, auditorVersion: VERSION, minimumFontPt, summary, issues };
  }

  function mergeReport(report, visualIntegrity) {
    if (!report || !visualIntegrity) return report;
    const visualIssues = (visualIntegrity.issues || []).filter(issue => issue.code !== "VISUAL_TEXT_INTEGRITY_READY");
    const structuralIssues = (report.issues || []).filter(issue => issue.code !== "VALIDATION_READY");
    const issues = [...structuralIssues, ...visualIssues];
    if (!issues.length) issues.push({ severity: "info", code: "VALIDATION_READY", message: "Documento estrutural, referencial, editorial, geométrico e tipograficamente válido." });
    return {
      ...report,
      ok: !issues.some(issue => issue.severity === "error"),
      summary: {
        ...(report.summary || {}),
        textTruncations: visualIntegrity.summary.truncations,
        textCollisions: visualIntegrity.summary.textCollisions,
        textObjectCollisions: visualIntegrity.summary.textObjectCollisions,
        textBelowMinimum: visualIntegrity.summary.belowMinimum,
        visualIntegrityAvailable: visualIntegrity.available
      },
      visualIntegrity,
      issues
    };
  }

  window.CatalogVisualTextIntegrity = Object.freeze({ VERSION, MINIMUM_FONT_PT, audit, mergeReport, intersection });
})();
