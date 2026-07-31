# Planejamento arquitetônico — Catálogo V1

## 1. Objetivo

Construir um compilador editorial de catálogos orientado a dados, com editor visual para revisão, correção e refinamento. Dados de produto, assets e intenção editorial são as entradas principais; página A4, cabeçalho, card, rodapé e peças internas são materializados como nós de uma árvore de composição importável e editável.

Um componente estrutural pode ser movido como unidade e aberto como um pequeno canvas com coordenadas locais, slots, grid próprio e regras de conteúdo. O produto começa sem backend, mas todo estado de domínio é serializável e preparado para pacote portátil, autoria por agente e integrações por contratos explícitos.

## 2. Princípios

1. **JSON é a fonte de verdade.** O HTML é apenas uma projeção do documento.
2. **Aparência usa tokens.** Cor, tipografia, raio e borda são selecionados na biblioteca.
3. **Componente é contrato.** Cada tipo declara defaults, limites, grid, propriedades, estilos, renderização e capacidade de conter filhos.
4. **Interação passa pelo store.** Drag, resize, seleção, slot e reordenação não alteram o domínio diretamente.
5. **Coordenadas são locais ao pai.** Mover um container não exige recalcular seus descendentes.
6. **Slots são semânticos.** Eles expressam intenção, compatibilidade e capacidade, não apenas posição visual.
7. **Canvas e conteúdo são separados.** Produto, preço e arte são vinculados por ID; apresentação e overrides permanecem explícitos no card.
8. **Incrementos preservam fronteiras.** Guias inteligentes e assets possuem módulos próprios; inventário e exportadores entram em etapas posteriores.
9. **Dados e intenção precedem geometria.** O agente escolhe conteúdo, agrupamento e apresentação; o compilador materializa IDs, frames e slots.
10. **Autonomia não inventa fatos.** Preferências ausentes usam defaults; preço, código e especificação ausentes são omitidos ou solicitados conforme o contrato.
11. **Pacotes externos não são confiáveis por padrão.** Importação valida schema, referências, arquivos e layout antes de substituir o documento.
12. **Uma definição alimenta todos os consumidores.** Manifestos declarativos de componentes, templates e tokens orientam interface, compilador, validador e kit de autoria.
13. **Disponibilidade não implica evolução.** A governança separa capacidades ativas, mantidas, auditadas, congeladas e pausadas.
14. **Preservar contrato não exige preservar mecanismo.** UI e implementação redundantes podem ser consolidadas com migração compatível.

## 3. Camadas

```text
Interface
├── Barra de ferramentas
├── Breadcrumb de contexto
├── Biblioteca filtrada
├── Inventário e subcatálogos
├── Canvas A4
├── Árvore de camadas
├── Biblioteca de artes
└── Inspetor

Aplicação
├── Normalização de CatalogSource
├── Compilação de CatalogGenerationPlan
├── Validação e reparos seguros
├── Importação de CatalogProjectPackage
├── Drag and drop
├── Movimento e resize
├── Entrada/saída de contexto
├── Inserção e substituição em slots
├── Reordenação de componentes e linhas
├── Vínculo por assetId
├── Vínculo tabular por rowIds
├── Vínculo de card por productId
├── Overrides locais por campo
├── Duplicação direcional
├── Reflow recursivo Auto/Manual (legado em auditoria)
├── Projeção de impressão A4 da página atual
└── Persistência local

Domínio
├── Fonte de catálogo
├── Plano editorial
├── Documento
├── Página
├── Componente recursivo
├── Produto e subcatálogo
├── Frame e constraints
├── Slot reference
├── Props
└── Referências de tokens

Infraestrutura
├── Kit de autoria versionado
├── Manifestos declarativos
├── Empacotador e importador portátil
├── IndexedDB de assets (local)
├── Snapshots, comandos e sinalização (futuros)
├── Storage remoto de assets (futuro)
├── Templates
├── Histórico de versões
└── Exportadores
```

## 4. Modelo do documento

```json
{
  "schemaVersion": "1.16.0",
  "id": "document-...",
  "activePageId": "page-1",
  "collections": [
    { "id": "assets", "itemType": "asset", "storagePolicy": "reference-only", "items": [] },
    { "id": "products", "itemType": "product", "storagePolicy": "document", "items": [] },
    { "id": "subcatalogs", "itemType": "subcatalog", "storagePolicy": "document", "items": [] },
    { "id": "templates", "itemType": "template", "storagePolicy": "document", "items": [] },
    { "id": "tableRows", "itemType": "table-row", "storagePolicy": "document", "items": [] },
    { "id": "colorLegends", "itemType": "color-legend", "storagePolicy": "document", "items": [] }
  ],
  "pages": [
    {
      "id": "page-1",
      "type": "page",
      "size": {
        "preset": "A4",
        "width": 794,
        "height": 1123,
        "unit": "px",
        "printWidth": "210mm",
        "printHeight": "297mm"
      },
      "grid": {
        "unit": 4,
        "majorEvery": 4,
        "safeMargin": 24
      },
      "children": []
    }
  ]
}
```

