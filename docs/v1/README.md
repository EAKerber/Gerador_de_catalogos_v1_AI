# V1 — índice histórico e de encerramento

## Classificação

A V1 é um **protótipo técnico congelado**. Ela demonstrou viabilidade parcial,
produziu infraestrutura reutilizável e revelou falhas arquiteturais relevantes,
mas não foi aceita como produto satisfatório ou pronto para publicação.

O último incremento funcional é `05.60`. O checkpoint `05.61` é somente
documental e inicia a autópsia.

## Fontes primárias existentes

- visão pretendida: `docs/PRODUCT-DEFINITION.md`;
- fluxo autoral pretendido: `docs/LLM-CATALOG-AUTHORING-FLOW.md`;
- capacidades materializadas: `docs/FEATURE-CATALOG.md` e
  `authoring-kit/capabilities.json`;
- decisões arquiteturais: `docs/ADR-*.md`;
- evolução: `docs/ROADMAP.md` e `docs/INCREMENT-*.md`;
- problemas e decisões históricas: `docs/BACKLOG.md`;
- evidências preservadas: `docs/evidence/` e estudos de caso do guia visual;
- último handoff anterior ao encerramento: `docs/DEVELOPMENT-HANDOFF-05.58.md`;
- último relatório funcional: `docs/INCREMENT-05.60.md`.

Esses documentos podem divergir porque registram momentos diferentes. Não os
normalize antes de preservar a divergência como evidência.

## Entregas de encerramento

Concluídas para revisão no checkpoint `05.62`:

- `CLOSURE-REPORT.md` — objetivos, resultados, falhas, limites e motivo formal
  do congelamento;
- `EVIDENCE-INDEX.md` — artefatos, execuções, hashes, procedência e lacunas de
  cadeia de custódia;
- `KNOWN-FAILURES.md` — dez falhas com estado, evidência, refutação e
  implicação preliminar;
- `PR-LEDGER.md` — 48 PRs, marcos de CI, refs remotas e regra de poda.
- `CAPABILITY-DISPOSITION.md` e `CAPABILITY-DISPOSITION.json` — classificação
  individual das 51 capacidades e disposição dos módulos críticos.

Próxima entrega bloqueante: `docs/v2/QUALITY-CONTRACT.md`.

Os documentos concluídos ainda aguardam revisão do gate
`v1-closure-report-approved` e `capability-disposition-approved`. “Concluído
para revisão” não significa aprovação arquitetural nem autorização de V2.

## Snapshot futuro

Depois da aprovação das entregas analíticas, o estado final será promovido de
forma explícita e identificado por:

- branch protegida `archive/v1`;
- tag anotada `v1.0.0-prototype`;
- release opcional que declare “protótipo encerrado, não pronto para
  publicação”.

Nenhuma dessas refs existe por decisão deste checkpoint. Sua criação exige o
readback da árvore final; a poda vem somente depois.
