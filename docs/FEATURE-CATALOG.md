# Atlas de funcionalidades — Incremento 05.18

Referência operacional para pessoas e agentes. `authoring-kit/capabilities.json` é a fonte técnica; `feature-inventory.json` é gerado; `feature-guide.json` contém a curadoria por intenção; `feature-governance.json` define foco, congelamento e auditoria subtrativa. Execute `node tools/build-authoring-kit.js` para regenerar e validar referências.

## Resumo

- 45 capacidades de produto;
- 16 tipos de componente;
- 5 receitas oficiais;
- 17 fluxos curados;
- 27 ícones declarados.
- governança: 30 active, 5 maintain, 4 frozen, 1 paused, 5 audit.

## Fluxos por intenção

| ID | Intenção | Acesso | Resultado |
| --- | --- | --- | --- |
| `start.semantic-source` | Gerar um catálogo a partir de produtos estruturados | Importar → CatalogSource JSON → analisar → gerar | Fonte normalizada, plano editorial e página materializada deterministicamente |
| `start.page-structure` | Começar uma página manual sem montar a estrutura peça por peça | Componentes → Estruturas prontas → Página-base → + | Cabeçalho, área principal e rodapé editáveis, com foco no conteúdo |
| `content.bulk-products` | Cadastrar vários produtos sem repetir formulários | Produtos → Entrada rápida → colar TSV/CSV | Produtos independentes no inventário |
| `content.cards-from-products` | Criar e vincular cards para uma seleção de produtos | Produtos → selecionar → escolher organização → Criar composição | Cards vinculados e organizados em uma única transação |
| `content.table` | Editar estrutura e dados de uma tabela | Selecionar tabela → Conteúdo; ou + para nova linha | Colunas semânticas, múltiplas linhas e valores editáveis |
| `content.assets` | Substituir uma arte ou logo por um asset real | Clicar no placeholder → biblioteca do projeto → importar do computador | Asset persistido por referência e reutilizável |
| `content.variants` | Representar variações com imagem, legenda e linha comercial próprias | Produtos → editar → Variações; materialização opcional no card | Variante ligada à galeria e à linha sem depender da posição visual |
| `content.legends` | Vincular cor, rótulo e projeções de uma legenda | Tabela ou produto → Legendas → adicionar definição e materializar | Células e itens visuais resolvem o mesmo token por legendKey |
| `layout.multi-selection` | Refinar vários elementos irmãos de uma vez | Shift/Ctrl/Cmd+clique → Layout/Visual | Alinhamento, distribuição, equalização, valores exatos, deltas, espaçamento, apresentação ou separadores em uma transação |
| `visual.editorial-depth` | Ajustar hierarquia visual sem desmontar componentes | Texto, Ícone, Especificação ou Card → Conteúdo/Visual | Alinhamento, escala, overflow ou prioridade do modo mudam sem CSS arbitrário nem troca de tipo |
| `content.bulk-collections` | Criar imagens legendadas e legendas cromáticas sem repetir formulários | Galeria ou Tabela → Conteúdo → Editar coleção | Itens canônicos são sincronizados ou acrescentados em uma transação reversível |
| `reuse.saved-component` | Reutilizar uma composição editada | Selecionar componente → Estrutura → Salvar em Meus componentes | Snapshot reutilizável com novos IDs a cada inserção |
| `safety.history` | Reverter ou reaplicar uma mudança | Toolbar → Histórico; Ctrl/Cmd+Z e Ctrl/Cmd+Shift+Z ou Ctrl+Y | Estado anterior ou posterior restaurado atomicamente |
| `inspect.progressive` | Ajustar do conteúdo à geometria sem receber tudo de uma vez | Inspetor → Conteúdo, Layout, Visual e Avançado | Controles priorizados pela intenção e propriedades técnicas sob divulgação |
| `transfer.import` | Abrir um documento, fonte ou pacote sem perder o trabalho atual | Toolbar → Importar → analisar → confirmar | Relatório antes do commit e substituição reversível |
| `transfer.package` | Entregar um catálogo portátil com seus assets | Toolbar → Exportar → Pacote de rascunho ou publicação | ZIP com hashes, manifestos, relatório, documento, fonte/plano e kit |
| `transfer.pdf` | Gerar a saída A4 para impressão ou PDF | Toolbar → Imprimir / PDF | Projeção A4 sem chrome, guias ou contêineres editoriais |

