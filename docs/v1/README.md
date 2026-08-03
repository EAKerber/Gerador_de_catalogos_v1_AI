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

Ainda precisam ser consolidadas sob o método de `docs/autopsy/README.md`:

- `CLOSURE-REPORT.md` — objetivos, resultados, falhas e limites;
- `EVIDENCE-INDEX.md` — artefatos, execuções, hashes e procedência;
- `KNOWN-FAILURES.md` — sintomas, reproduções e atribuição por camada;
- `CAPABILITY-DISPOSITION.md` — preservar, extrair, reconstruir, descartar ou
  adiar;
- `PR-LEDGER.md` — PRs, SHAs, CI e relação com o snapshot final.

Não crie esses arquivos como listas vazias apenas para marcar progresso. Cada
um deve nascer com evidência suficiente para ser revisável.

## Snapshot futuro

Depois da aprovação das entregas analíticas, o estado final será promovido de
forma explícita e identificado por:

- branch protegida `archive/v1`;
- tag anotada `v1.0.0-prototype`;
- release opcional que declare “protótipo encerrado, não pronto para
  publicação”.

Nenhuma dessas refs existe por decisão deste checkpoint. Sua criação exige o
readback da árvore final; a poda vem somente depois.
