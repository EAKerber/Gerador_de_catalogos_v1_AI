# Auditoria histórica — Developer B 05.18

## Fonte congelada

- repositório: `EAKerber/Gerador_de_catalogos_v1_AI`;
- branch histórica: `agent/developer-b-05.18`;
- head imutável auditado: `deec36ab49c14f480294b14192016df409294e43`;
- merge-base: `eae179360068505397e20550d7a47f30bbdcb32b`;
- estado canônico comparado:
  `development@de0559949b85e51a662bcbb73f01317eec9f9860`;
- commits exclusivos: 489;
- caminhos alterados desde o merge-base: 231.

A branch inteira continua proibida de merge. A auditoria compara árvores e
blobs, não nomes móveis, e não adiciona commits à fonte histórica.

O inventário integral e verificável está em
`docs/history/DEVELOPER-B-05.18-INVENTORY.json`.

## Resultado objetivo

| Decisão | Quantidade | Tratamento |
| --- | ---: | --- |
| Aproveitar como arquivo novo | 0 | Nenhum arquivo exclusivo precisa ser copiado para `development`. |
| Manter somente como registro histórico | 40 | Preservar título, caminho, conclusão e substituto canônico neste índice. |
| Descartar a cópia histórica | 191 | Não migrar artefatos gerados, runners, workflows, duplicatas ou versões superadas. |

Dos 231 caminhos:

- 80 já existem em `development` com o mesmo blob e caminho;
- 64 existem no mesmo caminho, mas evoluíram depois da integração;
- 87 não existem em `development`;
- nenhum caminho foi excluído da árvore histórica;
- nenhum blob exclusivo reaparece em `development` sob outro nome.

Isso confirma que a integração curada do 05.20 já absorveu o código, os testes e
as fixtures úteis. O valor ainda exclusivo está nas conclusões documentais, não
em uma segunda implementação.

## Registro histórico documental

Todos os itens desta seção têm categoria **Registro histórico** e origem
`deec36ab49c14f480294b14192016df409294e43`. Os arquivos brutos não são
migrados; as conclusões abaixo são sua representação canônica.

### Planejamento e encerramento

| Título | Caminho original | Conclusão preservada | Substituto canônico |
| --- | --- | --- | --- |
| Backlog operacional 05.18 | `docs/DEVELOPER-B-BACKLOG-05.18.md` | Reduziu o trabalho a responsabilidades isoladas, sem schema oportunista nem refatoração transversal; o ciclo foi fechado para novas capacidades. | `docs/BACKLOG.md`, `docs/INCREMENT-05.20.md` |
| Backlog promocional 05.20 | `docs/DEVELOPER-B-BACKLOG-05.20.md` | Registra a sequência de 180 ações até o benchmark V2 de 93,8/100 e 216 ações com assets; receita macro permaneceu condicionada. | `docs/INCREMENT-05.20.md`, `docs/ROADMAP.md` |
| Addendum de contenção do rodapé | `docs/DEVELOPER-B-BACKLOG-ADDENDUM-05.18.12.2.md` | Delimitou a correção local do `footer-item` mínimo sem novo tipo, modo ou schema. | `docs/INCREMENT-05.20.md`, `app/component-registry.js` |
| Consolidação 05.19 | `docs/DEVELOPER-B-CONSOLIDATION-05.19.md` | Transferiu overrides de tabela e contenção do rodapé aos módulos canônicos antes de remover os shims. | `docs/INCREMENT-05.20.md` |

### Evidências 05.18