## Gerar um catálogo a partir de produtos estruturados

- **ID:** `start.semantic-source`
- **Acesso:** Importar → CatalogSource JSON → analisar → gerar
- **Pré-condições:** Produtos com fatos comerciais confirmados; Assets identificados ou placeholders aceitos
- **Resultado:** Fonte normalizada, plano editorial e página materializada deterministicamente
- **Exemplo:** Importar sete produtos e gerar a estratégia hero-grid
- **Limites:** Uma página nesta versão; Não inventar código, preço, medida ou embalagem
- **Capacidades:** `semanticCatalogSource`, `catalogSourceDirectImport`, `generationPlanCompiler`, `geometricPublicationGate`
- **Componentes:** `product-card`
- **Receitas:** —
- **Contratos:** `CatalogSource.products`, `CatalogGenerationPlan`, `CatalogDocument.pages`

## Começar uma página manual sem montar a estrutura peça por peça

- **ID:** `start.page-structure`
- **Acesso:** Componentes → Estruturas prontas → Página-base → +
- **Pré-condições:** Página ativa; Contexto raiz
- **Resultado:** Cabeçalho, área principal e rodapé editáveis, com foco no conteúdo
- **Exemplo:** Criar a fundação de uma página de catálogo em uma ação
- **Limites:** A receita não decide conteúdo comercial
- **Capacidades:** `officialSectionRecipes`, `oneClickInsertion`, `contextualInsertActions`
- **Componentes:** `catalog-header`, `layout-container`, `catalog-footer`
- **Receitas:** `page-catalog-base`
- **Contratos:** `CatalogCapabilities.recipes`, `CatalogDocument.pages[].children`

## Cadastrar vários produtos sem repetir formulários

- **ID:** `content.bulk-products`
- **Acesso:** Produtos → Entrada rápida → colar TSV/CSV
- **Pré-condições:** Cabeçalhos reconhecíveis; Uma linha por produto
- **Resultado:** Produtos independentes no inventário
- **Exemplo:** Colar código, título, embalagem e preço de sete produtos
- **Limites:** A revisão confirma o mapeamento antes do commit
- **Capacidades:** `manualBulkProductEntry`
- **Componentes:** —
- **Receitas:** —
- **Contratos:** `CatalogDocument.collections.products`

## Criar e vincular cards para uma seleção de produtos

- **ID:** `content.cards-from-products`
- **Acesso:** Produtos → selecionar → escolher organização → Criar composição
- **Pré-condições:** Produtos existentes; Contêiner de destino com espaço
- **Resultado:** Cards vinculados e organizados em uma única transação
- **Exemplo:** Materializar um hero, seis cards em grade e uma faixa complementar
- **Limites:** Capacidade e gate geométrico continuam obrigatórios
- **Capacidades:** `manualProductCardBatch`, `heroGridStripComposition`, `undoRedo`
- **Componentes:** `product-card`, `layout-container`
- **Receitas:** `section-hero-grid-strip`
- **Contratos:** `component.binding.productId`, `CatalogDocument.collections.products`

## Editar estrutura e dados de uma tabela

