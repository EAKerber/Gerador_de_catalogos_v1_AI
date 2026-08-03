# Matriz de disposição de capacidades e módulos da V1

## Estado e autoridade

- **Checkpoint analítico:** `05.63`
- **Base examinada:** `development@ac33b638eaf8d92d04b6a7c846f9b8f830e1bb54`
- **Fonte das 51 capacidades:** `authoring-kit/capabilities.json`
- **Registro consultável:** `docs/v1/CAPABILITY-DISPOSITION.json`
- **Classificação:** concluída para revisão; não autoriza extração, V2 ou
  migração

O JSON é a lista canônica das disposições individuais, dependências, custo,
evidência e condição de refutação. Este documento explica o critério, o
resultado agregado e a disposição dos módulos que implementam essas
capacidades.

## Como interpretar a matriz

| Disposição | Significado operacional |
| --- | --- |
| `preserve` | manter contrato e comportamento; somente adaptar integração |
| `extract` | isolar uma primitiva comprovada; não levar o módulo hospedeiro |
| `rebuild` | preservar a necessidade, substituindo contrato, autoridade ou mecanismo |
| `discard` | não carregar como capacidade/mecanismo; preservar apenas como história |
| `defer` | excluir do primeiro corte vertical e reavaliar depois do núcleo |
| `open` | medir antes de escolher |

Uma capacidade em `rebuild` não é um voto para portar código. É o contrário: o
valor do usuário continua válido, mas a implementação V1 perdeu a presunção de
reuso. Uma capacidade em `extract` também não autoriza copiar o arquivo inteiro;
ela exige isolamento, testes próprios e remoção das dependências da V1.

## Resultado rígido

| Disposição | Quantidade | Leitura |
| --- | ---: | --- |
| `preserve` | 1 | apenas a lista de formatos de asset merece manter o contrato atual |
| `extract` | 13 | há primitivas comprovadas, mas acopladas a módulos maiores |
| `rebuild` | 15 | a necessidade permanece e o mecanismo atual não |
| `discard` | 6 | controles ou capacidades públicas que ampliam a superfície sem proteger o objetivo |
| `defer` | 15 | recursos válidos, porém fora do primeiro corte vertical |
| `open` | 1 | limite de bytes depende de ambiente e dados ainda não medidos |
| **Total** | **51** | cobertura exata do manifesto 1.7.2 |

O resultado é mais severo que a governança histórica: somente uma capacidade
pode ser preservada sem ressalva. Isso não torna a V1 inútil. Vinte e oito
capacidades conservam valor imediato por extração ou reconstrução, quinze ficam
como opções posteriores e as fixtures continuam sendo patrimônio. O que a
matriz rejeita é a ideia de que “ativo na V1” significa “componente aprovado da
V2”.

## Disposição das 51 capacidades

### Preservar

| Capacidade | Motivo | Evidência | Custo |
| --- | --- | --- | --- |
| `assetFormats` | SVG, PNG, JPEG e WebP cobrem os inputs preservados; ampliar agora não resolve falha observada | E-004, E-008 | baixo |

### Extrair

| Capacidade | Primitiva a salvar | Evidência | Custo |
| --- | --- | --- | --- |
| `artInstanceFraming` | matemática de fit/foco/zoom/offset e paridade tela/impressão | E-006, KF-004 | médio |
| `batchTableSchemas` | comando semântico e transação atômica, sem store atual | E-002, E-003 | médio |
| `contextualTableRows` | operação de criar/vincular linha, sem controle atual | E-004 | médio |
| `geometricPublicationGate` | interseção e contenção tipadas como geometria | E-001–E-003, KF-009 | médio |
| `manualBulkProductEntry` | parser delimitado e confirmação de dados | E-002, E-003 | baixo |
| `manualBulkTableEntry` | parser tabular separado do esquema | E-002, E-003 | baixo |
| `projectPackageExport` | ZIP seguro, hashes, MIME e inventário | E-004, E-008 | médio |
| `projectPackageImport` | preflight, path safety, integridade e rollback | E-004, E-008 | médio |
| `renderedTextIntegrityGate` | ranges DOM, scroll e interseção; não o agregador | E-005, KF-001, KF-002 | médio |
| `reusableTableSchemas` | papéis de coluna e aplicação sem apagar valores | E-002–E-004 | baixo |
| `semanticTables` | chaves estáveis, papéis de coluna e valores vinculados | E-002–E-004 | médio |
| `tableColumnPresentationControls` | separação entre key e label/ordem/visibilidade | E-004 | baixo |
| `undoRedo` | semântica de comandos atômicos e reversíveis, sem store monolítico | E-003, E-008 | alto |

### Reconstruir

