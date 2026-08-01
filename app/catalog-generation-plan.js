(function () {
  "use strict";

  const VERSION = "1.1.0";
  const clone = value => JSON.parse(JSON.stringify(value));
  const number = (value, fallback, minimum, maximum) => Math.max(minimum, Math.min(maximum, Number(value) || fallback));
  const allowed = (value, values, fallback) => values.includes(value) ? value : fallback;

  function normalizeProductDirectives(source, plan = {}) {
    const products = Array.isArray(source?.products) ? source.products : [];
    const ids = new Set(products.map(product => String(product.id)));
    const directives = new Map((Array.isArray(plan.products) ? plan.products : [])
      .filter(item => item && ids.has(String(item.productId)))
      .map(item => [String(item.productId), item]));
    const requestedOrder = Array.isArray(plan.productOrder) ? plan.productOrder.map(String).filter(id => ids.has(id)) : [];
    const order = [...new Set([...requestedOrder, ...products.map(product => String(product.id))])];
    return order.map((productId, index) => {
      const directive = directives.get(productId) || {};
      const product = products.find(item => String(item.id) === productId) || {};
      const galleryAssets = new Set([
        ...(product.assetRoles?.gallery || []),
        ...(product.variants || []).flatMap(variant => variant.assetIds || [])
      ].map(String).filter(Boolean));
      const galleryCount = galleryAssets.size;
      const inferredPreset = galleryCount >= 2 ? "product-variants" : "product-standard";
      return {
        productId,
        role: allowed(directive.role, ["hero", "grid"], index === 0 ? "hero" : "grid"),
        presetId: String(directive.presetId || inferredPreset),
        mode: allowed(directive.mode, ["standard", "hero", "technical", "variants", "data-only"], galleryCount >= 2 ? "variants" : "standard"),
        density: allowed(directive.density, ["compact", "standard", "comfortable"], index === 0 ? "comfortable" : "compact")
      };
    });
  }

  function normalizeFooter(catalog, footer = {}) {
    if (footer.enabled === false) {
      return { enabled: false, state: "omitted", recipeId: null, itemCount: 0, items: [], recommendation: null, store: "", city: "", phone: "", updatedAt: "" };
    }
    const values = {
      store: String(footer.store || catalog.store || ""),
      city: String(footer.city || catalog.city || ""),
      phone: String(footer.phone || catalog.phone || ""),
      address: String(footer.address || catalog.address || ""),
      benefit: String(footer.benefit || ""),
      service: String(footer.service || ""),
      updatedAt: String(footer.updatedAt || catalog.updatedAtLabel || "")
    };
    const recommendation = window.CatalogFooterRecipes?.recommendation?.(values) || { status: "needs-input", recipeId: "contact", count: 3, message: "Confirme o conteúdo do rodapé." };
    const explicitItems = Array.isArray(footer.items) ? footer.items.slice(0, window.CatalogFooterRecipes?.HARD_MAX || 8).map((item, index) => ({
      role: String(item?.role || "custom"),
      icon: String(item?.icon || "shield-star"),
      title: String(item?.title || "[ITEM DO RODAPÉ]"),
      subtitle: String(item?.subtitle || ""),
      contentState: item?.contentState === "confirmed" ? "confirmed" : "pending",
      placeholder: item?.contentState !== "confirmed"
    })) : null;
    const valuesByRole = {
      identity: values.store ? { title: values.store, subtitle: values.city } : null,
      contact: values.phone ? { title: values.phone, subtitle: String(footer.contactLabel || "") } : null,
      location: values.address || values.city ? { title: values.address || values.city, subtitle: values.address && values.city ? values.city : "" } : null,
      benefit: values.benefit ? { title: values.benefit, subtitle: "" } : null,
      service: values.service ? { title: values.service, subtitle: "" } : null,
      page: { title: String(footer.pageLabel || "Página 01"), subtitle: values.updatedAt }
    };
    const recipeId = String(footer.recipeId || recommendation.recipeId || "contact");
    const itemCount = window.CatalogFooterRecipes?.normalizeCount?.(footer.itemCount, explicitItems?.length || recommendation.count || 3) || Math.max(1, Math.min(8, Number(footer.itemCount) || explicitItems?.length || 3));
    const items = explicitItems || window.CatalogFooterRecipes?.descriptors?.(recipeId, itemCount, valuesByRole) || [];
    const state = items.some(item => item.contentState !== "confirmed") ? "pending" : "ready";
    return { enabled: true, state, recipeId, itemCount: items.length, items, recommendation, ...values };
  }

  function normalize(source, plan = {}) {
    const catalog = source?.catalog || {};
    const layout = plan.layout || {};
    const header = plan.header || {};
    const footer = plan.footer || {};
    const strategy = allowed(plan.strategy, ["hero-grid", "grid-only"], "hero-grid");
    const directives = normalizeProductDirectives(source, plan);
    const explicitHero = strategy === "grid-only" ? null : plan.heroProductId && directives.some(item => item.productId === String(plan.heroProductId))
      ? String(plan.heroProductId)
      : directives.find(item => item.role === "hero")?.productId || directives[0]?.productId || null;
    directives.forEach(item => { item.role = explicitHero && item.productId === explicitHero ? "hero" : "grid"; });
    return {
      planFormat: "CatalogGenerationPlan",
      planVersion: VERSION,
      id: String(plan.id || `plan-${catalog.id || "catalog"}`),
      catalogId: catalog.id == null ? null : String(catalog.id),
      strategy,
      page: {
        preset: "A4",
        orientation: "portrait",
        width: 794,
        height: 1123,
        safeMargin: number(plan.page?.safeMargin, 24, 12, 64)
      },
      layout: {
        gap: number(layout.gap, 12, 4, 32),
        columns: Math.round(number(layout.columns, 3, 1, 3)),
        headerHeight: number(layout.headerHeight, 110, 96, 180),
        heroHeight: number(layout.heroHeight, 222, 190, 360),
        footerHeight: number(layout.footerHeight, 100, 80, 160),
        maxGridRows: Math.round(number(layout.maxGridRows, 2, 1, 4))
      },
      header: {
        enabled: header.enabled !== false,
        kicker: String(header.kicker || catalog.kicker || "CATÁLOGO"),
        title: String(header.title || catalog.title || "CATÁLOGO DE PRODUTOS"),
        logoAssetId: header.logoAssetId || catalog.logoAssetId || null
      },
      footer: normalizeFooter(catalog, footer),
      heroProductId: explicitHero,
      productOrder: directives.map(item => item.productId),
      products: directives,
      policies: {
        overflow: allowed(plan.policies?.overflow, ["error", "warn"], "error"),
        missingAsset: allowed(plan.policies?.missingAsset, ["placeholder", "error"], "placeholder"),
        safeRepair: plan.policies?.safeRepair !== false
      }
    };
  }

  function validate(source, plan) {
    const issues = [];
    const add = (severity, code, message) => issues.push({ severity, code, message, scope: "plan" });
    if (!plan || typeof plan !== "object" || Array.isArray(plan)) add("error", "PLAN_TYPE", "O plano editorial precisa ser um objeto JSON.");
    else {
      if (plan.planFormat && plan.planFormat !== "CatalogGenerationPlan") add("error", "PLAN_FORMAT", "O arquivo não usa planFormat CatalogGenerationPlan.");
      if (plan.planVersion && !["1.0.0", VERSION].includes(plan.planVersion)) add("error", "PLAN_VERSION", `A versão ${plan.planVersion} do plano não é suportada; esperado 1.0.0 ou ${VERSION}.`);
      const known = new Set((source?.products || []).map(product => String(product.id)));
      (plan.productOrder || []).forEach(productId => { if (!known.has(String(productId))) add("error", "PLAN_PRODUCT_UNKNOWN", `O produto “${productId}” do plano não existe no CatalogSource.`); });
      (plan.products || []).forEach(item => { if (!known.has(String(item?.productId))) add("error", "PLAN_DIRECTIVE_PRODUCT_UNKNOWN", `A diretiva referencia o produto desconhecido “${item?.productId || "sem ID"}”.`); });
    }
    return { ok: !issues.some(issue => issue.severity === "error"), issues };
  }

  window.CatalogGenerationPlan = Object.freeze({ VERSION, normalize, validate, normalizeProductDirectives, normalizeFooter, clone });
})();