- **ID:** `content.table`
- **Acesso:** Selecionar tabela → Conteúdo; ou + para nova linha
- **Pré-condições:** Tabela selecionada
- **Resultado:** Colunas semânticas, múltiplas linhas e valores editáveis
- **Exemplo:** Aplicar Medida e embalagem a vários cards e colar duas linhas comerciais
- **Limites:** Regras condicionais avançadas permanecem fora desta versão
- **Capacidades:** `semanticTables`, `contextualTableRows`, `manualBulkTableEntry`, `reusableTableSchemas`, `batchTableSchemas`
- **Componentes:** `data-table`
- **Receitas:** —
- **Contratos:** `component.props.columns`, `collection.tableRows`

## Substituir uma arte ou logo por um asset real

- **ID:** `content.assets`
- **Acesso:** Clicar no placeholder → biblioteca do projeto → importar do computador
- **Pré-condições:** SVG, PNG, JPEG ou WebP dentro do limite
- **Resultado:** Asset persistido por referência e reutilizável
- **Exemplo:** Escolher a foto do produto e ajustar foco/encaixe
- **Limites:** JSON isolado não transporta os bytes; SVG só recolore em modo token
- **Capacidades:** `projectPackageExport`, `packageAssetPolicy`
- **Componentes:** `art`
- **Receitas:** —
- **Contratos:** `collections.assets`, `component.props.assetId`, `component.props.vectorMode`

## Representar variações com imagem, legenda e linha comercial próprias

- **ID:** `content.variants`
- **Acesso:** Produtos → editar → Variações; materialização opcional no card
- **Pré-condições:** Produto existente; Identidade estável para cada variação
- **Resultado:** Variante ligada à galeria e à linha sem depender da posição visual
- **Exemplo:** Branco, preto e bege com códigos e preços próprios
- **Limites:** Uma linha pertence a no máximo uma variante
- **Capacidades:** `semanticProductVariants`, `linkedVariantRepresentations`, `contextualArtGallery`
- **Componentes:** `art-gallery`, `data-table`, `product-card`
- **Receitas:** —
- **Contratos:** `CatalogSource.products[].variants`, `commercialRows[].variantId`

## Vincular cor, rótulo e projeções de uma legenda

- **ID:** `content.legends`
- **Acesso:** Tabela ou produto → Legendas → adicionar definição e materializar
- **Pré-condições:** Chave de legenda única
- **Resultado:** Células e itens visuais resolvem o mesmo token por legendKey
- **Exemplo:** CX 250 em amarelo na célula e na faixa de embalagens
- **Limites:** Cor não pode ser o único meio de transmitir significado
- **Capacidades:** `semanticColorLegends`, `hierarchicalVisualLegends`, `optionalLegendMaterialization`
- **Componentes:** `legend-panel`, `legend-group`, `legend-item`, `data-table`
- **Receitas:** `section-packaging-legend`
- **Contratos:** `colorLegends[].key`, `component.props.legendKey`, `row.metadata.legendKeys`

## Refinar vários elementos irmãos de uma vez

- **ID:** `layout.multi-selection`
- **Acesso:** Shift/Ctrl/Cmd+clique → Layout/Visual
- **Pré-condições:** Itens no mesmo contexto e com o mesmo pai
- **Resultado:** Alinhamento, distribuição, equalização, valores exatos, deltas, espaçamento, apresentação ou separadores em uma transação
- **Exemplo:** Igualar três cards, deslocar o conjunto e inserir divisórias verticais
- **Limites:** Seleção cruzando pais é rejeitada
- **Capacidades:** `multiSelection`, `batchAlignment`, `batchGeometry`, `batchFrameMap`, `selectionGeometryDiagnostics`, `batchSpacing`, `batchSeparators`, `batchPresentation`
- **Componentes:** `separator`
- **Receitas:** —
- **Contratos:** `editor.selectedComponentIds`, `CatalogCapabilities.separatorPresets`

## Ajustar hierarquia visual sem desmontar componentes