A sessão `editor` é opcional. O salvamento local pode preservar seleção, contexto, zoom, grid e painéis, mas a exportação autoral omite esse bloco. Na importação, defaults locais preenchem a sessão ausente sem modificar o contrato de domínio recebido.

### Impressão / PDF

A impressão não cria outro modelo de documento: `CatalogPrintExport` aciona o diálogo nativo sobre a projeção já renderizada da página atual. O CSS de impressão fixa A4 vertical, remove a escala de visualização e oculta controles editoriais. Separadores usam os mesmos átomos no canvas e no PDF; espessuras físicas em milímetros e `print-color-adjust: exact` evitam arredondamento subpixel e alteração de cor. `layout-container` conserva a subárvore, mas torna seu próprio envelope transparente, e outlines/box-shadows são neutralizados. Assim, JSON continua sendo a fonte de verdade e textos/SVGs podem permanecer vetoriais no PDF. Recursos de documento multipágina e sangria pertencem ao Incremento 06.

### Conteúdo repetível

Uma tabela não serializa linhas dentro do HTML nem duplica um array específico no componente. Ela guarda `collectionId` e uma sequência ordenada de `rowIds`:

```json
{
  "type": "data-table",
  "props": {
    "collectionId": "tableRows",
    "rowIds": ["table-row-1", "table-row-2"],
    "columns": [
      { "key": "code", "label": "Código", "role": "identifier", "align": "center", "width": 1, "format": null },
      { "key": "package", "label": "Embalagem", "role": "package", "align": "center", "width": 1.25, "format": null }
    ]
  }
}
```

Os valores ficam em `collections[].items[].metadata.values`. O store concentra colunas, inclusão, edição, remoção, reordenação e rastreamento de uso. A duplicação de uma tabela ou de uma subárvore cria novos itens de linha para impedir acoplamento acidental entre original e cópia. `metadata.legendKeys` vincula a chave da coluna à coleção `colorLegends`; a célula não copia a cor.

Legendas permanecem vinculadas à própria arte por `caption` e `captionPosition`; elas não dependem do blob nem alteram `assetId`.

### Binding de produto

Produtos usam `collections.products[].metadata.values`. O card conserva apenas o vínculo, a apresentação escolhida e as exceções locais:

```json
{
  "type": "product-card",
  "binding": {
    "productId": "product-1176",
    "templateId": "template-card-tecnico",
    "overrides": {
      "title": false,
      "specOne": false,
      "specTwo": false,
      "code": false,
      "package": false,
      "price": true,
      "assetId": false
    }
  },
  "presentation": {
    "templateId": "template-card-tecnico",
    "presetId": "product-technical",
    "mode": "technical",
    "density": "compact",
    "responsiveState": "auto",
    "overrides": {
      "arrangement": "stacked"
    }
  }
}
```

`presentation.mode` declara a prioridade editorial; não deve ser usado como
atalho para escolher orientação. `presentation.overrides.arrangement` aceita
`auto`, `horizontal` e `stacked`. O valor `auto` preserva o comportamento
histórico por breakpoint e mantém `variants` empilhado. Os valores explícitos
permitem, por exemplo, um card `technical` empilhado ou um card `variants` lado
a lado sem trocar conteúdo, IDs ou tipo.

Atualizar produto modifica somente os átomos e valores de tabela já existentes para campos sem override. A identidade do card, dos filhos e da linha permanece estável. Aplicar um template de apresentação é uma ação estrutural separada: pode materializar novos filhos e linhas internas, mas preserva a raiz, seu frame, número, produto e conteúdo.

Subcatálogos são itens da coleção `subcatalogs` e guardam apenas `metadata.productIds`; não duplicam produtos.

## 5. Contrato de componente

```json
{
  "id": "specification-...",
  "type": "specification",
  "name": "Especificação",
  "frame": {
    "x": 228,
    "y": 60,
    "width": 110,
    "height": 48
  },
  "constraints": {
    "minWidth": 82,
    "minHeight": 28,
    "minimums": {
      "technical": { "width": 82, "height": 28 },
      "recommended": { "width": 130, "height": 38 },
      "custom": null
    },
    "gridUnit": 1,
    "snapX": true,
    "snapY": true,
    "freeX": false,
    "freeY": false
  },
  "props": {
    "icon": "shield-star",
    "label": "Alta resistência"
  },
  "style": {
    "surface": "surface.paper",
    "border": "border.none",
    "radius": "radius.none",
    "accentColor": "brand.primary",
    "textColor": "text.primary",
    "typography": "type.label"
  },
  "slot": {
    "name": "specifications",
    "order": 0,
    "managed": true,
    "span": 1
  },
  "children": []
}
```

