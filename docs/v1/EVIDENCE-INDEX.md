# Índice de evidências da V1

## Regra de leitura

Este índice distingue material existente no repositório de observações
preservadas no processo. Os estados seguem `docs/autopsy/README.md`:

- `observed`: comportamento presente em artefato ou execução identificada;
- `reproduced`: procedimento e resultado foram repetidos e registrados;
- `inferred`: explicação causal falsificável;
- `decided`: escolha aceita e formalizada.

Um artefato pode ser reexecutável sem que toda conclusão extraída dele esteja
reproduzida. Referências visuais são evidência de objetivo e contraste, nunca
fontes de fatos comerciais, templates ou golden images.

## Contexto da coleta

| Item | Valor |
| --- | --- |
| Base documental examinada | `development@efe9c063404910e902b109f340ff2dab7358876e` |
| Baseline funcional preservado | `e83a8f361b5bdcc9c33136ebebe87454abcb3bb8` |
| `main` anterior à transição | `050589347e55613182a00ed1e22f6efd2f1a2540` |
| Checkout local | raso (`git rev-parse --is-shallow-repository = true`) |
| Autoridade para PRs/refs | readback remoto do GitHub registrado em `PR-LEDGER.md` |
| Data de corte | 2026-08-02, horário do projeto |

## Registro primário

| ID | Estado | Pergunta coberta | Evidência | Resultado que pode ser afirmado |
| --- | --- | --- | --- | --- |
| E-001 | `reproduced` | Quanto custava reconstruir manualmente a referência no 05.12? | `docs/evidence/05.12/reference-manual.{metrics.json,document.json,editor.png,canvas.png,pdf}` | 267 ações, 8 colisões, 2 overflows, 7 produtos e 97 componentes |
| E-002 | `reproduced` | Continuidade de tarefa e lotes reduziram o custo? | `docs/evidence/05.16/reference-manual.metrics.json` e `task-continuity.metrics.json` | 223 ações no caso integral; 9 ações apenas no recorte estrutural não comparável; 8 colisões e 0 overflow no integral |
| E-003 | `reproduced` | Geometria por intenção fechou o alvo estrutural? | `docs/evidence/05.17/reference-manual.{metrics.json,document.json,editor.png,canvas.png,pdf}` | 157 ações, 0 colisão, 0 overflow, 94 componentes; não prova qualidade tipográfica posterior |
| E-004 | `reproduced` | O primeiro fluxo externo preservou fatos, pacote e revisão? | `docs/evidence/05.52/practical-flow-2026-07-30/` e `tests/practical-flow-fixture-05.52.test.js` | dois ciclos, pacotes reimportáveis, hashes íntegros e correções factuais preservadas; saída não aprovada como golden |
| E-005 | `reproduced` | Frames válidos podiam coexistir com texto truncado? | `tests/fixtures/text-integrity-blind-test-05.56.json`, `tests/browser-text-integrity-05.56.test.js` e `docs/INCREMENT-05.56.md` | dez truncamentos conhecidos motivaram auditor DOM separado do gate geométrico |
| E-006 | `reproduced` | O enquadramento do editor consegue igualar um recorte externo? | `docs/evidence/05.59B/art-framing-causal/` e testes `art-framing-causal-05.59B` | 1,86× de ganho no editor contra 1,88× no recorte, diferença de 0,68%, sem mudar o asset |
| E-007 | `observed` | O kit 1.7.2 incorporou a política causal e bloqueia pendências? | `authoring-kit/`, `docs/INCREMENT-05.60.md` e `tests/authoring-kit-evidence-05.60.test.js` | ordem de decisão de imagens e placeholders bloqueantes estão materializados no kit |
| E-008 | `observed` | Quais garantias existem no caminho crítico? | `app/catalog-source.js`, `catalog-generation-plan.js`, `catalog-compiler.js`, `catalog-validator.js`, `layout-engine.js`, `renderer.js`, `visual-text-integrity.js`, `print-export.js`, `project-package.js` | gates estruturais, DOM e de pacote existem, mas operam em estágios e autoridades distintas |
| E-009 | `observed` | Há divergência de versão do plano? | `schemas/catalog-generation-plan.schema.json`, `schemas/catalog-document.schema.json` e `app/catalog-compiler.js` | plano externo/geração usam 1.1.0; `generation.plan.planVersion` embutido é restringido a 1.0.0 pelo schema do documento |
| E-010 | `observed` | As referências anexadas já estão preservadas? | `docs/reference/*.jpeg` e `authoring-kit-visual/case-studies/*/reference.jpeg` | cópias versionadas têm os mesmos hashes das duas entradas conhecidas; não é necessário duplicá-las |
| E-011 | `observed` | O fluxo Git da V1 é rastreável? | metadados remotos consolidados em `docs/v1/PR-LEDGER.md` | 48 PRs: 44 integradas, 4 encerradas sem merge; `development` está 16 commits à frente e 0 atrás de `main` no corte |
| E-012 | `decided` | A V1 continua em evolução? | `docs/ADR-029-encerramento-v1-e-governanca-forense.md` | não; V1 congelada, V2 não autorizada, autópsia bloqueante |

