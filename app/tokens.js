(function () {
  "use strict";

  window.CATALOG_EDITOR_TOKENS = {
    meta: { name: "Top Mobili — Catálogo V1", version: "2.0.0-alpha.3" },
    colors: {
      "brand.soft": { label: "Vermelho suave", value: "#fff1f1", group: "Marca" },
      "brand.light": { label: "Vermelho claro", value: "#ffd7d7", group: "Marca" },
      "brand.primary": { label: "Vermelho Top Mobili", value: "#fd0807", group: "Marca" },
      "brand.deep": { label: "Vermelho profundo", value: "#d90909", group: "Marca" },
      "brand.dark": { label: "Vermelho escuro", value: "#b50000", group: "Marca" },
      "text.primary": { label: "Preto editorial", value: "#0a0909", group: "Texto" },
      "text.strong": { label: "Texto forte", value: "#252525", group: "Texto" },
      "text.muted": { label: "Texto secundário", value: "#626262", group: "Texto" },
      "line.default": { label: "Divisória", value: "#d9dcdf", group: "Bordas" },
      "line.strong": { label: "Divisória forte", value: "#b9bdc1", group: "Bordas" },
      "paper": { label: "Papel", value: "#ffffff", group: "Superfícies" },
      "surface.neutral": { label: "Fundo neutro", value: "#f5f6f7", group: "Superfícies" },
      "surface.warm": { label: "Card quente", value: "#fff8e9", group: "Superfícies" },
      "surface.cool": { label: "Card frio", value: "#f4f9fd", group: "Superfícies" },
      "surface.lilac": { label: "Card lilás", value: "#faf6ff", group: "Superfícies" },
      "pack.1000": { label: "CX 1000", value: "#e9e9e9", group: "Embalagens" },
      "pack.500": { label: "CX 500", value: "#aeb5bd", group: "Embalagens" },
      "pack.300": { label: "CX 300", value: "#d9a800", group: "Embalagens" },
      "pack.250": { label: "CX 250", value: "#ffd79a", group: "Embalagens" },
      "pack.200": { label: "CX 200", value: "#b9dfff", group: "Embalagens" },
      "pack.150": { label: "CX 150", value: "#b9e8a4", group: "Embalagens" },
      "pack.100": { label: "CX 100", value: "#c7efb7", group: "Embalagens" },
      "pack.pct": { label: "PCT", value: "#dcbaf4", group: "Embalagens" }
    },
    typography: {
      "type.display": { label: "Título principal", family: "var(--font-display)", size: "34px", weight: 900, lineHeight: .95, letterSpacing: "-.03em", transform: "uppercase" },
      "type.kicker": { label: "Sobretítulo espaçado", family: "var(--font-sans)", size: "11px", weight: 700, lineHeight: 1.1, letterSpacing: ".42em", transform: "uppercase" },
      "type.section": { label: "Título de seção grande", family: "var(--font-display)", size: "22px", weight: 900, lineHeight: 1, letterSpacing: "-.015em", transform: "uppercase" },
      "type.card-title": { label: "Título de card", family: "var(--font-display)", size: "18px", weight: 900, lineHeight: 1, letterSpacing: "-.01em", transform: "uppercase" },
      "type.label": { label: "Rótulo técnico", family: "var(--font-display)", size: "11px", weight: 900, lineHeight: 1.1, letterSpacing: "0", transform: "uppercase" },
      "type.table-head": { label: "Cabeçalho de tabela", family: "var(--font-display)", size: "10px", weight: 900, lineHeight: 1.1, letterSpacing: ".01em", transform: "uppercase" },
      "type.table-value": { label: "Valor de tabela", family: "var(--font-display)", size: "12px", weight: 800, lineHeight: 1.15, letterSpacing: "0", transform: "none" },
      "type.price": { label: "Preço em destaque", family: "var(--font-display)", size: "19px", weight: 900, lineHeight: 1, letterSpacing: "-.01em", transform: "none" },
      "type.body": { label: "Texto corrido", family: "var(--font-sans)", size: "14px", weight: 400, lineHeight: 1.38, letterSpacing: "0", transform: "none" },
      "type.caption": { label: "Legenda", family: "var(--font-sans)", size: "10px", weight: 600, lineHeight: 1.3, letterSpacing: ".01em", transform: "none" }
    },
    surfaces: {
      "surface.paper": { label: "Papel branco", colorToken: "paper" },
      "surface.neutral": { label: "Neutro claro", colorToken: "surface.neutral" },
      "surface.warm": { label: "Quente suave", colorToken: "surface.warm" },
      "surface.cool": { label: "Frio suave", colorToken: "surface.cool" },
      "surface.lilac": { label: "Lilás suave", colorToken: "surface.lilac" },
      "surface.pack-1000": { label: "Embalagem CX 1000", colorToken: "pack.1000" },
      "surface.pack-300": { label: "Embalagem CX 300", colorToken: "pack.300" },
      "surface.pack-250": { label: "Embalagem CX 250", colorToken: "pack.250" },
      "surface.pack-200": { label: "Embalagem CX 200", colorToken: "pack.200" },
      "surface.pack-150": { label: "Embalagem CX 150", colorToken: "pack.150" },
      "surface.pack-100": { label: "Embalagem CX 100", colorToken: "pack.100" },
      "surface.pack-pct": { label: "Embalagem PCT", colorToken: "pack.pct" }
    },
    borders: {
      "border.none": { label: "Sem borda", width: 0, colorToken: "line.default" },
      "border.default": { label: "Borda neutra", width: 1, colorToken: "line.default" },
      "border.strong": { label: "Borda forte", width: 1, colorToken: "line.strong" },
      "border.brand": { label: "Borda da marca", width: 2, colorToken: "brand.primary" }
    },
    radii: {
      "radius.none": { label: "Sem arredondamento", value: "0px" },
      "radius.small": { label: "Pequeno · 4 px", value: "4px" },
      "radius.medium": { label: "Médio · 8 px", value: "8px" },
      "radius.large": { label: "Grande · 12 px", value: "12px" },
      "radius.pill": { label: "Pílula", value: "999px" }
    },
    artFits: {
      contain: { label: "Conter" },
      cover: { label: "Preencher" },
      original: { label: "Tamanho original" }
    }
  };
})();