O `frame` é relativo ao componente pai. Na raiz da página, ele é relativo à folha A4.

## 6. Registro de tipos

O registro informa:

- nome e descrição;
- categoria na biblioteca;
- ícone;
- tamanho padrão e mínimo;
- unidade de grid;
- propriedades e estilos padrão;
- campos do inspetor;
- função de renderização;
- configuração opcional de container;
- filhos padrão opcionais.

Exemplo conceitual:

```js
{
  type: "product-card",
  container: {
    accepts: ["title-symbol", "art", "specification", "data-table"],
    slots: [
      { name: "title", capacity: 1, accepts: ["title-symbol"] },
      { name: "art", capacity: 1, accepts: ["art"] },
      { name: "specifications", capacity: 4, layout: "column" },
      { name: "table", capacity: 1, accepts: ["data-table"] }
    ]
  }
}
```

## 7. Coordenadas e A4

A folha usa uma unidade lógica em pixels CSS a 96 dpi:

- largura: `794 px` ≈ `210 mm`;
- altura: `1123 px` ≈ `297 mm`.

O zoom é uma transformação visual e nunca altera o frame persistido. Na impressão, a página volta para `210 × 297 mm`.

Para componentes aninhados:

```text
Página A4
└── Card em x=24, y=180
    └── Especificação em x=228, y=60
```

Mover o card modifica apenas o frame do card.

## 8. Grid hierárquico

### Página

- unidade base: 4 px;
- linha maior: 16 px;
- margem segura: 24 px.

### Componentes

Cada tipo declara `gridUnit`:

- estruturas: geralmente 4 px;
- arte e texto: 2 px;
- ícones e especificações: 1 px.

O grid de uma peça pequena não reduz a malha da página inteira. Cada interação consulta o grid do componente e o tamanho do pai.

## 9. Contexto de edição

Ao abrir um container:

- `editingContextId` recebe o ID do container;
- a biblioteca mostra apenas tipos aceitos;
- os filhos diretos tornam-se interativos;
- componentes externos ficam atenuados;
- o breadcrumb representa o caminho;
- movimento e resize usam o sistema local do container.

Fora do contexto interno, os filhos são apenas preview e o card recebe os eventos como unidade.

## 10. Slots e estruturas editoriais

Um slot declara:

- `name` e `label`;
- `capacity`;
- tipos aceitos;
- geometria calculada localmente;
- layout opcional.

A referência na instância filha contém:

- `name`: slot atual;
- `order`: ordem semântica;
- `managed`: se o motor local pode recalcular o frame;
- `span`: quantidade de unidades reservadas na capacidade do slot.

Quando o usuário move ou redimensiona manualmente uma peça, `managed` passa a `false`. O comando **Reajustar ao slot** restaura `managed: true`. A soma de `span` substitui a contagem simples de filhos; linha, coluna e grade distribuem a geometria conforme essa ocupação.

No schema `1.8.0`, todo contêiner também persiste `reflow.mode`. Em `auto`, o store estabiliza a subárvore em até quatro passagens, reaplica slots e auto-layout e atualiza irmãos afetados. Em `manual`, overrides internos são preservados. Antes de aceitar um resize, o store simula esse mesmo fluxo em uma cópia da subárvore e usa o mínimo resultante; assim, o frame do pai não atravessa cards compactos nem suas tabelas.

O Incremento 05.13 confirmou que esse contrato mistura duas autoridades: Auto preserva validade ao restaurar overrides descendentes, enquanto Manual preserva exceções ao interromper a recursão. A direção aceita é manter leitura compatível de `reflow.mode`, mas migrar o fluxo normal para **gerenciado**, **independente** e **reintegrar**. Recursão passa a ser responsabilidade interna; exceções locais devem permanecer duráveis sem desativar garantias da subárvore inteira.

O schema `1.9.0` acrescenta `structureInitialized`. A ausência ou valor falso permite hidratar uma estrutura legada uma única vez; depois de inicializada, remover todos os filhos de um tipo permanece uma decisão válida após reload. O inspetor compara a subárvore aos descritores de `defaultChildren` e oferece restauração explícita por slot e tipo.