| Capacidade | Necessidade preservada | Mecanismo rejeitado | Evidência |
| --- | --- | --- | --- |
| `batchPresentation` | aplicar intenção a múltiplos itens | presets, modos e overrides concorrentes | KF-010 |
| `bulkCollectionEditing` | reduzir repetição em coleções | UI e comandos acoplados ao store/inspector | E-003, KF-008, KF-010 |
| `catalogSourceDirectImport` | entrada data-first direta | schema/versionamento e feedback atuais | E-004, E-009, KF-003 |
| `contextualInsertActions` | inserir por intenção | taxonomia e superfície atuais | E-002, KF-008 |
| `distinctProductModes` | expressar prioridade editorial | cinco modos fixos e seus contratos paralelos | E-004, KF-010 |
| `draftPublicationGates` | distinguir rascunho e publicação | agregador que permite superfícies `notRun` ou linguagem ambígua | E-005, KF-001, KF-009 |
| `editorialTextControls` | política explícita de redução/reflow | controles locais de escala e overflow | E-005, KF-001, KF-002 |
| `generationPlanCompiler` | materialização determinística | Plan 1.1/1.0, store mutável e DOM externo | E-008, E-009, KF-003 |
| `independentProductArrangement` | separar conteúdo de orientação | override pós-compilação concorrente | E-004, KF-010 |
| `jsonExport` | documento auditável em dados | `CatalogDocument 1.16.0` como contrato presumido | E-004, E-009 |
| `jsonImport` | importação validada e transacional | migração/normalização V1 | E-004, E-009 |
| `manualProductCardBatch` | materializar seleção em lote | segundo caminho de defaults e geometria | E-002, E-003 |
| `packageAssetPolicy` | proveniência, fidelidade e aprovação | linhagem de derivados opcional na prática | E-004, KF-006 |
| `printPdf` | PDF como saída principal | browser/dialog e verificação fora do ciclo | E-004, E-005, KF-005 |
| `semanticCatalogSource` | separar fatos e intenção | schema atual e campos de proveniência incompletos | E-004, E-009, KF-003 |

### Descartar como capacidade pública

| Capacidade | Motivo | Destino do valor residual |
| --- | --- | --- |
| `batchSeparators` | divisor deve resultar da estrutura editorial, não ser ferramenta paralela | cenário histórico para testar layout |
| `internalIconScale` | ícone deve obedecer automaticamente a slot e hierarquia | casos atuais alimentam testes de fit |
| `optionalLegendMaterialization` | materialização pertence ao compilador ou à ação semântica | comportamento pode reaparecer dentro de outro comando |
| `progressiveInspectorVocabulary` | abas Conteúdo/Layout/Visual/Avançado não resolveram custo da tarefa | comparação futura com UI orientada a tarefa |
| `slotSpanControl` | span é detalhe geométrico exposto como decisão editorial | intenção de peso/ocupação no novo layout |
| `specificationDensityControls` | presets de gap/padding deslocam para o usuário uma decisão do reflow | fixtures alimentam políticas de texto/layout |

Descartar não apaga código ou evidência do snapshot. Significa que a V2 não
deve recriar a capacidade pelo mesmo nome apenas para preservar paridade de
checklist.

### Adiar

| Capacidade | Dependência que precisa existir antes |
| --- | --- |
| `batchAlignment` | editor manual e seleção aprovados |
| `batchFrameMap` | novo frame model, edição manual e undo/redo |
| `batchGeometry` | autoridade geométrica e transações aprovadas |
| `batchSpacing` | layout automático e necessidade manual medida |
| `contextualArtGallery` | requisito real de múltiplas imagens por produto |
| `heroGridStripComposition` | primitives/receitas sobre layout aprovado |
| `hierarchicalVisualLegends` | semântica de legendas e teste de custo |
| `linkedVariantRepresentations` | domínio de variantes, tabelas e assets |
| `multiSelection` | editor manual e modelo de seleção |
| `multiplePages` | uma página heterogênea passando todos os gates |
| `officialSectionRecipes` | poucos componentes fundamentais aprovados |
| `oneClickInsertion` | taxonomia e UI orientada a tarefa |
| `selectionGeometryDiagnostics` | multisseleção e gate geométrico tipado |
| `semanticColorLegends` | caso mínimo com classificação compartilhada |
| `semanticProductVariants` | caso mínimo que exija variantes |

### Ainda aberta

| Capacidade | Pergunta necessária |
| --- | --- |
| `assetMaxBytes` | qual limite é suportado pelos assets reais, memória, upload, persistência e deployment escolhidos? |

## Disposição dos módulos e contratos críticos