- **ID:** `visual.editorial-depth`
- **Acesso:** Texto, Ícone, Especificação ou Card → Conteúdo/Visual
- **Pré-condições:** Componente compatível selecionado
- **Resultado:** Alinhamento, escala, overflow ou prioridade do modo mudam sem CSS arbitrário nem troca de tipo
- **Exemplo:** Destacar a arte no hero, ampliar dados no técnico e reduzir um ícone para 80% dentro da mesma caixa
- **Limites:** Escalas são discretas; Texto não aceita HTML; Modo não remove conteúdo da subárvore
- **Capacidades:** `editorialTextControls`, `internalIconScale`, `distinctProductModes`
- **Componentes:** `text`, `icon`, `specification`, `product-card`
- **Receitas:** —
- **Contratos:** `component.props.align`, `component.props.iconScale`, `component.presentation.mode`

## Criar imagens legendadas e legendas cromáticas sem repetir formulários

- **ID:** `content.bulk-collections`
- **Acesso:** Galeria ou Tabela → Conteúdo → Editar coleção
- **Pré-condições:** Uma linha por item; Assets opcionais já cadastrados
- **Resultado:** Itens canônicos são sincronizados ou acrescentados em uma transação reversível
- **Exemplo:** Colar Cromado, Preto e Branco como três imagens com legenda; criar a faixa cromática correspondente
- **Limites:** A colagem não importa arquivos binários; Até 24 imagens e 40 legendas por operação
- **Capacidades:** `contextualArtGallery`, `semanticColorLegends`, `optionalLegendMaterialization`, `bulkCollectionEditing`
- **Componentes:** `art-gallery`, `art`, `data-table`, `legend-panel`, `legend-group`, `legend-item`
- **Receitas:** `section-packaging-legend`
- **Contratos:** `art.props.caption`, `collections.colorLegends`, `component.props.legendKey`

## Reutilizar uma composição editada

- **ID:** `reuse.saved-component`
- **Acesso:** Selecionar componente → Estrutura → Salvar em Meus componentes
- **Pré-condições:** Subárvore válida
- **Resultado:** Snapshot reutilizável com novos IDs a cada inserção
- **Exemplo:** Salvar um card técnico customizado
- **Limites:** Snapshot não atualiza retroativamente instâncias existentes
- **Capacidades:** `oneClickInsertion`
- **Componentes:** —
- **Receitas:** —
- **Contratos:** `collections.templates`, `template.metadata.component`

## Reverter ou reaplicar uma mudança

- **ID:** `safety.history`
- **Acesso:** Toolbar → Histórico; Ctrl/Cmd+Z e Ctrl/Cmd+Shift+Z ou Ctrl+Y
- **Pré-condições:** Mudança autoral registrada
- **Resultado:** Estado anterior ou posterior restaurado atomicamente
- **Exemplo:** Desfazer a criação de sete cards como uma única ação
- **Limites:** Seleção e zoom não entram no histórico
- **Capacidades:** `undoRedo`
- **Componentes:** —
- **Receitas:** —
- **Contratos:** `DocumentStore.history`

## Ajustar do conteúdo à geometria sem receber tudo de uma vez

- **ID:** `inspect.progressive`
- **Acesso:** Inspetor → Conteúdo, Layout, Visual e Avançado
- **Pré-condições:** Seleção compatível
- **Resultado:** Controles priorizados pela intenção e propriedades técnicas sob divulgação
- **Exemplo:** Trocar título antes de abrir frames e mínimos calculados
- **Limites:** Avançado não é modo de permissão
- **Capacidades:** `progressiveInspectorVocabulary`
- **Componentes:** —
- **Receitas:** —
- **Contratos:** `CatalogCapabilities.capabilities.progressiveInspectorVocabulary`

## Abrir um documento, fonte ou pacote sem perder o trabalho atual