Separadores contextuais usam `layoutItem.overlay: true` e guardam `beforeId`/`afterId`. O auto-layout os posiciona no intervalo do par, mas os exclui da distribuição e do cálculo de mínimo.

No Incremento 04.2, os três blocos principais são contêineres:

- `catalog-header`: slots `logo`, `kicker`, `title`, `rule` e `divider`;
- `product-card`: slots `title`, `art`, `specifications` e `table`;
- `catalog-footer`: slot coletivo `items`, com layout em linha e capacidade oito.

O rodapé usa moléculas `footer-item`, agora contêineres com slots `icon`, `title` e `subtitle`; o cabeçalho reutiliza `art`, `text` e dois átomos `separator`. Documentos antigos sem filhos ou sem as linhas atômicas são hidratados a partir das props legadas.

## 11. Snap e override

Incrementos 01 e 02:

- snap no grid do componente;
- override global com `Alt`;
- trava de movimento com `Shift`;
- flags independentes `snapX`, `snapY`, `freeX`, `freeY`;
- clamp no tamanho do pai;
- slots locais como destino de drop.

Incremento 03 entregue:

- bordas e centros de componentes irmãos;
- bordas, centro e margem segura do contêiner;
- guias magnéticas visuais;
- repetição de espaçamento antes ou depois de pares;
- tolerância configurável;
- auto-layout em linha, coluna e grid;
- mínimo calculado pelo conteúdo;
- regras responsivas por largura;
- override manual por filho.

Baseline tipográfica dedicada permanece fora do Incremento 03.

## 12. Inspetor orientado pela biblioteca

O inspetor é gerado a partir do registro e dos tokens:

- superfícies;
- cores semânticas;
- estilos tipográficos;
- bordas;
- raios;
- iconografia;
- conteúdo específico;
- slot e ordem;
- contexto pai;
- entrada/saída de container.

A interface agrupa esses controles em **Estrutura**, **Conteúdo** e **Visual**. **Componentes**, **Produtos** e **Camadas** ocupam abas exclusivas no painel esquerdo. O estado da aba é efêmero e não modifica o documento.

A aparência não depende de valores arbitrários na fase atual.

## 13. Workspace e duplicação

`app/workspace-layout.js` concentra a adaptação da interface:

- calcula a maior escala que mantém a A4 inteira dentro do viewport;
- reage a resize e ao recolhimento dos painéis;
- mantém a escala efetiva separada do zoom do navegador e dos frames lógicos;
- expõe a escala efetiva para conversão de ponteiro em coordenadas locais;
- intercepta `Ctrl/Cmd + roda` somente sobre o workspace e converte o gesto em zoom lógico manual.

O store duplica uma subárvore por valor, renova todos os IDs e insere a cópia ao lado da origem. Componentes livres recebem deslocamento simples de `16 px` ou uma série com direção, distância e modo `gap`/`offset`; slots e auto-layout são respeitados quando há capacidade. Linhas de tabela também recebem novos IDs.

No 05.0, a mesma fronteira recursiva sustenta **Meus componentes**. Um item da coleção `templates` contém um snapshot da raiz, seus descendentes e uma cópia semântica das linhas de tabela usadas. A inserção renova IDs, remapeia referências internas de separadores, materializa novas linhas e conserva `assetId` como referência — nunca duplica bytes.

## 14. Migração

A carga do documento executa normalização:

- aceita sessão `editor` ausente e aplica preferências locais no carregamento;
- completa defaults de componentes;
- garante `slot` e `children`;
- converte o schema para `1.16.0`;
- cria `numbering.cardNext` a partir da maior numeração válida dos cards legados;
- acrescenta `structureInitialized` e atomiza itens de rodapé legados;
- acrescenta `reflow.mode: "auto"` aos contêineres legados;
- hidrata os separadores horizontal e vertical ausentes em cabeçalhos legados;
- acrescenta `slot.span: 1` às referências legadas;
- acrescenta modo de zoom e estado dos painéis;
- normaliza as coleções `assets`, `products`, `subcatalogs`, `templates`, `tableRows` e `colorLegends`;
- acrescenta proveniência e aprovação conservadoras a assets legados, sem promovê-los para publicação;
- normaliza valores de produto, listas de `productIds`, binding e overrides dos cards;
- classifica templates existentes como snapshots autônomos ou apresentações de produto;
- acrescenta família, versão, apresentação e requisitos de asset aos templates;
- acrescenta colunas semânticas a tabelas e listas/roles do `CatalogSource` a produtos;
- separa mínimos técnico, recomendado e customizado;
- acrescenta `assetId`, ponto focal, texto alternativo, legenda e modo vetorial às artes;
- converte os campos legados de tabela em um item de `tableRows` e ordena a referência em `rowIds`;
- hidrata cabeçalho e rodapé monolíticos como estruturas compostas, preservando suas props;
- preserva `vectorColor` nos tipos compatíveis;
- acrescenta `layout` e `layoutItem`;
- hidrata cards antigos sem filhos usando as propriedades existentes;
- recalcula containers automáticos após a migração.

