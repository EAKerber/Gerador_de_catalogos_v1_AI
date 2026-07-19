# Handoff de desenvolvimento — Incremento 05.12

**Status:** concluído como incremento de medição. Não contém correções de UX observadas durante o ensaio.

## Linha de base atual

- editor: Incremento 05.12;
- schema: `CatalogDocument 1.16.0`;
- kit: `CatalogAuthoringKit 1.5.1`;
- viewport medido: `1366×768`;
- painéis: 294 px no alvo de notebook;
- fluxo manual: 267 ações canônicas, faixa observada de 267–268;
- fluxo automatizado: 3 ações, métrica separada;
- resultado manual: 8 colisões e 2 overflows.

## Próxima ordem

1. Incremento 05.13 — hospedagem estática por Git, sem persistência remota de projetos;
2. Incremento 05.14 — resposta à auditoria: geometria estável, seleção contextual, esquemas de tabela e gate de PDF;
3. Incremento 06 — multipágina e balanceamento;
4. Incremento 07 — colaboração local-first opcional.

## Regras para o 05.14

- partir do log e das evidências, não de contagens dos subfluxos antigos;
- preservar IDs, schema e arquitetura salvo migração explicitamente promovida;
- testar o commit de `x/y/largura/altura` após troca de seleção;
- nenhum clique em Camadas pode falhar silenciosamente;
- esquemas de tabela são estrutura reutilizável, não valores comerciais;
- impressão deve consultar o gate e ocultar chrome/toasts;
- repetir o mesmo roteiro após as correções e comparar fase por fase.

## Comando do ensaio

```bash
CATALOG_CHROMIUM_EXECUTABLE=/caminho/para/chromium \
CATALOG_BASE_URL=file:///caminho/absoluto/index.html \
CATALOG_AUDIT_OUTPUT_DIR=/tmp/catalog-audit-05.12 \
node tests/browser-reference-manual-audit.test.js
```

O teste falha se produtos, cards, linhas, galerias, legendas ou erros de runtime divergirem. Colisões e overflows são resultado medido, não condição de aprovação do 05.12.