| Título | Caminho original | Conclusão preservada | Substituto canônico |
| --- | --- | --- | --- |
| Linha de base Developer B | `docs/evidence/05.18/developer-b/DB-05.18.1-BASELINE.md` | Definiu observação ampla/compacta dos cinco modos e tolerância geométrica de tela × impressão; não aprovou baseline pixel a pixel. | `tests/browser-developer-b-baseline-05.18.1.test.js`, `docs/INCREMENT-05.20.md` |
| Alinhamento textual | `docs/evidence/05.18/developer-b/DB-05.18.2-TEXT-ALIGNMENT.md` | Preservou alinhamento horizontal/vertical, histórico, importação e impressão sem editor rico ou CSS livre. | `docs/INCREMENT-05.20.md` |
| Escala textual | `docs/evidence/05.18/developer-b/DB-05.18.3-TEXT-SCALE.md` | Formalizou 80/100/120%, inclusive no rodapé, sem mudar o frame externo. | `docs/INCREMENT-05.20.md` |
| Overflow textual | `docs/evidence/05.18/developer-b/DB-05.18.4-TEXT-OVERFLOW.md` | Fixou `wrap`, `ellipsis` e `clip` como políticas persistentes e distinguíveis. | `docs/INCREMENT-05.20.md` |
| Escala de ícone | `docs/evidence/05.18/developer-b/DB-05.18.5-ICON-SCALE.md` | Separou escala interna do SVG e frame externo, preservando tokens e impressão. | `docs/INCREMENT-05.20.md` |
| Escala de especificação | `docs/evidence/05.18/developer-b/DB-05.18.6-SPECIFICATION-SCALE.md` | A implementação existente já satisfazia 80/100/120%; nenhuma correção de runtime foi justificada. | `docs/INCREMENT-05.20.md` |
| Card hero | `docs/evidence/05.18/developer-b/DB-05.18.7-PRODUCT-HERO.md` | Diferenciou `hero` por prioridade geométrica, mantendo a mesma subárvore e reversibilidade. | `docs/INCREMENT-05.20.md` |
| Card técnico | `docs/evidence/05.18/developer-b/DB-05.18.8-PRODUCT-TECHNICAL.md` | Priorizou especificações sem remover arte, tabela ou binding. | `docs/INCREMENT-05.20.md` |
| Card de variações | `docs/evidence/05.18/developer-b/DB-05.18.9-PRODUCT-VARIANTS.md` | Empilhou galeria e informações comerciais sem gerar captions ou estruturas ausentes. | `docs/INCREMENT-05.20.md` |
| Card data-only | `docs/evidence/05.18/developer-b/DB-05.18.10-PRODUCT-DATA-ONLY.md` | Priorizou informações e tabela, preservando arte e conteúdo quando presentes. | `docs/INCREMENT-05.20.md` |
| Intenções de componentes | `docs/evidence/05.18/developer-b/DB-05.18.11-COMPONENT-INTENTS.md` | Classificou os 16 tipos em cinco grupos sem renomear, ocultar ou alterar documentos. | `docs/INCREMENT-05.20.md` |
| Paleta por intenção | `docs/evidence/05.18/developer-b/DB-05.18.12-COMPONENT-PALETTE.md` | Reorganizou descoberta e busca sem perder drag-and-drop, teclado ou inserção contextual. | `docs/INCREMENT-05.20.md` |
| Posicionamento inicial | `docs/evidence/05.18/developer-b/DB-05.18.12.1-INITIAL-PLACEMENT.md` | Publicou hints não obrigatórios e corrigiu o `wrap` do rodapé sem constraint persistente. | `docs/INCREMENT-05.20.md` |
| Contenção do footer-item | `docs/evidence/05.18/developer-b/DB-05.18.12.2-FOOTER-ITEM-CONTAINMENT.md` | Protegeu ícone e textos no mínimo técnico; a responsabilidade foi depois consolidada no registro e CSS. | `docs/INCREMENT-05.20.md`, `app/component-registry.js` |
| Ícones técnicos | `docs/evidence/05.18/developer-b/DB-05.18.13-TECHNICAL-ICONS.md` | Adicionou lote técnico governado, monocromático e reutilizável sem novo tipo. | `docs/INCREMENT-05.20.md` |
| Ícones comerciais | `docs/evidence/05.18/developer-b/DB-05.18.14-COMMERCIAL-ICONS.md` | Adicionou contato, confiança e pagamento ao mesmo pipeline vetorial. | `docs/INCREMENT-05.20.md` |
| Receita section-heading | `docs/evidence/05.18/developer-b/DB-05.18.15-SECTION-HEADING.md` | Manter como receita: uma ação, peças editáveis e nenhum comportamento atômico exclusivo. | `docs/INCREMENT-05.20.md` |
| Receita fact | `docs/evidence/05.18/developer-b/DB-05.18.17-FACT.md` | Manter como receita; reconsiderar tipo somente diante de falhas reais de edição composta. | `docs/INCREMENT-05.20.md` |
| Auditoria de callout | `docs/evidence/05.18/developer-b/DB-05.18.19-CALLOUT-AUDIT.md` | Manter como receita; os problemas encontrados eram de snapshot, não de capacidade estrutural. | `docs/INCREMENT-05.20.md` |
| Encerramento Developer B | `docs/evidence/05.18/developer-b/DEVELOPER-B-CLOSURE.md` | Fechou o backlog para novas capacidades e autorizou apenas auditoria, correção e consolidação. | `docs/DEVELOPMENT-HANDOFF-05.41.md` |
| Integração dos contratos | `docs/evidence/05.18/developer-b/RUNTIME-CONTRACT-INTEGRATION.md` | Fixou runtime principal antes do espelho do kit e instalação antes da compilação. | `tools/build-authoring-kit.js`, `docs/INCREMENT-05.20.md` |
| Batch de estresse | `docs/evidence/05.18/developer-b/STRESS-TEST-BATCH.md` | Definiu sementes reproduzíveis e separação entre regressão comum e estresse; screenshots eram evidência, não baseline. | `tools/run-catalog-stress.js`, `tests/catalog-stress-runner.test.js` |