## Hashes de identidade relevantes

### Referências conhecidas

| Papel | Caminhos versionados | SHA-256 |
| --- | --- | --- |
| catálogo técnico | `docs/reference/catalogo-base.jpeg`; `authoring-kit-visual/case-studies/catalogo-tecnico/reference.jpeg` | `4262171d057c6daedd47cd192600fa9f826d739552b4a4c84f38c917c010f2f6` |
| peça promocional | `docs/reference/promocional-base.jpeg`; `authoring-kit-visual/case-studies/promocional/reference.jpeg` | `dfdf29abd4d82f207071e482cb6f49bfd893f28a741039f1e38cffd02b4ab586` |

### Ensaio causal 05.59B

| Asset | SHA-256 |
| --- | --- |
| fonte oficial da corrediça | `d62a535b54ecbb813c63b640c29f81e622b41a704d2eb2e24711fe0407ad184d` |
| canvas neutro expandido | `8edeb58b697b4d6e65e0cdbd1c1f211b1cd7792884f268c4b4c69d5b13e5768c` |
| recorte externo | `5e8f119b6df8928ce412a9093f27a77b1361b45e289f7aa70a27cfbbc3d5e22f` |

### Fixture prática 05.52

O registro completo de 11 artefatos, com tamanho e SHA-256, está em
`docs/evidence/05.52/practical-flow-2026-07-30/fixture.json`. Esse JSON é a
fonte canônica; os hashes não são duplicados integralmente aqui para evitar
duas listas suscetíveis a divergência.

## Reprodução sem mutar a V1

Executar a partir da raiz, em checkout limpo:

```bash
npm run build
npm run test:node
node tests/practical-flow-fixture-05.52.test.js
node tests/art-framing-causal-05.59B.test.js
```

Os ensaios de browser usam o runner canônico e exigem Chromium compatível:

```bash
npm run test:browser
```

Uma reprodução forense deve registrar commit, ambiente, comando, exit code e
diferença em relação aos arquivos preservados. Não deve regravar as evidências
canônicas nem corrigir runtime durante a execução.

## Ensaio cego final ainda não ingerido

O caso que motivou o congelamento tem a seguinte cadeia de observação no
processo, mas seus arquivos não estão no checkout:

| ID | Estado | Observação preservada | Limite atual |
| --- | --- | --- | --- |
| O-001 | `observed` | pacote reportou 7 famílias, 24 variações, 50 componentes e zero colisões/overflows | pacote e relatório originais ausentes |
| O-002 | `observed` | oito artes permaneceram em `contain`, zoom 100%, foco central e offsets zero | documento importável ausente |
| O-003 | `observed` | PDF automático do editor apresentou oito reticências | PDF ausente |
| O-004 | `observed` | edição manual elevou a ocupação visual em cerca de 1,9×–7,4×, com alguns cortes excessivos | PDFs comparáveis ausentes |
| O-005 | `observed` | prévia paralela era visualmente melhor que o PDF autoritativo | par de artefatos ausente |
| O-006 | `observed` | derivados declaravam `sourceAssetIds: []` e não permitiam reprodução completa | manifesto final ausente |
| O-007 | `observed` | revisão seguinte declarou 59 componentes e zero colisões/overflows, mas o usuário ainda observou colisão e textos mal estruturados | pacote v2 e PDF ausentes |

Esses itens podem sustentar a decisão `decided` de congelar, porque o usuário
avaliou o resultado material. Não podem sustentar novas métricas ou uma
atribuição causal definitiva enquanto não forem ingeridos.

## Protocolo de ingestão do caso ausente

Se os artefatos voltarem a ficar disponíveis:

1. não substituir arquivos existentes;
2. criar `docs/evidence/05.60/cold-start-final/`;
3. preservar nomes originais, bytes, tamanho e SHA-256;
4. incluir inputs, pacote inicial, pacote revisado, previews, PDFs do editor,
   PDF manual e relatórios;
5. registrar qual PDF veio efetivamente do editor e qual é diagnóstico;
6. reabrir cada ZIP com o importador preservado;
7. medir separadamente frame collision, frame overflow, truncamento DOM,
   colisão de glifos, ocupação de imagem e divergência preview/PDF;
8. promover O-001–O-007 para `reproduced` somente nos itens confirmados.

## Lacunas conhecidas

- Não existe captura autocontida da última conversa/agente dentro do
  repositório; este índice preserva somente conclusões operacionais necessárias.
- A história Git local é rasa; não serve para provar a ancestralidade histórica
  completa.
- A suíte mede muitos contratos isolados, mas seu número total não é métrica de
  cobertura do objetivo do produto.
- A avaliação estética ainda não possui contrato mensurável aprovado; essa é
  uma entrega posterior da autópsia.

