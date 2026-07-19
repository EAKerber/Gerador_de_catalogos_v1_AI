(function () {
  "use strict";

  const catalogIcons = window.CATALOG_ICON_LIBRARY || {};
  const editorIcons = {
    header: { label: "Cabeçalho", category: "Editor", body: '<path d="M4 5h16v5H4z"/><path d="M7 15h10M7 19h7"/>' },
    card: { label: "Card", category: "Editor", body: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h6M7 12h10M7 16h4"/>' },
    footer: { label: "Rodapé", category: "Editor", body: '<path d="M4 14h16v5H4z"/><path d="M7 5h10M7 9h7"/>' },
    art: { label: "Arte", category: "Editor", body: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m5 18 5-5 3 3 2-2 4 4"/>' },
    text: { label: "Texto", category: "Editor", body: '<path d="M5 6h14M8 6v12M16 6v12M5 18h6M13 18h6"/>' },
    page: { label: "Página", category: "Editor", body: '<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/>' },
    trash: { label: "Excluir", category: "Editor", body: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>' },
    duplicate: { label: "Duplicar", category: "Editor", body: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>' }
  };

  window.CATALOG_EDITOR_ICONS = { ...catalogIcons, ...editorIcons };

  window.CatalogEditorIcon = function (name, className) {
    const icon = window.CATALOG_EDITOR_ICONS[name] || window.CATALOG_EDITOR_ICONS.application || window.CATALOG_EDITOR_ICONS.card;
    return '<span class="' + (className || "") + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icon.body + '</svg></span>';
  };
})();