### Evidências 05.19

| Título | Caminho original | Conclusão preservada | Substituto canônico |
| --- | --- | --- | --- |
| Overrides de tabela no store | `docs/evidence/05.19/developer-b/DB-05.19.1-TABLE-BINDING-CONSOLIDATION.md` | Transferiu marcação de overrides ao store, preservando binding, append e histórico. | `app/document-store.js`, `docs/INCREMENT-05.20.md` |
| Remoção do shim de tabela | `docs/evidence/05.19/developer-b/DB-05.19.2-TABLE-BINDING-SHIM-REMOVAL.md` | Removeu o shim somente depois de regressão, estresse e build idempotente aprovados. | `app/document-store.js`, `docs/INCREMENT-05.20.md` |
| Contenção do rodapé canônica | `docs/evidence/05.19/developer-b/DB-05.19.3-FOOTER-CONTAINMENT-CONSOLIDATION.md` | Moveu frames internos ao registro e recorte ao CSS canônico. | `app/component-registry.js`, `styles/components.css` |
| Remoção do shim de rodapé | `docs/evidence/05.19/developer-b/DB-05.19.4-FOOTER-CONTAINMENT-SHIM-REMOVAL.md` | Removeu o contrato intermediário depois de validar tela, impressão e ausência de referências. | `app/component-registry.js`, `styles/components.css` |

### Evidências 05.20