- **ID:** `transfer.import`
- **Acesso:** Toolbar → Importar → analisar → confirmar
- **Pré-condições:** Arquivo dentro dos limites; Schema reconhecido
- **Resultado:** Relatório antes do commit e substituição reversível
- **Exemplo:** Importar pacote ZIP com imagens e remapear referências
- **Limites:** Erros estruturais bloqueiam o commit
- **Capacidades:** `jsonImport`, `projectPackageImport`, `draftPublicationGates`, `undoRedo`
- **Componentes:** —
- **Receitas:** —
- **Contratos:** `CatalogDocument`, `CatalogProjectPackage`, `CatalogSource`

## Entregar um catálogo portátil com seus assets

- **ID:** `transfer.package`
- **Acesso:** Toolbar → Exportar → Pacote de rascunho ou publicação
- **Pré-condições:** Documento válido; Bytes de assets disponíveis
- **Resultado:** ZIP com hashes, manifestos, relatório, documento, fonte/plano e kit
- **Exemplo:** Exportar rascunho para revisão em outro navegador
- **Limites:** Publicação bloqueia pendências críticas; Rascunho converte pendências permitidas em avisos
- **Capacidades:** `projectPackageExport`, `draftPublicationGates`, `geometricPublicationGate`
- **Componentes:** —
- **Receitas:** —
- **Contratos:** `CatalogProjectPackage`, `catalog-project.json`

## Gerar a saída A4 para impressão ou PDF

- **ID:** `transfer.pdf`
- **Acesso:** Toolbar → Imprimir / PDF
- **Pré-condições:** Página revisada; Browser com impressão disponível
- **Resultado:** Projeção A4 sem chrome, guias ou contêineres editoriais
- **Exemplo:** Salvar a página atual como PDF
- **Limites:** Uma página nesta versão; A impressão usa o diálogo nativo
- **Capacidades:** `printPdf`
- **Componentes:** `separator`, `layout-container`
- **Receitas:** —
- **Contratos:** `@page A4`, `CatalogDocument.pages[0]`

## Inventário completo de capacidades