Migrações futuras deverão ser separadas por versão antes de persistência local ou importação de pacote.

## 15. Assets, dados e templates

O 03.1 introduziu a forma genérica de coleção. O 04 tornou funcional `assets`, o 05.0 tornou funcional `templates` sob o rótulo **Meus componentes**, e o 05.1 tornou funcionais `products` e `subcatalogs`. Cada coleção possui `id`, `itemType`, `storagePolicy` e `items`. Assets usam `reference-only`: guardam metadados e uma referência `bundled`, `indexeddb`, `remote` ou `package`, nunca bytes/base64.

```json
{
  "id": "asset-logo",
  "label": "Logo",
  "metadata": {
    "fileName": "logo.svg",
    "mimeType": "image/svg+xml",
    "size": 18420,
    "width": 640,
    "height": 240,
    "createdAt": "2026-07-13T12:00:00.000Z",
    "isVector": true,
    "provenance": {
      "origin": "provided",
      "role": "logo",
      "relatedProductIds": [],
      "sourceAssetIds": [],
      "method": "direct-upload",
      "fidelity": "product-faithful",
      "generator": null
    },
    "approval": {
      "status": "review-required",
      "publishAllowed": false,
      "reviewedAt": null
    }
  },
  "reference": { "provider": "indexeddb", "key": "asset-logo" }
}
```

`app/asset-storage.js` encapsula a persistência binária. `app/asset-library.js` valida formatos, extrai dimensões, registra metadados, apresenta a coleção antes da origem computador e hidrata previews por Object URL. O renderer continua declarativo: gera marcadores `data-asset-*`, e o controlador resolve os bytes após a projeção do documento.

O componente `art` mantém frame e slot ao trocar o vínculo. Suas propriedades incluem `assetId`, `fit`, `focalX`, `focalY`, `alt`, `caption`, `captionPosition` e `vectorMode`. SVG em `vectorMode: "token"` é usado como máscara e recebe `vectorColor`; nos demais casos as cores originais são preservadas.

`art-gallery` não cria um modelo paralelo de imagem: é um contêiner em grid cujos filhos continuam sendo átomos `art`. Assim, cada variação possui legenda, vínculo, fit e tokens próprios. A galeria pode ocupar o slot de arte de um card ou ser usada livremente em uma Área de composição.

Snapshots de **Meus componentes** continuam autônomos e preservam conteúdo atual. Quando o tipo raiz é `product-card`, o mesmo item também pode ser escolhido explicitamente como `product-presentation`; nesse caminho, a apresentação é aplicada ao card existente sem assumir a função de entidade de produto.

O binding entregue guarda referências explícitas:

```json
{
  "type": "product-card",
  "binding": {
    "productId": "product-1037",
    "templateId": "card-fixacao-v1",
    "overrides": { "title": false, "price": true }
  }
}
```

`app/product-catalog.js` concentra cadastro, edição, seleção e recortes. O store concentra integridade referencial, propagação granular, detach e aplicação de apresentação.

## 16. Fronteiras de integração futuras

O modelo serializável continua independente do HTML, mas uma API central de documentos deixou de ser a direção canônica. As fronteiras externas são pacotes, snapshots, manifestos, comandos versionados e sinalização efêmera. Nenhuma delas transforma o host estático ou o serviço de sinalização em fonte de verdade do catálogo.

Integrações futuras devem operar sobre contratos explícitos — por exemplo, validar um pacote, propor um asset ou transmitir um comando — sem pressupor autenticação, storage remoto ou persistência central. Exportação de PDF/XLSX continua preferencialmente no cliente enquanto for tecnicamente viável.

## 17. Estratégia de testes

- validação do schema;
- testes unitários de árvore, slot, clamp e migração;
- testes do armazenamento binário e formatos aceitos;
- smoke test do fluxo upload → IndexedDB → `assetId` → preview → reuso;
- testes de linhas ligadas a coleção, legenda e duplicação distribuída;
- testes de registro;
- smoke test em navegador;
- testes visuais por screenshot;
- impressão A4;
- reflow recursivo Auto/Manual e mínimo vertical estabilizado;
- comparação visual canvas×PDF de linhas finas;
- ausência da Área de composição e de outlines editoriais no PDF;
- colapso/restauração de tipos e separadores contextuais;
- snapshots reutilizáveis, materialização de dependências e renovação de IDs;
- numeração incremental, compactação confirmada e mudança do cursor editorial;
- galerias multiarte com legendas independentes;
- compatibilidade de versões.

