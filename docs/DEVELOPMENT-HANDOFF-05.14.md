# Handoff de desenvolvimento — Incremento 05.14

## Estado

- editor: Incremento 05.14;
- schema: `CatalogDocument 1.16.0`;
- kit: `CatalogAuthoringKit 1.5.3`;
- ADR principal: `ADR-026-autoridade-local-e-geometria-resolvida.md`.

## Contratos que não devem regredir

1. `managed: false` é uma exceção local durável e nunca pode ser reativada por reflow do pai.
2. Reintegração é explícita e usa uma única intenção pública.
3. Selecionar uma camada alcançável ajusta o contexto e seleciona em um clique.
4. Frame solicitado e aplicado ficam observáveis quando divergem.
5. Toasts, seleção e contêineres editoriais não aparecem no PDF.
6. `reflow.mode: manual` continua legível até uma migração de schema deliberada.

## Próximo foco

05.15 deve estabilizar receitas compactas, tabela editorial e ações compostas sem reabrir frentes congeladas. Depois, 05.16 mede novamente a reconstrução manual e simplifica a interface com base em evidência.