| ID | Valor | Governança | Motivo | Contrato |
| --- | --- | --- | --- | --- |
| `jsonImport` | `true` | **active** | Entrada portátil e autoria por agente continuam centrais. | `CatalogCapabilities.capabilities.jsonImport` |
| `jsonExport` | `true` | **active** | Documento materializado e auditável continua central. | `CatalogCapabilities.capabilities.jsonExport` |
| `projectPackageImport` | `true` | **maintain** | Portabilidade existente é preservada sem ampliar plataforma. | `CatalogCapabilities.capabilities.projectPackageImport` |
| `projectPackageExport` | `true` | **maintain** | Portabilidade existente é preservada sem ampliar publicação. | `CatalogCapabilities.capabilities.projectPackageExport` |
| `packageAssetPolicy` | `"assisted"` | **frozen** | Governança avançada de mídia está fora do foco atual. | `CatalogCapabilities.capabilities.packageAssetPolicy` |
| `assetFormats` | `["image/svg+xml","image/png","image/jpeg","image/webp"]` | **frozen** | Nenhum novo formato de mídia durante o ciclo de saneamento. | `CatalogCapabilities.capabilities.assetFormats` |
| `assetMaxBytes` | `26214400` | **frozen** | Limite atual permanece por compatibilidade. | `CatalogCapabilities.capabilities.assetMaxBytes` |
| `undoRedo` | `true` | **active** | Toda ação pontual ou composta precisa ser reversível. | `CatalogCapabilities.capabilities.undoRedo` |
| `printPdf` | `true` | **active** | PDF permanece saída de fidelidade, não plataforma de publicação. | `CatalogCapabilities.capabilities.printPdf` |
| `multiplePages` | `false` | **paused** | Depende de layout e reflow confiáveis. | `CatalogCapabilities.capabilities.multiplePages` |
| `semanticCatalogSource` | `true` | **active** | Fonte data-first é a direção principal do produto. | `CatalogCapabilities.capabilities.semanticCatalogSource` |
| `semanticTables` | `true` | **active** | Esquemas reutilizáveis são prioridade de redução de ações. | `CatalogCapabilities.capabilities.semanticTables` |
| `semanticColorLegends` | `true` | **maintain** | Preservar vínculos existentes; regras avançadas ficam congeladas. | `CatalogCapabilities.capabilities.semanticColorLegends` |
| `semanticProductVariants` | `true` | **maintain** | Entidade semântica é preservada sem expansão multimídia. | `CatalogCapabilities.capabilities.semanticProductVariants` |
| `linkedVariantRepresentations` | `true` | **audit** | Evitar duplicidade entre variante, linha e representação visual. | `CatalogCapabilities.capabilities.linkedVariantRepresentations` |
| `hierarchicalVisualLegends` | `true` | **audit** | Resultado existe, mas tarefa e hierarquia custaram 39 ações. | `CatalogCapabilities.capabilities.hierarchicalVisualLegends` |
| `optionalLegendMaterialization` | `true` | **audit** | Automação é útil, mas altera disclosures e foco da tarefa. | `CatalogCapabilities.capabilities.optionalLegendMaterialization` |
| `draftPublicationGates` | `true` | **frozen** | Workflow de aprovação/publicação não será ampliado. | `CatalogCapabilities.capabilities.draftPublicationGates` |
| `generationPlanCompiler` | `true` | **active** | Deve compartilhar comandos com a edição manual. | `CatalogCapabilities.capabilities.generationPlanCompiler` |
| `geometricPublicationGate` | `true` | **active** | Será tratado como validação de saída e confiabilidade geométrica. | `CatalogCapabilities.capabilities.geometricPublicationGate` |
| `catalogSourceDirectImport` | `true` | **active** | Fluxo principal de geração data-first. | `CatalogCapabilities.capabilities.catalogSourceDirectImport` |
| `manualBulkProductEntry` | `true` | **active** | Maior ganho observado na criação manual. | `CatalogCapabilities.capabilities.manualBulkProductEntry` |
| `manualBulkTableEntry` | `true` | **active** | Base para esquema e dados em operações separadas. | `CatalogCapabilities.capabilities.manualBulkTableEntry` |
| `reusableTableSchemas` | `true` | **active** | Reduz configuração repetida sem criar um segundo modelo de tabela. | `CatalogCapabilities.capabilities.reusableTableSchemas` |
| `batchTableSchemas` | `true` | **active** | Aplica a mesma intenção estrutural a várias tabelas em uma transação reversível. | `CatalogCapabilities.capabilities.batchTableSchemas` |
| `manualProductCardBatch` | `true` | **active** | Operação composta de alto valor comprovado. | `CatalogCapabilities.capabilities.manualProductCardBatch` |
| `heroGridStripComposition` | `true` | **active** | Materializa uma organização frequente com componentes canônicos e editáveis. | `CatalogCapabilities.capabilities.heroGridStripComposition` |
| `multiSelection` | `true` | **active** | Base para ações de grupo. | `CatalogCapabilities.capabilities.multiSelection` |
| `batchAlignment` | `true` | **active** | Intenção distinta de organização de irmãos. | `CatalogCapabilities.capabilities.batchAlignment` |
| `batchGeometry` | `true` | **active** | Valores exatos, deltas e equalização expressam precisão recorrente sobre conjuntos. | `CatalogCapabilities.capabilities.batchGeometry` |
| `batchFrameMap` | `true` | **active** | Aplica caixas heterogêneas em uma transação e elimina estados intermediários do ajuste campo a campo. | `CatalogCapabilities.capabilities.batchFrameMap` |
| `selectionGeometryDiagnostics` | `true` | **active** | Torna colisões e extrapolações visíveis no contexto da tarefa antes da exportação. | `CatalogCapabilities.capabilities.selectionGeometryDiagnostics` |
| `batchPresentation` | `true` | **audit** | Consolidar com modos, presets e densidade sem duplicar superfícies. | `CatalogCapabilities.capabilities.batchPresentation` |
| `oneClickInsertion` | `true` | **active** | O botão contextual demonstrou ganho geral de usabilidade. | `CatalogCapabilities.capabilities.oneClickInsertion` |
| `officialSectionRecipes` | `true` | **active** | Receitas devem evoluir para comandos compostos compartilhados. | `CatalogCapabilities.capabilities.officialSectionRecipes` |
| `contextualInsertActions` | `true` | **active** | Expressam intenção de posicionamento sem exigir drag. | `CatalogCapabilities.capabilities.contextualInsertActions` |
| `contextualTableRows` | `true` | **active** | Ação contextual clara, frequente e reversível. | `CatalogCapabilities.capabilities.contextualTableRows` |
| `contextualArtGallery` | `true` | **maintain** | Manter a operação existente sem expandir mídia. | `CatalogCapabilities.capabilities.contextualArtGallery` |
| `bulkCollectionEditing` | `true` | **active** | Reduz a repetição manual em galerias e legendas sem criar entidades paralelas. | `CatalogCapabilities.capabilities.bulkCollectionEditing` |
| `batchSpacing` | `true` | **active** | Intenção frequente e adequada a comando de grupo. | `CatalogCapabilities.capabilities.batchSpacing` |
| `batchSeparators` | `true` | **audit** | Candidato a ser opção da ação de espaçamento, não capacidade paralela. | `CatalogCapabilities.capabilities.batchSeparators` |
| `progressiveInspectorVocabulary` | `["content","layout","visual","advanced"]` | **active** | Precisa evoluir de abas por propriedade para continuidade de tarefa. | `CatalogCapabilities.capabilities.progressiveInspectorVocabulary` |
| `editorialTextControls` | `true` | **active** | Aprofunda o átomo canônico sem introduzir editor rico ou CSS arbitrário. | `CatalogCapabilities.capabilities.editorialTextControls` |
| `internalIconScale` | `true` | **active** | Separa escala visual interna da geometria externa do componente. | `CatalogCapabilities.capabilities.internalIconScale` |
| `distinctProductModes` | `true` | **active** | Faz os modos existentes cumprirem sua intenção visual sem criar tipos paralelos de card. | `CatalogCapabilities.capabilities.distinctProductModes` |