## 18. Riscos controlados

- **Acoplamento com HTML:** mitigado pelo JSON como fonte de verdade.
- **Complexidade recursiva:** concentrada em funções de busca, contexto e renderização.
- **Quebra de documentos antigos:** mitigada por schema e normalização.
- **Estilos inconsistentes:** mitigados por tokens fechados.
- **Slots excessivamente rígidos:** mitigados por posição livre e `managed: false`.
- **Performance:** renderização integral continua aceitável no protótipo; diff parcial entra quando houver muitas páginas e nós.


## 19. Motor de layout

`app/layout-engine.js` concentra cálculos puros e reutilizáveis:

- `snapFrame`: alinha um frame e devolve guias semânticas;
- `contentMinimum`: calcula o mínimo recursivo de um componente;
- `effectiveMode`: resolve o modo principal ou responsivo;
- `applyAutoLayout`: grava frames locais de filhos gerenciados.

A interface não persiste Flexbox ou Grid CSS. O documento guarda intenção e frames calculados:

```json
{
  "layout": {
    "mode": "grid",
    "gap": 12,
    "padding": 12,
    "columns": 2,
    "responsive": {
      "enabled": true,
      "breakpoint": 300,
      "mode": "column"
    }
  },
  "children": [
    {
      "layoutItem": {
        "managed": true,
        "grow": 1,
        "span": 1
      }
    }
  ]
}
```

Mover manualmente um filho gerenciado altera apenas `layoutItem.managed` para `false`. A configuração do pai permanece intacta.

## 20. Guias inteligentes

As guias usam o sistema local do contexto aberto. Antes de desenhar no canvas A4, o renderer soma os offsets dos ancestrais. Isso mantém o mesmo motor para página e containers aninhados.

O resultado do cálculo é semântico:

```json
{
  "axis": "x",
  "type": "alignment",
  "value": 182,
  "anchor": "center",
  "source": "component-123"
}
```

O DOM é apenas responsável por representar a linha e o rótulo.

## 21. Autoria por agente e pacote portátil

O fluxo-alvo separa quatro contratos:

- `CatalogSource`: conteúdo factual e assets disponíveis;
- `CatalogGenerationPlan`: intenção editorial, agrupamentos, modos, densidade e fallbacks;
- `CatalogDocument`: árvore materializada e renderizável;
- `CatalogProjectPackage`: documento, assets, manifestos e relatório transportados juntos.

O JSON do documento continua sendo a fonte de verdade para renderização e edição. Ele deixa de ser, porém, a única interface de autoria externa. O caminho preferencial permite que o agente produza um plano mais semântico e use um compilador determinístico para gerar a árvore final.

O `CatalogAuthoringKit 1.5.2` contém guide, schemas, exemplos, runtime mínimo, receitas oficiais, presets de separador, atlas funcional, governança e compilador CLI; sua versão acompanha todo pacote. O compilador transforma `CatalogSource 1.1.0` e um plano explícito ou implícito em `CatalogDocument 1.16.0`, e o validador bloqueia colisões, overflow, vínculos semânticos quebrados e referências inválidas antes da saída. A interface importa ZIP portátil, documento JSON ou fonte semântica isolada, mantendo o ZIP como formato recomendado quando houver assets locais.

No 05.5, o plano padrão usa a estratégia `hero-grid`: um produto de destaque, grade 3×2, cabeçalho e rodapé. IDs, decisões, digests e geometria são determinísticos. A compilação é registrada como uma única mutação reversível no histórico; a geração pela interface requer três ações observáveis e não impede refinamentos posteriores no editor.

Desde o 05.2, estado efêmero como seleção, contexto aberto, aba ativa e zoom pertence a uma sessão local opcional. Ele não é obrigatório no schema autoral nem aparece no JSON exportado para outro agente.

Detalhes normativos estão em:

- `PRODUCT-DEFINITION.md`;
- `LLM-CATALOG-AUTHORING-FLOW.md`;
- `ASSET-AUTHORING-POLICY.md`;
- `ADR-014-agent-authored-portable-catalogs.md`;
- `ADR-015-risk-based-asset-generation.md`.
- `ADR-016-portable-package-integrity.md`.
- `ADR-017-semantic-source-presentations-and-gates.md`;
- `ADR-018-deterministic-editorial-compilation.md`;
- `ADR-019-compound-manual-operations.md`;
- `ADR-020-contextual-multi-selection.md`.

