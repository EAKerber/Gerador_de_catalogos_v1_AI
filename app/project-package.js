(function () {
  "use strict";

  const PACKAGE_FORMAT = "CatalogProjectPackage";
  const PACKAGE_VERSION = "1.0.0";
  const AUTHORING_KIT_VERSION = "1.7.1";
  const CAPABILITIES_VERSION = "1.0.0";
  const MAX_PACKAGE_SIZE = 100 * 1024 * 1024;
  const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
  const MAX_ENTRY_SIZE = 25 * 1024 * 1024;
  const MAX_UNCOMPRESSED_SIZE = 150 * 1024 * 1024;
  const MAX_ENTRIES = 1024;
  const ROOT_MANIFEST_PATH = "catalog-project.json";
  const DOCUMENT_PATH = "document/catalog.json";
  const CAPABILITIES_PATH = "manifests/catalog-capabilities.json";
  const EXPORT_REPORT_PATH = "reports/export-report.json";
  const CATALOG_SOURCE_PATH = "source/catalog-source.json";
  const GENERATION_PLAN_PATH = "plan/catalog-generation-plan.json";
  const FIXED_ZIP_TIME = new Date("2000-01-01T00:00:00.000Z");
  const MIME_EXTENSIONS = Object.freeze({
    "image/svg+xml": ".svg",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp"
  });
  const ASSET_ORIGINS = new Set(["provided", "official", "derived", "generated", "placeholder"]);
  const ASSET_FIDELITIES = new Set(["product-faithful", "deterministic", "conceptual", "decorative"]);
  const ASSET_APPROVALS = new Set(["publish-ready", "review-required", "draft-only", "missing", "optional-missing"]);
  const ASSET_POLICY_MODES = new Set(["strict", "assisted", "creative"]);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const clone = value => JSON.parse(JSON.stringify(value));

  class PackageError extends Error {
    constructor(code, message) {
      super(message);
      this.name = "PackageError";
      this.code = code;
    }
  }

  function fflate() {
    const codec = window.fflate || globalThis.fflate;
    if (!codec?.zipSync || !codec?.unzipSync) throw new PackageError("ZIP_CODEC_MISSING", "O codec ZIP não foi carregado.");
    return codec;
  }

  function asBytes(value) {
    if (value instanceof Uint8Array) return value;
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    if (typeof value === "string") return encoder.encode(value);
    throw new TypeError("Conteúdo de arquivo inválido.");
  }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (!value || typeof value !== "object") return value;
    return Object.keys(value).sort().reduce((result, key) => {
      if (value[key] !== undefined) result[key] = stableValue(value[key]);
      return result;
    }, {});
  }

  function stableJSON(value) {
    return `${JSON.stringify(stableValue(value), null, 2)}\n`;
  }

  function hex(buffer) {
    return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, "0")).join("");
  }

  async function sha256(value) {
    const bytes = asBytes(value);
    if (!globalThis.crypto?.subtle && !window.crypto?.subtle) throw new PackageError("CRYPTO_UNAVAILABLE", "SHA-256 não está disponível neste navegador.");
    const digest = await (globalThis.crypto?.subtle || window.crypto.subtle).digest("SHA-256", bytes);
    return hex(digest);
  }

  function safePath(path) {
    if (typeof path !== "string" || !path || path.length > 240) return false;
    if (path.includes("\\") || path.includes("\0") || path.startsWith("/") || /^[A-Za-z]:/.test(path)) return false;
    const parts = path.split("/");
    return parts.every((part, index) => part && part !== "." && part !== ".." && (index < parts.length - 1 || !part.endsWith(".")));
  }

  function inspectZip(bytesValue) {
    const bytes = asBytes(bytesValue);
    if (bytes.byteLength > MAX_PACKAGE_SIZE) throw new PackageError("PACKAGE_TOO_LARGE", "O pacote excede o limite de 100 MB.");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let eocd = -1;
    const minimum = Math.max(0, bytes.byteLength - 65557);
    for (let offset = bytes.byteLength - 22; offset >= minimum; offset -= 1) {
      if (view.getUint32(offset, true) === 0x06054b50) {
        eocd = offset;
        break;
      }
    }
    if (eocd < 0) throw new PackageError("ZIP_STRUCTURE", "O diretório central do ZIP não foi encontrado.");
    const disk = view.getUint16(eocd + 4, true);
    const centralDisk = view.getUint16(eocd + 6, true);
    const entriesOnDisk = view.getUint16(eocd + 8, true);
    const totalEntries = view.getUint16(eocd + 10, true);
    const centralSize = view.getUint32(eocd + 12, true);
    const centralOffset = view.getUint32(eocd + 16, true);
    if (disk || centralDisk || entriesOnDisk !== totalEntries) throw new PackageError("MULTI_DISK_ZIP", "Pacotes ZIP divididos em volumes não são aceitos.");
    if (totalEntries === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) throw new PackageError("ZIP64_UNSUPPORTED", "ZIP64 não é aceito neste incremento.");
    if (totalEntries > MAX_ENTRIES) throw new PackageError("TOO_MANY_ENTRIES", `O pacote excede o limite de ${MAX_ENTRIES} arquivos.`);
    if (centralOffset + centralSize > bytes.byteLength) throw new PackageError("ZIP_STRUCTURE", "O diretório central aponta para fora do arquivo.");

    const entries = [];
    const paths = new Set();
    let totalUncompressed = 0;
    let offset = centralOffset;
    for (let index = 0; index < totalEntries; index += 1) {
      if (offset + 46 > bytes.byteLength || view.getUint32(offset, true) !== 0x02014b50) throw new PackageError("ZIP_STRUCTURE", "Uma entrada do diretório central é inválida.");
      const flags = view.getUint16(offset + 8, true);
      const compression = view.getUint16(offset + 10, true);
      const compressedSize = view.getUint32(offset + 20, true);
      const uncompressedSize = view.getUint32(offset + 24, true);
      const nameLength = view.getUint16(offset + 28, true);
      const extraLength = view.getUint16(offset + 30, true);
      const commentLength = view.getUint16(offset + 32, true);
      const end = offset + 46 + nameLength + extraLength + commentLength;
      if (end > bytes.byteLength) throw new PackageError("ZIP_STRUCTURE", "O nome de uma entrada excede os limites do arquivo.");
      if (flags & 0x0001) throw new PackageError("ENCRYPTED_ENTRY", "Arquivos ZIP criptografados não são aceitos.");
      if (![0, 8].includes(compression)) throw new PackageError("UNSUPPORTED_COMPRESSION", "O pacote usa um método de compressão não suportado.");
      if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) throw new PackageError("ZIP64_UNSUPPORTED", "Entradas ZIP64 não são aceitas.");
      const path = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
      const directory = path.endsWith("/");
      const comparablePath = directory ? path.slice(0, -1) : path;
      if (!safePath(comparablePath)) throw new PackageError("UNSAFE_PATH", `O caminho “${path}” não é seguro.`);
      if (paths.has(path)) throw new PackageError("DUPLICATE_PATH", `O caminho “${path}” está duplicado no ZIP.`);
      paths.add(path);
      if (!directory) {
        if (uncompressedSize > MAX_ENTRY_SIZE) throw new PackageError("ENTRY_TOO_LARGE", `O arquivo “${path}” excede 25 MB.`);
        totalUncompressed += uncompressedSize;
        if (totalUncompressed > MAX_UNCOMPRESSED_SIZE) throw new PackageError("ZIP_BOMB_LIMIT", "O conteúdo descompactado excede 150 MB.");
        entries.push({ path, compression, compressedSize, uncompressedSize });
      }
      offset = end;
    }
    return { entries, compressedBytes: bytes.byteLength, uncompressedBytes: totalUncompressed };
  }

  function sniffMime(bytesValue) {
    const bytes = asBytes(bytesValue);
    if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
    if (bytes.length >= 12 && decoder.decode(bytes.subarray(0, 4)) === "RIFF" && decoder.decode(bytes.subarray(8, 12)) === "WEBP") return "image/webp";
    const head = decoder.decode(bytes.subarray(0, Math.min(bytes.length, 2048))).replace(/^\uFEFF/, "").trimStart();
    if (/^(?:<\?xml[^>]*>\s*)?(?:<!--[^]*?-->\s*)*<svg(?:\s|>)/i.test(head)) return "image/svg+xml";
    return "application/octet-stream";
  }

  function normalizedGovernance(asset) {
    const metadata = asset?.metadata || {};
    const provenance = metadata.provenance || {};
    const approval = metadata.approval || {};
    return {
      provenance: {
        origin: provenance.origin || (asset?.reference?.provider === "bundled" ? "official" : "provided"),
        role: provenance.role || "generic",
        relatedProductIds: Array.isArray(provenance.relatedProductIds) ? provenance.relatedProductIds.map(String) : [],
        sourceAssetIds: Array.isArray(provenance.sourceAssetIds) ? provenance.sourceAssetIds.map(String) : [],
        method: provenance.method || "direct-import",
        fidelity: provenance.fidelity || (asset?.reference?.provider === "bundled" ? "deterministic" : "product-faithful"),
        generator: provenance.generator == null ? null : String(provenance.generator)
      },
      approval: {
        status: approval.status || "review-required",
        publishAllowed: approval.publishAllowed === true,
        reviewedAt: approval.reviewedAt || null
      }
    };
  }

  function serializeComponentDefinition([type, definition]) {
    const container = definition.container || null;
    return {
      type,
      label: definition.label,
      description: definition.description || "",
      category: definition.category || "Outros",
      icon: definition.icon || null,
      gridUnit: Number(definition.gridUnit) || 1,
      minimum: clone(definition.minSize || {}),
      recommendedMinimum: clone(definition.recommendedSize || definition.defaultFrame || {}),
      defaultFrame: clone(definition.defaultFrame || {}),
      contentFields: clone(definition.contentFields || []),
      styleFields: clone(definition.styleFields || []),
      capabilities: {
        container: Boolean(container),
        autoLayout: Boolean(container?.autoLayout),
        repeatableChildren: Boolean(container?.repeatable),
        hasRecommendedMinimum: Boolean(definition.minSize),
        supportsSnapshot: true,
        supportsDuplicate: true
      },
      container: container ? {
        label: container.label || definition.label,
        accepts: clone(container.accepts || []),
        slots: (container.slots || []).map(slot => ({
          name: slot.name,
          label: slot.label || slot.name,
          accepts: clone(slot.accepts || []),
          capacity: Number(slot.capacity) || 1,
          optional: slot.optional === true
        }))
      } : null
    };
  }

  function buildCapabilitiesManifest(document = null) {
    const templates = (document?.collections || []).find(collection => collection.id === "templates")?.items || [];
    let manifest = {
      manifestType: "CatalogCapabilities",
      manifestVersion: CAPABILITIES_VERSION,
      editor: { name: "Catálogo V1", increment: "05.59", schemaVersion: window.CATALOG_SCHEMA_VERSION || "1.16.0" },
      document: { pagePreset: "A4", logicalSize: { width: 794, height: 1123, unit: "px" }, editorSessionRequired: false },
      components: Object.entries(window.CATALOG_COMPONENT_REGISTRY || {}).sort(([a], [b]) => a.localeCompare(b)).map(serializeComponentDefinition),
      templates: templates.map(template => ({
        id: template.id,
        label: template.label,
        kind: template.metadata?.kind || "snapshot",
        rootType: template.metadata?.rootType || template.metadata?.component?.type || null,
        family: template.metadata?.family || null,
        version: template.metadata?.version || "1.0.0",
        presentation: clone(template.metadata?.presentation || null),
        assetRequirements: clone(template.metadata?.assetRequirements || [])
      })),
      recipes: (window.CatalogSectionRecipes?.list?.() || []).map(recipe => ({
        id: recipe.id,
        version: recipe.version,
        label: recipe.label,
        description: recipe.description,
        rootType: recipe.component?.type || null,
        contexts: clone(recipe.contexts || []),
        focusRole: recipe.focusRole || null
      })),
      tableSchemas: window.CatalogTableSchemas?.list?.() || [],
      separatorPresets: Object.values(window.CATALOG_SEPARATOR_PRESETS || {}).map(preset => clone(preset)),
      presentations: {
        manifestVersion: window.CatalogPresentations?.VERSION || "1.0.0",
        modes: clone(window.CatalogPresentations?.MODES || {}),
        densities: clone(window.CatalogPresentations?.DENSITIES || {}),
        arrangements: clone(window.CatalogPresentations?.ARRANGEMENTS || {}),
        presets: clone(window.CatalogPresentations?.PRESETS || {})
      },
      tokens: clone(window.CATALOG_EDITOR_TOKENS || {}),
      icons: Object.entries(window.CATALOG_ICON_LIBRARY || {}).sort(([a], [b]) => a.localeCompare(b)).map(([id, icon]) => ({ id, label: icon.label, category: icon.category, svgBody: icon.body })),
      capabilities: {
        jsonImport: true,
        jsonExport: true,
        projectPackageImport: true,
        projectPackageExport: true,
        packageAssetPolicy: "assisted",
        assetFormats: Object.keys(MIME_EXTENSIONS),
        assetMaxBytes: MAX_ENTRY_SIZE,
        artInstanceFraming: true,
        undoRedo: true,
        printPdf: true,
        multiplePages: false,
        semanticCatalogSource: true,
        semanticTables: true,
        tableColumnPresentationControls: true,
        slotSpanControl: true,
        semanticColorLegends: true,
        semanticProductVariants: true,
        linkedVariantRepresentations: true,
        hierarchicalVisualLegends: true,
        optionalLegendMaterialization: true,
        draftPublicationGates: true,
        generationPlanCompiler: true,
        geometricPublicationGate: true,
        renderedTextIntegrityGate: true,
        catalogSourceDirectImport: true,
        manualBulkProductEntry: true,
        manualBulkTableEntry: true,
        reusableTableSchemas: true,
        batchTableSchemas: true,
        manualProductCardBatch: true,
        heroGridStripComposition: true,
        multiSelection: true,
        batchAlignment: true,
        batchGeometry: true,
        batchFrameMap: true,
        selectionGeometryDiagnostics: true,
        batchPresentation: true,
        oneClickInsertion: true,
        officialSectionRecipes: true,
        contextualInsertActions: true,
        contextualTableRows: true,
        contextualArtGallery: true,
        bulkCollectionEditing: true,
        batchSpacing: true,
        batchSeparators: true,
        progressiveInspectorVocabulary: ["content", "layout", "visual", "advanced"],
        editorialTextControls: true,
        internalIconScale: true,
        specificationDensityControls: true,
        distinctProductModes: true,
        independentProductArrangement: true
      }
    };
    manifest = window.CatalogComponentIntentManifestContract?.enhance?.(manifest) || manifest;
    manifest = window.CatalogComponentPlacementManifestContract?.enhance?.(manifest) || manifest;
    return manifest;
  }

  function slug(value, fallback = "catalogo") {
    const normalized = String(value || fallback).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return normalized || fallback;
  }

  function roleForPath(path) {
    if (path === DOCUMENT_PATH) return "document";
    if (path === CAPABILITIES_PATH) return "capabilities";
    if (path === EXPORT_REPORT_PATH) return "report";
    if (path === CATALOG_SOURCE_PATH) return "support";
    if (path.startsWith("assets/")) return "asset";
    if (path.startsWith("authoring-kit/")) return "authoring-kit";
    return "support";
  }

  function countDocumentComponents(document) {
    const count = children => (children || []).reduce((total, component) => total + 1 + count(component.children), 0);
    return (document.pages || []).reduce((total, page) => total + count(page.children), 0);
  }

  function validateExportGate(document, target = "draft") {
    const publication = target === "publication";
    const issues = [];
    const severity = publication ? "error" : "warning";
    const collections = Object.fromEntries((document.collections || []).map(collection => [collection.id, collection.items || []]));
    const assets = new Map((collections.assets || []).map(asset => [asset.id, asset]));
    const products = new Map((collections.products || []).map(product => [product.id, product]));
    const referenced = new Set();
    const visit = component => {
      if (component.type === "art" && component.props?.assetId) referenced.add(component.props.assetId);
      if (component.type === "product-card") {
        const product = products.get(component.binding?.productId);
        const roles = product?.metadata?.assetRoles || {};
        const presentation = window.CatalogPresentations?.normalizePresentation?.(component.presentation, component.type) || { presetId: "product-standard" };
        const preset = window.CatalogPresentations?.PRESETS?.[presentation.presetId];
        const idsForRole = role => {
          const localArt = [];
          const collectArt = node => {
            if (node.type === "art" && node.props?.assetId) localArt.push({ id: node.props.assetId, role: node.props.role || "generic" });
            (node.children || []).forEach(collectArt);
          };
          collectArt(component);
          if (role === "product-main") return [roles.main || product?.metadata?.values?.assetId || localArt.find(item => item.role === "product")?.id].filter(Boolean);
          if (role === "product-gallery") return Array.isArray(roles.gallery) ? roles.gallery : [];
          if (role === "technical") return (Array.isArray(roles.technical) && roles.technical.length ? roles.technical : localArt.filter(item => item.role === "technical").map(item => item.id));
          if (role === "application") return Array.isArray(roles.application) ? roles.application : [];
          return [];
        };
        Object.values(roles).flatMap(value => Array.isArray(value) ? value : [value]).filter(Boolean).forEach(assetId => referenced.add(assetId));
        (preset?.assetRequirements || []).forEach(requirement => {
          const roleAssets = idsForRole(requirement.role);
          roleAssets.forEach(assetId => referenced.add(assetId));
          const minimum = Number(requirement.minimum) || 1;
          if (requirement.required && roleAssets.length < minimum) issues.push({
            severity,
            code: "REQUIRED_ASSET_ROLE_MISSING",
            message: `A apresentação “${preset.label}” exige ${minimum} asset(s) no papel “${requirement.role}”; fallback declarado: ${requirement.fallback}.`,
            componentId: component.id,
            role: requirement.role
          });
        });
      }
      (component.children || []).forEach(visit);
    };
    (document.pages || []).forEach(page => (page.children || []).forEach(visit));

    const governedAssetIds = new Set([...assets.keys(), ...referenced]);
    governedAssetIds.forEach(assetId => {
      const asset = assets.get(assetId);
      if (!asset) {
        issues.push({ severity, code: "REFERENCED_ASSET_MISSING", message: `O asset referenciado “${assetId}” não está na coleção.`, assetId });
        return;
      }
      const approval = normalizedGovernance(asset).approval;
      if (approval.status !== "publish-ready" || approval.publishAllowed !== true) {
        issues.push({
          severity,
          code: "ASSET_NOT_PUBLISH_READY",
          message: `O asset “${asset.label || asset.id}” está em “${approval.status}” e não está liberado para publicação.`,
          assetId
        });
      }
    });

    const geometry = window.CatalogDocumentValidator?.validate?.(document, { target: publication ? "publication" : "draft" });
    if (geometry) issues.push(...geometry.issues.filter(item => item.code !== "VALIDATION_READY"));
    const visualIntegrity = window.CatalogVisualTextIntegrity?.audit?.({ root: globalThis.document?.getElementById?.("componentLayer"), target: publication ? "publication" : "draft", surface: "package-export" }) || null;
    if (visualIntegrity) issues.push(...visualIntegrity.issues.filter(item => !["VISUAL_TEXT_INTEGRITY_READY", "VISUAL_TEXT_AUDIT_UNAVAILABLE"].includes(item.code)));
    if (!issues.length) issues.push({ severity: "info", code: publication ? "PUBLICATION_READY" : "DRAFT_READY", message: publication ? "Requisitos de publicação, geometria e integridade textual atendidos." : "Rascunho pronto para transporte; integridade textual registrada." });
    return { target: publication ? "publication" : "draft", ok: !issues.some(issue => issue.severity === "error"), visualIntegrity, issues };
  }

  function mimeForPath(path) {
    if (path.endsWith(".json")) return "application/json";
    if (path.endsWith(".md")) return "text/markdown";
    if (path.endsWith(".svg")) return "image/svg+xml";
    if (path.endsWith(".png")) return "image/png";
    if (/\.jpe?g$/i.test(path)) return "image/jpeg";
    return "application/octet-stream";
  }

  async function fileRecord(path, value) {
    const bytes = asBytes(value);
    return { path, role: roleForPath(path), mimeType: mimeForPath(path), size: bytes.byteLength, sha256: await sha256(bytes) };
  }

  function download(bytesValue, fileName, type = "application/zip") {
    const blob = new Blob([asBytes(bytesValue)], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  class ProjectPackageManager {
    constructor(store, storage) {
      this.store = store;
      this.storage = storage;
    }

    isPackageFile(file) {
      return Boolean(file && (String(file.name || "").toLowerCase().endsWith(".zip") || ["application/zip", "application/x-zip-compressed"].includes(file.type)));
    }

    async readAsset(asset) {
      const reference = asset.reference || {};
      let blob = null;
      if (reference.provider === "indexeddb") blob = await this.storage.get(reference.key);
      else if (["bundled", "remote"].includes(reference.provider) && reference.key) {
        try {
          const response = await fetch(reference.key);
          if (response.ok) blob = await response.blob();
        } catch (_) {
          blob = null;
        }
      }
      if (!blob) throw new PackageError("ASSET_BYTES_MISSING", `O asset “${asset.label || asset.id}” não possui bytes disponíveis para exportação portátil.`);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (!bytes.byteLength || bytes.byteLength > MAX_ENTRY_SIZE) throw new PackageError("ASSET_SIZE", `O asset “${asset.label || asset.id}” precisa ter entre 1 byte e 25 MB.`);
      const declaredMime = asset.metadata?.mimeType;
      const detectedMime = sniffMime(bytes);
      if (!MIME_EXTENSIONS[declaredMime] || detectedMime !== declaredMime) throw new PackageError("ASSET_MIME", `O conteúdo de “${asset.label || asset.id}” não corresponde ao MIME ${declaredMime || "não informado"}.`);
      return { bytes, mimeType: declaredMime };
    }

    async buildPackage(options = {}) {
      const target = options.target === "publication" ? "publication" : "draft";
      const document = this.store.getExportDocument();
      const gate = validateExportGate(document, target);
      if (!gate.ok) {
        const first = gate.issues.find(issue => issue.severity === "error");
        throw new PackageError("PUBLICATION_GATE", `Publicação bloqueada: ${first?.message || "há requisitos pendentes"}`);
      }
      const assetCollection = document.collections.find(collection => collection.id === "assets");
      const sourceAssets = this.store.getCollection("assets")?.items || [];
      const files = {};
      const manifestAssets = [];
      const warnings = [];
      const ids = new Set();

      for (let index = 0; index < sourceAssets.length; index += 1) {
        const asset = sourceAssets[index];
        if (ids.has(asset.id)) throw new PackageError("DUPLICATE_ASSET_ID", `O ID de asset “${asset.id}” está duplicado.`);
        ids.add(asset.id);
        const loaded = await this.readAsset(asset);
        const hash = await sha256(loaded.bytes);
        const path = `assets/${String(index + 1).padStart(4, "0")}-${slug(asset.id, "asset")}${MIME_EXTENSIONS[loaded.mimeType]}`;
        files[path] = loaded.bytes;
        const governance = normalizedGovernance(asset);
        manifestAssets.push({
          id: asset.id,
          label: asset.label,
          path,
          mimeType: loaded.mimeType,
          size: loaded.bytes.byteLength,
          sha256: hash,
          provenance: governance.provenance,
          approval: governance.approval
        });
        const portable = assetCollection?.items.find(item => item.id === asset.id);
        if (portable) {
          portable.reference = { provider: "package", key: path };
          portable.metadata = { ...portable.metadata, size: loaded.bytes.byteLength, mimeType: loaded.mimeType, sha256: hash, ...governance };
          if (Number(asset.metadata?.size) !== loaded.bytes.byteLength) warnings.push({ severity: "warning", code: "ASSET_SIZE_REPAIRED", message: `O tamanho registrado de “${asset.label}” foi atualizado no pacote.` });
        }
      }

      const capabilities = buildCapabilitiesManifest(document);
      files[DOCUMENT_PATH] = encoder.encode(stableJSON(document));
      files[CAPABILITIES_PATH] = encoder.encode(stableJSON(capabilities));
      files[CATALOG_SOURCE_PATH] = encoder.encode(stableJSON(window.CatalogSource?.buildCatalogSource?.(document) || { sourceFormat: "CatalogSource", sourceVersion: "1.1.0", catalog: { id: document.id, title: document.title }, products: [], legends: [] }));
      if (document.generation?.plan) files[GENERATION_PLAN_PATH] = encoder.encode(stableJSON(document.generation.plan));
      const kitFiles = window.CATALOG_AUTHORING_KIT_FILES || {};
      Object.entries(kitFiles).sort(([a], [b]) => a.localeCompare(b)).forEach(([path, content]) => {
        files[`authoring-kit/${path}`] = encoder.encode(String(content));
      });
      files["authoring-kit/capabilities.json"] = encoder.encode(stableJSON(capabilities));

      const report = {
        reportType: "CatalogPackageExportReport",
        reportVersion: "1.0.0",
        generatedAt: new Date().toISOString(),
        policy: { assetMode: "assisted", exportTarget: target },
        summary: {
          pages: document.pages.length,
          components: countDocumentComponents(document),
          componentTypes: capabilities.components.length,
          products: document.collections.find(collection => collection.id === "products")?.items.length || 0,
          assets: manifestAssets.length,
          publishReadyAssets: manifestAssets.filter(asset => asset.approval.status === "publish-ready" && asset.approval.publishAllowed).length,
          textTruncations: gate.visualIntegrity?.summary?.truncations ?? null,
          textCollisions: gate.visualIntegrity?.summary?.textCollisions ?? null,
          textObjectCollisions: gate.visualIntegrity?.summary?.textObjectCollisions ?? null,
          textBelowMinimum: gate.visualIntegrity?.summary?.belowMinimum ?? null
        },
        gate,
        issues: [...gate.issues, ...warnings]
      };
      files[EXPORT_REPORT_PATH] = encoder.encode(stableJSON(report));

      const fileRecords = await Promise.all(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)).map(([path, value]) => fileRecord(path, value)));
      manifestAssets.forEach(asset => {
        const record = fileRecords.find(file => file.path === asset.path);
        if (record) record.mimeType = asset.mimeType;
      });
      const manifest = {
        $schema: "authoring-kit/schemas/catalog-project-package.schema.json",
        packageFormat: PACKAGE_FORMAT,
        packageVersion: PACKAGE_VERSION,
        createdAt: new Date().toISOString(),
        generator: { name: "Catálogo V1", increment: "05.59", schemaVersion: document.schemaVersion },
        project: { id: document.id, title: document.title },
        policy: { assetMode: "assisted", publicationGate: target },
        document: { path: DOCUMENT_PATH, schemaVersion: document.schemaVersion },
        catalogSource: { path: CATALOG_SOURCE_PATH, sourceVersion: window.CatalogSource?.VERSION || "1.1.0" },
        ...(document.generation?.plan ? { generationPlan: { path: GENERATION_PLAN_PATH, planVersion: document.generation.plan.planVersion || "1.1.0" } } : {}),
        capabilities: { path: CAPABILITIES_PATH, manifestVersion: CAPABILITIES_VERSION },
        authoringKit: { root: "authoring-kit", manifestPath: "authoring-kit/manifest.json", version: AUTHORING_KIT_VERSION, visualGuideIncluded: false },
        report: { path: EXPORT_REPORT_PATH },
        assets: manifestAssets,
        files: fileRecords
      };

      const zipEntries = { [ROOT_MANIFEST_PATH]: encoder.encode(stableJSON(manifest)), ...files };
      const bytes = fflate().zipSync(zipEntries, { level: 6, mtime: FIXED_ZIP_TIME });
      return { bytes, manifest, report, gate, fileName: `${slug(document.title)}.${target === "publication" ? "publicacao" : "rascunho"}.catalogo.zip` };
    }

    async exportPackage(options = {}) {
      const result = await this.buildPackage(options);
      download(result.bytes, result.fileName);
      return result;
    }

    buildAuthoringKit(options = {}) {
      const capabilities = buildCapabilitiesManifest(this.store.getExportDocument());
      const source = window.CATALOG_AUTHORING_KIT_FILES || {};
      const files = {};
      Object.entries(source).sort(([a], [b]) => a.localeCompare(b)).forEach(([path, content]) => { files[`CatalogAuthoringKit-${AUTHORING_KIT_VERSION}/${path}`] = encoder.encode(String(content)); });
      files[`CatalogAuthoringKit-${AUTHORING_KIT_VERSION}/capabilities.json`] = encoder.encode(stableJSON(capabilities));
      const visualGuideFiles = options.visualGuideFiles || null;
      if (visualGuideFiles) {
        Object.entries(visualGuideFiles).sort(([a], [b]) => a.localeCompare(b)).forEach(([path, content]) => {
          if (!safePath(path)) throw new PackageError("VISUAL_GUIDE_PATH", `Caminho inseguro no guia visual: ${path}`);
          files[`CatalogAuthoringKit-${AUTHORING_KIT_VERSION}/visual-guide/${path}`] = asBytes(content);
        });
      }
      return fflate().zipSync(files, { level: 6, mtime: FIXED_ZIP_TIME });
    }

    async loadVisualGuideFiles() {
      const source = window.CATALOG_AUTHORING_KIT_FILES || {};
      let coreManifest;
      try {
        coreManifest = JSON.parse(source["manifest.json"] || "{}");
      } catch (error) {
        throw new PackageError("VISUAL_GUIDE_CORE_MANIFEST", `Manifesto do núcleo inválido: ${error.message}`);
      }
      const companion = coreManifest.visualCompanion;
      if (!companion?.manifestSha256 || companion.distribution !== "standalone-kit-only") {
        throw new PackageError("VISUAL_GUIDE_UNDECLARED", "O núcleo não declara um complemento visual exportável.");
      }
      let manifestBytes;
      try {
        const response = await fetch("authoring-kit-visual/manifest.json");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        manifestBytes = new Uint8Array(await response.arrayBuffer());
      } catch (error) {
        throw new PackageError("VISUAL_GUIDE_MANIFEST_FETCH", `Não foi possível carregar o manifesto visual: ${error.message}`);
      }
      if (await sha256(manifestBytes) !== companion.manifestSha256) throw new PackageError("VISUAL_GUIDE_MANIFEST_HASH", "O manifesto visual diverge do hash declarado pelo núcleo.");
      let manifest;
      try {
        manifest = JSON.parse(decoder.decode(manifestBytes));
      } catch (error) {
        throw new PackageError("VISUAL_GUIDE_MANIFEST_JSON", `Manifesto visual inválido: ${error.message}`);
      }
      if (manifest.guideFormat !== companion.format || manifest.guideVersion !== companion.version || !Array.isArray(manifest.files)) {
        throw new PackageError("VISUAL_GUIDE_MANIFEST_CONTRACT", "O manifesto visual não corresponde ao complemento declarado.");
      }
      const files = { "manifest.json": manifestBytes };
      const loadedFiles = await Promise.all(manifest.files.map(async record => {
        if (!safePath(record.path) || !Number.isInteger(record.size) || record.size < 1 || !/^[a-f0-9]{64}$/.test(record.sha256 || "")) {
          throw new PackageError("VISUAL_GUIDE_FILE_RECORD", `Registro inválido no guia visual: ${record.path || "?"}`);
        }
        let bytes;
        try {
          const response = await fetch(`authoring-kit-visual/${record.path}`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          bytes = new Uint8Array(await response.arrayBuffer());
        } catch (error) {
          throw new PackageError("VISUAL_GUIDE_FILE_FETCH", `Não foi possível carregar ${record.path}: ${error.message}`);
        }
        if (bytes.byteLength !== record.size || await sha256(bytes) !== record.sha256) {
          throw new PackageError("VISUAL_GUIDE_FILE_HASH", `O arquivo visual ${record.path} diverge do manifesto.`);
        }
        return [record.path, bytes];
      }));
      loadedFiles.forEach(([path, bytes]) => { files[path] = bytes; });
      return files;
    }

    async buildCompleteAuthoringKit() {
      return this.buildAuthoringKit({ visualGuideFiles: await this.loadVisualGuideFiles() });
    }

    async exportAuthoringKit() {
      const bytes = await this.buildCompleteAuthoringKit();
      download(bytes, `CatalogAuthoringKit-${AUTHORING_KIT_VERSION}.zip`);
      return bytes;
    }

    async analyzePackage(file) {
      const emptySummary = { pages: 0, components: 0, products: 0, templates: 0, assets: 0, tableRows: 0, packageAssets: 0, packageBytes: Number(file?.size) || 0 };
      const issues = [];
      const addIssue = (severity, code, message) => issues.push({ severity, code, message });
      if (Number(file?.size) > MAX_PACKAGE_SIZE) {
        addIssue("error", "PACKAGE_TOO_LARGE", "O pacote excede o limite de 100 MB.");
        return { kind: "package", ok: false, sourceVersion: "—", targetVersion: PACKAGE_VERSION, document: null, summary: emptySummary, issues };
      }
      let bytes;
      let preflight;
      let entries;
      try {
        bytes = new Uint8Array(await file.arrayBuffer());
        preflight = inspectZip(bytes);
        entries = fflate().unzipSync(bytes);
      } catch (error) {
        addIssue("error", error.code || "PACKAGE_READ", error.message || "O pacote não pôde ser lido.");
        return { kind: "package", ok: false, sourceVersion: "—", targetVersion: PACKAGE_VERSION, document: null, summary: emptySummary, issues };
      }

      const unlistedPaths = new Set(preflight.entries.map(entry => entry.path));
      const manifestBytes = entries[ROOT_MANIFEST_PATH];
      if (!manifestBytes) {
        addIssue("error", "MANIFEST_MISSING", `O pacote não contém ${ROOT_MANIFEST_PATH}.`);
        return { kind: "package", ok: false, sourceVersion: "—", targetVersion: PACKAGE_VERSION, document: null, summary: emptySummary, issues };
      }
      unlistedPaths.delete(ROOT_MANIFEST_PATH);

      let manifest;
      try {
        manifest = JSON.parse(decoder.decode(manifestBytes));
      } catch (error) {
        addIssue("error", "MANIFEST_JSON", `Manifesto inválido: ${error.message}`);
        return { kind: "package", ok: false, sourceVersion: "—", targetVersion: PACKAGE_VERSION, document: null, summary: emptySummary, issues };
      }
      const sourceVersion = String(manifest.packageVersion || "não informada");
      if (manifest.packageFormat !== PACKAGE_FORMAT) addIssue("error", "PACKAGE_FORMAT", `Formato esperado: ${PACKAGE_FORMAT}.`);
      if (sourceVersion !== PACKAGE_VERSION) addIssue("error", "PACKAGE_VERSION", `A versão de pacote ${sourceVersion} não é suportada por esta versão (${PACKAGE_VERSION}).`);
      if (!ASSET_POLICY_MODES.has(manifest.policy?.assetMode)) addIssue("error", "ASSET_POLICY", `A política de assets “${manifest.policy?.assetMode || "não informada"}” é desconhecida.`);
      else if (manifest.policy.assetMode !== "assisted") addIssue("info", "ASSET_POLICY_OVERRIDE", `O pacote usa a política de assets “${manifest.policy.assetMode}” em vez do default Assistido.`);

      const sourceRecords = Array.isArray(manifest.files) ? manifest.files : [];
      if (sourceRecords.length > MAX_ENTRIES) addIssue("error", "TOO_MANY_MANIFEST_FILES", `O manifesto excede o limite de ${MAX_ENTRIES} arquivos declarados.`);
      const records = sourceRecords.slice(0, MAX_ENTRIES);
      const recordPaths = new Set();
      for (const record of records) {
        if (!safePath(record?.path)) {
          addIssue("error", "UNSAFE_MANIFEST_PATH", `O manifesto contém um caminho inseguro: “${record?.path || "vazio"}”.`);
          continue;
        }
        if (recordPaths.has(record.path)) {
          addIssue("error", "DUPLICATE_MANIFEST_PATH", `O caminho “${record.path}” está duplicado no manifesto.`);
          continue;
        }
        recordPaths.add(record.path);
        unlistedPaths.delete(record.path);
        const content = entries[record.path];
        if (!content) {
          addIssue("error", "PACKAGE_FILE_MISSING", `O arquivo declarado “${record.path}” não está no ZIP.`);
          continue;
        }
        if (Number(record.size) !== content.byteLength) addIssue("error", "SIZE_MISMATCH", `O tamanho de “${record.path}” difere do manifesto.`);
        if (!/^[a-f0-9]{64}$/.test(String(record.sha256 || "")) || await sha256(content) !== record.sha256) addIssue("error", "HASH_MISMATCH", `O hash SHA-256 de “${record.path}” não confere.`);
      }
      unlistedPaths.forEach(path => addIssue("warning", "UNLISTED_FILE", `O arquivo “${path}” não está declarado no manifesto e será ignorado.`));

      const documentPath = manifest.document?.path;
      let documentSource = null;
      if (!safePath(documentPath) || !entries[documentPath]) addIssue("error", "DOCUMENT_MISSING", "O documento declarado pelo pacote não foi encontrado.");
      else {
        const documentRecord = records.find(record => record.path === documentPath);
        if (!documentRecord || documentRecord.role !== "document" || documentRecord.mimeType !== "application/json") addIssue("error", "DOCUMENT_DESCRIPTOR", "O documento precisa estar declarado com role document e MIME application/json.");
        if (entries[documentPath].byteLength > MAX_DOCUMENT_SIZE) addIssue("error", "DOCUMENT_TOO_LARGE", "O documento do pacote excede 10 MB.");
        try {
          documentSource = JSON.parse(decoder.decode(entries[documentPath]));
        } catch (error) {
          addIssue("error", "DOCUMENT_JSON", `O documento do pacote é inválido: ${error.message}`);
        }
      }

      let documentAnalysis = null;
      if (documentSource) {
        if (manifest.document?.schemaVersion !== documentSource.schemaVersion) addIssue("error", "DOCUMENT_VERSION_DESCRIPTOR", "A versão do documento diverge do manifesto do pacote.");
        documentAnalysis = this.store.analyzeDocument(documentSource);
        documentAnalysis.issues.forEach(issue => addIssue(issue.severity, `DOCUMENT_${issue.code}`, issue.message));
      }

      const capabilitiesPath = manifest.capabilities?.path;
      if (!safePath(capabilitiesPath) || !entries[capabilitiesPath]) addIssue("error", "CAPABILITIES_MISSING", "O manifesto declarativo de capacidades não foi encontrado.");
      else {
        const capabilitiesRecord = records.find(record => record.path === capabilitiesPath);
        if (!capabilitiesRecord || capabilitiesRecord.role !== "capabilities" || capabilitiesRecord.mimeType !== "application/json") addIssue("error", "CAPABILITIES_DESCRIPTOR", "Capacidades precisam estar declaradas com role capabilities e MIME application/json.");
        try {
          const capabilities = JSON.parse(decoder.decode(entries[capabilitiesPath]));
          if (capabilities.manifestType !== "CatalogCapabilities" || !Array.isArray(capabilities.components)) addIssue("error", "CAPABILITIES_INVALID", "O manifesto de capacidades possui estrutura inválida.");
          if (capabilities.manifestVersion !== manifest.capabilities?.manifestVersion) addIssue("error", "CAPABILITIES_VERSION", "A versão das capacidades diverge do manifesto do pacote.");
        } catch (error) {
          addIssue("error", "CAPABILITIES_JSON", `O manifesto de capacidades é inválido: ${error.message}`);
        }
      }
      const kitManifestPath = manifest.authoringKit?.manifestPath;
      if (!safePath(kitManifestPath) || !entries[kitManifestPath]) addIssue("warning", "AUTHORING_KIT_MISSING", "O pacote não contém o manifesto do kit de autoria informado.");
      else {
        try {
          const kitManifest = JSON.parse(decoder.decode(entries[kitManifestPath]));
          if (kitManifest.kitFormat !== "CatalogAuthoringKit" || kitManifest.kitVersion !== manifest.authoringKit?.version) addIssue("warning", "AUTHORING_KIT_VERSION", "O manifesto do kit não corresponde à versão declarada pelo pacote.");
        } catch (error) {
          addIssue("warning", "AUTHORING_KIT_JSON", `O manifesto do kit é inválido: ${error.message}`);
        }
      }
      const reportPath = manifest.report?.path;
      if (!safePath(reportPath) || !entries[reportPath]) addIssue("warning", "REPORT_MISSING", "O relatório declarado pelo pacote não foi encontrado.");
      else {
        const reportRecord = records.find(record => record.path === reportPath);
        if (!reportRecord || reportRecord.role !== "report" || reportRecord.mimeType !== "application/json") addIssue("warning", "REPORT_DESCRIPTOR", "O relatório não está declarado com role report e MIME application/json.");
        try { JSON.parse(decoder.decode(entries[reportPath])); } catch (error) { addIssue("warning", "REPORT_JSON", `O relatório do pacote é inválido: ${error.message}`); }
      }

      const documentAssets = documentSource?.collections?.find(collection => collection.id === "assets")?.items || [];
      const documentAssetById = new Map(documentAssets.map(asset => [asset.id, asset]));
      if (documentAssetById.size !== documentAssets.length) addIssue("error", "DUPLICATE_DOCUMENT_ASSET_ID", "A coleção do documento contém IDs de asset duplicados.");
      const packageAssets = [];
      const assetIds = new Set();
      const assetPaths = new Set();
      const sourceAssets = Array.isArray(manifest.assets) ? manifest.assets : [];
      if (sourceAssets.length > MAX_ENTRIES) addIssue("error", "TOO_MANY_ASSETS", `O manifesto excede o limite de ${MAX_ENTRIES} assets.`);
      for (const asset of sourceAssets.slice(0, MAX_ENTRIES)) {
        if (!asset?.id || assetIds.has(asset.id)) {
          addIssue("error", "DUPLICATE_ASSET_ID", `O ID de asset “${asset?.id || "vazio"}” está ausente ou duplicado.`);
          continue;
        }
        assetIds.add(asset.id);
        if (assetPaths.has(asset.path)) addIssue("error", "DUPLICATE_ASSET_PATH", `O caminho de asset “${asset.path}” está associado a mais de um ID.`);
        assetPaths.add(asset.path);
        const documentAsset = documentAssetById.get(asset.id);
        if (!documentAsset) addIssue("error", "ASSET_NOT_IN_DOCUMENT", `O asset “${asset.id}” não existe na coleção do documento.`);
        if (!safePath(asset.path) || !entries[asset.path]) {
          addIssue("error", "ASSET_FILE_MISSING", `O arquivo do asset “${asset.id}” não foi encontrado.`);
          continue;
        }
        const content = entries[asset.path];
        const record = records.find(fileRecord => fileRecord.path === asset.path);
        if (!record || record.role !== "asset") addIssue("error", "ASSET_FILE_UNDECLARED", `O arquivo de “${asset.id}” não está declarado como asset.`);
        if (record && record.mimeType !== asset.mimeType) addIssue("error", "ASSET_MIME_DESCRIPTOR", `O MIME declarado para “${asset.id}” diverge entre os manifestos.`);
        if (!MIME_EXTENSIONS[asset.mimeType] || sniffMime(content) !== asset.mimeType) addIssue("error", "ASSET_MIME", `O MIME de “${asset.id}” não corresponde ao conteúdo.`);
        if (Number(asset.size) !== content.byteLength || asset.sha256 !== await sha256(content)) addIssue("error", "ASSET_INTEGRITY", `Tamanho ou hash de “${asset.id}” não confere.`);
        if (!ASSET_ORIGINS.has(asset.provenance?.origin) || !ASSET_FIDELITIES.has(asset.provenance?.fidelity) || !asset.provenance?.role || !asset.provenance?.method) addIssue("error", "ASSET_PROVENANCE", `A proveniência de “${asset.id}” está incompleta ou usa valores desconhecidos.`);
        if (!ASSET_APPROVALS.has(asset.approval?.status) || typeof asset.approval?.publishAllowed !== "boolean") addIssue("error", "ASSET_APPROVAL", `O estado de publicação de “${asset.id}” é inválido.`);
        if (asset.approval?.status === "publish-ready" && asset.approval.publishAllowed !== true) addIssue("warning", "ASSET_PUBLICATION_CONFLICT", `“${asset.id}” está publish-ready, mas a permissão de publicação está desativada.`);
        if (documentAsset?.reference?.provider !== "package" || documentAsset.reference.key !== asset.path) addIssue("error", "ASSET_REFERENCE", `A referência portátil de “${asset.id}” não corresponde ao manifesto.`);
        packageAssets.push({ ...clone(asset), blob: new Blob([content], { type: asset.mimeType }) });
      }
      documentAssets.forEach(asset => {
        if (asset.reference?.provider === "package" && !assetIds.has(asset.id)) addIssue("error", "ASSET_MANIFEST_MISSING", `A referência portátil “${asset.id}” não possui entrada no manifesto.`);
      });

      if (!issues.some(issue => issue.severity === "error")) addIssue("info", "PACKAGE_READY", "Documento, manifestos e assets foram verificados e estão prontos para importação.");
      const ok = !issues.some(issue => issue.severity === "error") && Boolean(documentAnalysis?.ok);
      const summary = {
        ...(documentAnalysis?.summary || emptySummary),
        assets: documentAnalysis?.summary?.assets || documentAssets.length,
        packageAssets: packageAssets.length,
        packageBytes: bytes.byteLength
      };
      return {
        kind: "package",
        ok,
        sourceVersion,
        targetVersion: PACKAGE_VERSION,
        document: ok ? documentAnalysis.document : null,
        manifest,
        packageAssets: ok ? packageAssets : [],
        summary,
        issues
      };
    }

    async commitPackage(analysis) {
      if (!analysis?.ok || analysis.kind !== "package") throw new PackageError("PACKAGE_NOT_READY", "O pacote precisa ser validado antes do commit.");
      const document = clone(analysis.document);
      const assets = document.collections.find(collection => collection.id === "assets")?.items || [];
      const storedKeys = [];
      const importId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      let replaced = false;
      try {
        const pendingBlobs = [];
        for (let index = 0; index < analysis.packageAssets.length; index += 1) {
          const imported = analysis.packageAssets[index];
          const item = assets.find(asset => asset.id === imported.id);
          if (!item) throw new PackageError("ASSET_REMAP", `O asset “${imported.id}” não pôde ser remapeado.`);
          const key = `package-${importId}-${String(index + 1).padStart(4, "0")}`;
          storedKeys.push(key);
          pendingBlobs.push({ id: key, blob: imported.blob });
          item.reference = { provider: "indexeddb", key };
          item.metadata = {
            ...item.metadata,
            mimeType: imported.mimeType,
            size: imported.size,
            sha256: imported.sha256,
            provenance: clone(imported.provenance || item.metadata?.provenance || {}),
            approval: clone(imported.approval || item.metadata?.approval || {})
          };
        }
        if (this.storage.putMany) await this.storage.putMany(pendingBlobs);
        else for (const entry of pendingBlobs) await this.storage.put(entry.id, entry.blob);
        this.store.replaceDocument(document, {
          changeType: "package-imported",
          importSummary: { ...analysis.summary, packageVersion: analysis.sourceVersion }
        });
        replaced = true;
        return this.store.getState();
      } catch (error) {
        if (!replaced) {
          if (this.storage.deleteMany) await this.storage.deleteMany(storedKeys).catch(() => false);
          else await Promise.all(storedKeys.map(key => this.storage.delete(key).catch(() => false)));
        }
        throw error;
      }
    }
  }

  window.CatalogProjectPackageManager = ProjectPackageManager;
  window.CatalogProjectManifests = { buildCapabilitiesManifest, stableJSON };
  window.CatalogProjectPackageUtils = {
    PACKAGE_FORMAT,
    PACKAGE_VERSION,
    AUTHORING_KIT_VERSION,
    MAX_PACKAGE_SIZE,
    MAX_ENTRY_SIZE,
    inspectZip,
    safePath,
    sniffMime,
    sha256,
    stableJSON,
    validateExportGate
  };
})();
