(function () {
  "use strict";

  const VERSION = "1.0.0";
  const MIN_RECOMMENDED = 2;
  const MAX_RECOMMENDED = 5;
  const HARD_MAX = 8;
  const clone = value => JSON.parse(JSON.stringify(value));

  const roles = Object.freeze({
    identity: Object.freeze({ role: "identity", icon: "location", title: "[NOME DA EMPRESA]", subtitle: "[CIDADE · UF]" }),
    contact: Object.freeze({ role: "contact", icon: "whatsapp", title: "(00) 00000-0000", subtitle: "[CANAL DE ATENDIMENTO]" }),
    location: Object.freeze({ role: "location", icon: "location", title: "[ENDEREÇO OU REGIÃO]", subtitle: "[CIDADE · UF]" }),
    benefit: Object.freeze({ role: "benefit", icon: "shield-star", title: "[BENEFÍCIO CONFIRMADO]", subtitle: "" }),
    service: Object.freeze({ role: "service", icon: "truck", title: "[SERVIÇO CONFIRMADO]", subtitle: "" }),
    page: Object.freeze({ role: "page", icon: "calendar", title: "Página 01", subtitle: "[DD/MM/AAAA]" }),
    custom: Object.freeze({ role: "custom", icon: "shield-star", title: "[ITEM DO RODAPÉ]", subtitle: "[INFORMAÇÃO OPCIONAL]" })
  });

  const recipes = Object.freeze({
    minimal: Object.freeze({ id: "minimal", label: "Mínimo", description: "Contato e paginação.", roles: ["contact", "page"] }),
    contact: Object.freeze({ id: "contact", label: "Contato", description: "Identidade, contato e paginação.", roles: ["identity", "contact", "page"] }),
    informative: Object.freeze({ id: "informative", label: "Informativo", description: "Identidade, contato, localização e paginação.", roles: ["identity", "contact", "location", "page"] }),
    complete: Object.freeze({ id: "complete", label: "Completo", description: "Contato, localização, dois diferenciais e paginação.", roles: ["identity", "contact", "location", "benefit", "service", "page"] })
  });

  function normalizeCount(value, fallback = 3) {
    return Math.max(1, Math.min(HARD_MAX, Math.round(Number(value) || fallback)));
  }

  function isPlaceholder(value) {
    const text = String(value || "").trim();
    return /^\[[^\]]+\]$/.test(text) || /^\(00\)\s*0{4,5}-0{4}$/.test(text) || /exemplo\.invalid/i.test(text);
  }

  function descriptor(roleId, values = {}, options = {}) {
    const definition = roles[roleId] || roles.custom;
    const supplied = values && typeof values === "object" ? values : {};
    const title = String(supplied.title || definition.title);
    const subtitle = String(supplied.subtitle ?? definition.subtitle);
    const pending = options.pending === true || (!supplied.title && roleId !== "page") || isPlaceholder(title) || isPlaceholder(subtitle);
    return {
      role: definition.role,
      icon: String(supplied.icon || definition.icon),
      title,
      subtitle,
      contentState: pending ? "pending" : "confirmed",
      placeholder: pending
    };
  }

  function descriptors(recipeId = "contact", count = null, valuesByRole = {}) {
    const recipe = recipes[recipeId] || recipes.contact;
    const requested = normalizeCount(count, recipe.roles.length);
    const roleIds = recipe.roles.slice(0, requested);
    while (roleIds.length < requested) roleIds.splice(Math.max(0, roleIds.length - 1), 0, "custom");
    return roleIds.map(roleId => descriptor(roleId, valuesByRole[roleId], { pending: !valuesByRole[roleId] }));
  }

  function recommendation(input = {}) {
    const provided = value => Boolean(String(value || "").trim()) && !isPlaceholder(value);
    const supplied = {
      identity: provided(input.store || input.identity),
      contact: provided(input.phone || input.contact),
      location: provided(input.address || input.city || input.location),
      benefit: provided(input.benefit),
      service: provided(input.service)
    };
    const suppliedCount = Object.values(supplied).filter(Boolean).length;
    if (!suppliedCount) {
      return {
        status: "needs-input",
        recipeId: "contact",
        count: 3,
        message: "Nenhuma informação de rodapé foi fornecida; confirme contato, paginação, slots pendentes ou remoção explícita."
      };
    }
    const recipeId = supplied.benefit || supplied.service
      ? "complete"
      : supplied.location
        ? "informative"
        : supplied.identity
          ? "contact"
          : "minimal";
    const missingRoles = recipes[recipeId].roles.filter(roleId => roleId !== "page" && !supplied[roleId]);
    return {
      status: missingRoles.length ? "needs-input" : "ready",
      recipeId,
      count: recipes[recipeId].roles.length,
      message: missingRoles.length
        ? `Há dados parciais; confirme ou remova os papéis pendentes: ${missingRoles.join(", ")}.`
        : "A recomendação usa somente papéis sustentados pelas informações fornecidas."
    };
  }

  function list() {
    return Object.values(recipes).map(clone);
  }

  window.CatalogFooterRecipes = Object.freeze({
    VERSION,
    MIN_RECOMMENDED,
    MAX_RECOMMENDED,
    HARD_MAX,
    list,
    get(recipeId) { return recipes[recipeId] ? clone(recipes[recipeId]) : null; },
    descriptor,
    descriptors,
    recommendation,
    isPlaceholder,
    normalizeCount
  });
})();