## 22. Histórico transacional e importação segura

O store mantém até 100 snapshots do domínio, excluindo `editor` e `updatedAt`. Mutações relacionadas — como digitação consecutiva no mesmo campo — podem ser agrupadas por uma janela curta. Desfazer restaura o domínio e conserva preferências locais válidas; uma nova alteração depois de desfazer elimina a pilha de refazer. O estado sujo é derivado pela comparação com o último snapshot explicitamente salvo.

A importação JSON possui duas fases. A análise lê e migra uma cópia em memória, valida versão, tipos, IDs, frames e referências e produz um relatório sem efeitos colaterais. Apenas um documento sem erros pode ser confirmado; então o commit substitui o domínio como uma única ação reversível. Falha, cancelamento ou arquivo malformado nunca alteram o documento aberto.

O JSON isolado transporta metadados e referências, não bytes armazenados no IndexedDB. Dependências locais ausentes geram avisos e placeholders. Desde o 05.3, o `CatalogProjectPackage` é o caminho recomendado quando existem assets.

## 23. Pacote portátil, integridade e manifestos

`CatalogProjectPackage 1.0.0` é um ZIP inspecionável com esta raiz lógica:

```text
catalog-project.json
document/catalog.json
assets/*
manifests/catalog-capabilities.json
reports/export-report.json
authoring-kit/*
```

O documento dentro do pacote troca referências locais por `provider: "package"` e caminhos relativos seguros. O manifesto raiz declara política, versões, documento, capacidades, kit, relatório, assets e todos os arquivos. Cada arquivo declarado possui role, MIME, tamanho e SHA-256; assets também carregam proveniência, fidelidade e aprovação.

Antes da descompactação, o preflight lê somente o diretório central e bloqueia path traversal, caminhos absolutos, duplicatas, criptografia, métodos desconhecidos, ZIP64, excesso de entradas e limites comprimido/descompactado. Depois da descompactação, tamanho, hash e MIME por assinatura são verificados. Arquivos não declarados são ignorados com aviso.

O commit cria chaves locais novas e persiste todos os blobs em um único lote. Somente depois substitui o documento e converte referências para `indexeddb`. Falha anterior à substituição remove o lote; o documento aberto permanece intacto. A substituição continua sendo uma ação única de histórico.

`CatalogCapabilities 1.0.0` é derivado do registro runtime e enumera componentes, slots, campos, tokens, ícones, apresentações, templates, receitas, presets de separador e capacidades entregues. `CatalogAuthoringKit 1.5.2` acrescenta inventário funcional gerado, guia curado por intenção e `feature-governance.json`, mantendo o manifesto como fonte técnica. Desde o 05.5, o pacote pode carregar `source/catalog-source.json` e `plan/catalog-generation-plan.json`; o mesmo compilador determinístico usado pela interface também está disponível no kit, reduzindo divergência entre autoria externa e projeção visual.

## 24. Operações compostas da edição manual

O 05.6 acrescenta uma fronteira transacional para repetições manuais previsíveis. `runCompoundChange` suspende capturas intermediárias de histórico, executa as operações unitárias existentes e registra somente o estado final. Em falha, o estado completo anterior é restaurado e nenhuma entrada parcial permanece no histórico.

Essa fronteira sustenta três comandos iniciais:

- criar vários produtos a partir de dados tabulares colados;
- criar, organizar e vincular cards a uma seleção explícita de produtos;
- substituir ou acrescentar várias linhas à tabela selecionada.

Os comandos materializam as mesmas entidades, componentes, bindings e linhas usados pela edição unitária. Não existe um schema alternativo de “lote”. Depois do commit, cada item volta a ser editável individualmente.

Métricas de geração automatizada e construção manual são coletadas separadamente. Um compilador em três ações não é evidência de que o editor manual ficou mais eficiente.

## 25. Seleção contextual e mutações de conjunto

O 05.7 preserva `selectedComponentId` como seleção primária e acrescenta `selectedComponentIds` à sessão efêmera. A migração sempre normaliza o array, mas ele continua opcional no contrato serializável e não aparece no JSON autoral. O renderer deriva o destaque de um conjunto de IDs; componentes e documentos não recebem estado visual persistente.

Uma seleção múltipla válida contém somente irmãos. Essa restrição evita converter frames entre páginas, slots ou sistemas locais distintos e torna alinhamento/distribuição determinísticos. `Ctrl/Cmd+A` usa os filhos diretos de `editingContextId`, ou os componentes raiz quando a página é o contexto.