| Grupo V1 | Disposição | O que salvar | O que não carregar | Condição antes de agir |
| --- | --- | --- | --- | --- |
| fixtures, PDFs, métricas e CI | `preserve` | bytes, hashes, comandos, expectativas e histórico | linguagem antiga de “visual” como definição atual | índice e cadeia de custódia válidos |
| `tokens.js`, ícones e registries visuais | `extract` | tokens úteis, SVGs próprios e testes de contraste | nomes/valores como norma universal | contrato visual do corte aprovado |
| `manual-entry.js` | `extract` | parsers puros e limites de entrada | acoplamento com UI/store | testes unitários sem browser/global |
| `visual-text-integrity.js` | `extract` | medição DOM e interseção | severidade global e promessa de correção | renderer autoritativo escolhido |
| `catalog-validator.js` | `extract` | diagnóstico de referências, frames e fatos pendentes | termo genérico “válido visualmente” | relatório de qualidade tipado |
| transporte de `project-package.js` | `extract` | ZIP, path safety, MIME, hashes e rollback | manifesto/documento 1.16.0 e bundle embutido | contrato de pacote V2 aprovado |
| `asset-storage.js` | `extract` | adapter IndexedDB e rollback local | política de proveniência misturada à persistência | interface de storage definida |
| `catalog-source.js` e schema | `rebuild` | vocabulário factual e fixtures | schema 1.1.0 como compromisso | domínio e obrigatoriedade aprovados |
| `catalog-generation-plan.js` e schema | `rebuild` | ideia de intenção explícita e decisões | versão 1.1/1.0 e cobertura parcial | política de layout definida |
| `catalog-compiler.js` | `rebuild` | determinismo, decision log e `notRun` explícito | mutação via store e saída não renderizada como conclusão | ciclo fechado especificado |
| `document-store.js` | `rebuild` | invariantes e testes de transação | monólito de 4.607 linhas e múltiplos escritores | mapa de comandos/estado aprovado |
| `layout-engine.js` e contratos de reflow | `rebuild` | casos, mínimos e propriedades de snap como evidência | algoritmo atual como esqueleto | contrato de qualidade/layout aprovado |
| `renderer.js`, CSS e `print-export.js` | `rebuild` | projeções e casos de paridade | duas superfícies de verdade e exportação externa ao loop | renderer único escolhido |
| `component-registry.js` e 16 tipos | `rebuild` | intenção/slots/bindings como pesquisa | taxonomia inteira e defaults atuais | poucos primitivos validados no corte |
| `inspector.js`, `interactions.js`, workspace | `rebuild` | tarefas e métricas de usabilidade | arquitetura por painéis/propriedades | protótipo de tarefa comparado |
| governança de assets | `rebuild` | hashing, aprovação, fidelidade e fonte | `derived` sem parent obrigatório | regra de linhagem aprovada |
| Authoring Kit 1.7.2 | `rebuild` | disciplina factual, evidências e protocolo de entrega | bundle como ponto de entrada executável da V2 | contratos V2 estabilizados |
| recipes, presentations e contratos incrementais | `defer` | fixtures e cenários | cadeia de patches/installers | primitives e layout aprovados |
| `app/authoring-kit-files.js` | `discard` | somente prova de equivalência histórica | bundle JS embutido duplicando runtime e docs | nenhum; preservar apenas em `archive/v1` |
| migração V1 → V2 | `defer` | documentos V1 como corpus | promessa de compatibilidade | arquitetura e contrato V2 escolhidos |

## Conclusões arquiteturais permitidas por esta matriz

Esta unidade permite afirmar:

1. a arquitetura V1 não deve ser o esqueleto presumido da V2;
2. há primitivas suficientes para evitar uma reescrita sem memória;
3. o caminho central — Source, Plan, documento/store, compiler, layout,
   renderer/PDF e agregação dos gates — precisa ser reconstruído ou justificado
   novamente;
4. portabilidade, medição, parsing e evidência devem ser extraídos somente em
   módulos pequenos e independentes;
5. o primeiro corte não deve tentar recuperar paridade com 51 capacidades.

Ela não permite escolher framework, renderer, repositório, banco, linguagem ou
estratégia de migração. Essas escolhas continuam bloqueadas pelo contrato de
qualidade e pela comparação de alternativas.

## Ordem segura de eventual reutilização

Mesmo depois da decisão arquitetural, a ordem deve ser:

1. copiar fixtures e testes de propriedades, não implementação;
2. definir interfaces pequenas para parser, medição, geometria e pacote;
3. executar testes de caracterização contra a V1 congelada;
4. extrair uma primitiva por vez, removendo `window`, DOM ou store quando não
   forem parte essencial;
5. confirmar que a nova unidade passa sem o módulo hospedeiro;
6. só então integrar ao corte vertical.

Nenhum item `extract` deve ser copiado antes dessa sequência. Nenhum item
`defer` deve entrar no backlog de implementação do primeiro corte.

## Condição de aprovação do gate

`capability-disposition-approved` só pode ser marcado quando:

- o JSON cobrir exatamente as 51 capacidades sem duplicidade;
- toda disposição tiver evidência, dependências, custo e refutação;
- `preserve` não for usado para esconder acoplamento;
- os módulos críticos estiverem classificados separadamente das capacidades;
- não houver decisão implícita de arquitetura ou autorização de implementação.

Até a revisão, a matriz permanece `complete-pending-review`.