## Inventário de componentes

| Tipo | Categoria | Contêiner | Mínimo técnico | Recomendado |
| --- | --- | --- | --- | --- |
| `art` — Arte / logo | Elementos | não | 80×60 | 210×160 |
| `art-gallery` — Galeria de imagens | Estruturas | sim | 150×96 | 260×150 |
| `catalog-footer` — Rodapé | Estruturas | sim | 500×80 | 746×100 |
| `catalog-header` — Cabeçalho | Estruturas | sim | 420×110 | 730×150 |
| `data-table` — Tabela de dados | Peças internas | não | 180×32 | 300×48 |
| `footer-item` — Item do rodapé | Peças internas | sim | 80×64 | 112×96 |
| `icon` — Ícone | Elementos | não | 24×24 | 56×56 |
| `layout-container` — Área de composição | Estruturas | sim | 160×120 | 360×300 |
| `legend-group` — Grupo de legenda | Peças internas | sim | 140×38 | 320×54 |
| `legend-item` — Item de legenda | Peças internas | não | 72×24 | 96×30 |
| `legend-panel` — Painel de legenda | Estruturas | sim | 180×54 | 360×92 |
| `product-card` — Card de produto | Estruturas | sim | 220×190 | 270×220 |
| `separator` — Linha separadora | Elementos | não | 8×8 | 220×8 |
| `specification` — Especificação | Peças internas | não | 82×28 | 130×38 |
| `text` — Texto | Elementos | não | 80×34 | 260×80 |
| `title-symbol` — Título com símbolo | Peças internas | não | 140×32 | 260×38 |