Comandos em lote reutilizam as mutações unitárias dentro de `runCompoundChange`. O store aplica somente propriedades declaradas pelo registro de cada tipo, elimina cards duplicados ao resolver uma apresentação e emite um único evento final para o histórico. Geometria explícita marca itens de slot ou auto-layout como livres; reintegração permanece uma ação posterior consciente.

## 26. Receitas oficiais e inserção contextual

O 05.8 introduz um registro imutável de receitas em `section-recipes.js`. Uma receita declara ID, versão, contextos aceitos, snapshot de componente e um `focusRole` opcional. O snapshot usa os mesmos tipos, frames, props, slots e filhos do `CatalogDocument`; depois de inserido, deixa de ter comportamento especial e pode ser editado como qualquer outra subárvore.

Receitas oficiais e templates salvos pelo usuário compartilham o caminho de clonagem, renovação de IDs, hidratação e histórico, mas permanecem coleções conceitualmente separadas. Assim, atualizar o conjunto oficial não sobrescreve itens de **Meus componentes** e nenhum identificador de receita é persistido como dependência obrigatória do documento.

`insertComponent` e `insertComponentFromTemplate` representam a intenção de inserção sem coordenada explícita. Em contêineres com slots, o store escolhe o primeiro slot compatível com capacidade; em contexto livre, executa uma busca determinística alinhada ao grid pelo primeiro frame sem interseção. Quando não existe encaixe seguro, a operação falha com mensagem no status em vez de criar sobreposição silenciosa. Drag and drop continua sendo o caminho para coordenadas intencionais.

A página-base declara `primary-content` como papel de foco. Após o commit atômico, seleção e contexto efêmeros apontam para esse descendente; criação em lote de cards e ações subsequentes passam a atuar ali sem navegação adicional.

## 27. Ações contextuais e composição em lote

O 05.9 acrescenta `getContextualActions` e `performContextualAction` como fronteira entre intenção de interface e mutações do store. A paleta consulta ações válidas para a seleção e não persiste esse menu no documento. A linha de tabela reutiliza a coleção semântica existente. A conversão de arte envolve a mesma instância em um `art-gallery`, preservando ID, asset, props e posição do componente original.

`spaceComponents` aceita somente irmãos e executa uma transação composta. Quando todos os filhos gerenciados de um layout `row` ou `column` compatível estão selecionados, o gap é aplicado no pai e o layout é recalculado. Caso contrário, o comando converte os selecionados em frames manuais e distribui a partir da primeira peça. Separadores opcionais são overlays ignorados pelo cálculo de ocupação, mas continuam presentes na árvore e no PDF.

Presets de separador pertencem ao registro declarativo e são publicados no manifesto. O inspetor interpreta Conteúdo, Layout e Visual como categorias de controles; Avançado é somente divulgação de campos técnicos, não um modo distinto do modelo.

## 28. Variantes semânticas e legendas visuais

O 05.10 mantém variantes em `products[].metadata.variants` e linhas comerciais em `commercialRows`, ligadas por IDs nos dois sentidos. Representações guardam `variantId` e `sourceRowId`; duplicação e snapshots preservam esses vínculos, sem transformar galeria ou tabela em fonte primária dos fatos.

Legendas permanecem na coleção `colorLegends`. A árvore `legend-panel → legend-group → legend-item` é somente a projeção visual: cada item guarda `legendKey` e resolve rótulo/token no momento da renderização. A mesma chave é usada pelas células. Assim, trocar um token atualiza todas as projeções e uma referência ausente recebe fallback/diagnóstico explícito.

## 29. Operação local-first e colaboração browser-only

O host da aplicação entrega arquivos estáticos e não recebe catálogos. O IndexedDB sustenta sessão e desempenho, mas backup e transferência usam pacotes/snapshots explícitos. O hoster que abre uma sala mantém o documento autoritativo em sua aba e é o único papel capaz de importar ou substituir o projeto inteiro.

Colaboradores começam como visualizadores. Edição concedida transmite comandos versionados para validação e serialização pelo hoster; assets, componentes e produtos externos entram como propostas, não como substituição de raiz. Apelidos e IDs efêmeros servem ao log operacional, sem alegar identidade autenticada.

A sala usa WebRTC direto com sinalização efêmera que nunca persiste documento, asset ou histórico. O protótipo não inclui TURN: falha de conectividade encerra a tentativa de sala com explicação e oferece snapshot manual. Essa limitação não pode afetar abrir, editar, salvar, exportar ou recuperar o projeto local.

O protocolo colaborativo é posterior aos snapshots e deve preservar as fronteiras transacionais do store. Não haverá CRDT, eleição automática de novo hoster ou merge silencioso no primeiro corte. A decisão completa e suas consequências estão em `ADR-024-browser-local-first-collaboration.md`.