| Título | Caminho original | Conclusão preservada | Substituto canônico |
| --- | --- | --- | --- |
| Generalização promocional | `docs/evidence/05.20/developer-b/DB-05.20.1-PROMOTIONAL-GENERALIZATION.md` | A estrutura foi criada em 180 ações sem novos tipos; limitações gráficas permaneceram como assets. | `docs/INCREMENT-05.20.md` |
| Hit testing | `docs/evidence/05.20/developer-b/DB-05.20.2-HIT-TESTING.md` | O finding era falso positivo do harness; placeholder escolhe asset e Camadas seleciona arte sem abrir diálogo. | `tests/browser-hit-testing-05.20.2.test.js` |
| Diagnóstico de referências | `docs/evidence/05.20/developer-b/DB-05.20.3-REFERENCE-DIAGNOSTICS.md` | Separou referências ausentes, inválidas e opcionais sem enfraquecer o gate de publicação. | `app/catalog-validator.js`, `docs/INCREMENT-05.20.md` |
| Aplicação conjunta de frame | `docs/evidence/05.20/developer-b/DB-05.20.5-FRAME-APPLICATION.md` | Reduziu geometria de 44 para 11 ações e o fluxo de 219 para 180, numa transação. | `docs/INCREMENT-05.20.md` |
| Auditoria de fidelidade inicial | `docs/evidence/05.20/developer-b/DB-05.20.9-PROMOTIONAL-FIDELITY-AUDIT.md` | Confirmou gramática visual tabular inadequada: 25/100, ofertas colapsadas e massas cromáticas ausentes. | `tests/promotional-fidelity-audit-05.20.9.py`, `docs/INCREMENT-05.20.md` |
| Baseline de prontidão | `docs/evidence/05.20/developer-b/DB-05.20.10-PROMOTIONAL-READINESS-BASELINE.md` | Identificou 13 tokens, duas receitas e oito papéis ausentes antes da remediação. | `docs/INCREMENT-05.20.md` |
| Plano de remediação | `docs/evidence/05.20/developer-b/DB-05.20.10-PROMOTIONAL-REMEDIATION-PLAN.md` | Exigiu prontidão, aceitação Chromium, benchmark V2 e fidelidade de categoria, sem tipo específico da referência. | `docs/INCREMENT-05.20.md` |
| Callout e benefícios | `docs/evidence/05.20/developer-b/DB-05.20.15-CALLOUT-BENEFITS.md` | Encerrou legibilidade com 93,8/100, zero regressão e sem ampliar a taxonomia. | `docs/INCREMENT-05.20.md` |
| Assets promocionais reais | `docs/evidence/05.20/developer-b/DB-05.20.16-PROMOTIONAL-ASSETS.md` | Assets resolveram mídia, marca e desenho técnico; estrutura e preço permaneceram nativos e portáteis. | `docs/INCREMENT-05.20.md` |
| Gate multirreferência | `docs/evidence/05.20/developer-b/DB-05.20.17-MULTIREFERENCE-GATE.md` | As duas referências não repetem macroestrutura; receita promocional de página seria especialização prematura. | `docs/INCREMENT-05.20.md`, `docs/DEVELOPMENT-HANDOFF-05.41.md` |

## Grupos descartados

| Grupo | Quantidade | Justificativa |
| --- | ---: | --- |
| Cópias exatas já canônicas | 80 | Mesmo caminho e mesmo blob em `development`. |
| Versões superadas no mesmo caminho | 64 | O arquivo canônico evoluiu depois da integração; restaurar a cópia histórica causaria regressão. |
| Workflows Developer B | 13 | Diagnóstico ou publicação temporária, alguns com escrita automática; substituídos por `catalog-integration.yml`. |
| JSONs de execução de estresse | 10 | Saídas geradas e reproduzíveis; conclusões preservadas nos documentos 05.19. |
| Screenshots de estresse | 16 | Quatro imagens repetidas em quatro execuções; sem aprovação como baseline. |
| Runners e listas de lote | 5 | Substituídos por `run-catalog-tests.js`, `run-catalog-stress.js` e seus contratos. |
| Ferramentas Developer B | 3 | Build e runners paralelos substituídos pelas ferramentas canônicas. |

## Referências visuais

Nenhuma imagem da branch histórica é promovida.

Os 16 PNGs exclusivos formam quatro grupos de blobs, cada um repetido nos
runs 05.19.3, 05.19.4, 05.19.5 e 05.19.6:

- canvas suportado;
- tela completa suportada;
- impressão suportada;
- viewport abaixo do mínimo.

O documento `STRESS-TEST-BATCH.md` afirma explicitamente que essas capturas
eram evidências de inspeção, sem baseline pixel a pixel aprovada. A política
canônica passa a ser `docs/VISUAL-EVIDENCE-POLICY.md`.

## Condição de encerramento

Após este relatório ser integrado em `development`, permanecem ações remotas
destrutivas e, portanto, separadas:

1. confirmar novamente `agent/developer-b-05.18@deec36a`;
2. fechar a PR #1 como auditoria concluída e não planejada para merge;
3. excluir a branch histórica somente com aprovação explícita do usuário;
4. confirmar por readback que a ref foi removida;
5. manter este índice, o SHA completo e a PR #1 como referências permanentes.

Nenhum código foi integrado por merge da branch histórica.
