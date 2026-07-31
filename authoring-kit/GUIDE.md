# CatalogAuthoringKit 1.6.0

Este kit descreve o que o Catálogo V1 aceita e como entregar um projeto importável. Ele é destinado a agentes/LLMs e também pode ser editado manualmente.

## Resultado deste incremento

Produza um `CatalogProjectPackage` ZIP contendo:

- `catalog-project.json`: manifesto raiz;
- `document/catalog.json`: `CatalogDocument` materializado;
- `source/catalog-source.json`: inventário semântico normalizado;
- `plan/catalog-generation-plan.json`: decisões editoriais normalizadas quando o documento foi compilado;
- `assets/*`: um arquivo para cada referência portátil;
- `manifests/catalog-capabilities.json`: tipos, slots, tokens, ícones e capacidades usados;
- `reports/export-report.json`: decisões, avisos e pendências;
- `authoring-kit/*`: versão do contrato usada na geração.

O ZIP é o formato recomendado quando existem assets. JSON isolado permanece aceito como escape hatch e não transporta bytes.

## Ordem de trabalho para um agente

1. Leia `feature-guide.json`, `feature-inventory.json`, `feature-governance.json`, `capabilities.json` e os schemas; use o guia para escolher a intenção, o inventário para resolver IDs/limites e a governança para distinguir recursos ativos, mantidos, auditados, congelados ou pausados.
2. Normalize somente fatos fornecidos; nunca invente preço, código, medida, embalagem ou especificação.
3. Normalize produtos em `CatalogSource 1.1.0`, preservando atributos, destaques, aplicações, variantes, linhas comerciais vinculadas, legendas agrupadas e papéis de assets.
4. Crie um `CatalogGenerationPlan 1.0.0` apenas quando precisar sobrescrever o plano padrão `hero-grid`; caso contrário, deixe o compilador decidir.
5. Execute `compiler/compile-catalog.js` para materializar componentes, slots, frames e bindings determinísticos.
6. Revise o relatório e corrija todo erro estrutural, referencial, editorial ou geométrico antes de empacotar.
7. Use a política de assets `assisted` quando o usuário não indicar outro modo.
8. Gere o documento sem o bloco opcional `editor`.
9. Guarde imagens em arquivos do pacote e use `reference.provider = "package"` com o caminho correspondente.
10. Calcule tamanho e SHA-256 de todos os arquivos declarados.
11. Registre proveniência, fidelidade e aprovação de cada asset.
12. Exporte como `draft` durante revisão; use `publication` somente após o gate aprovar requisitos, geometria e assets.
13. Valide o pacote antes da entrega.

## Compilar

Com plano automático:

```bash
node compiler/compile-catalog.js \
  --source examples/reference-catalog-source.json \
  --output catalog.json \
  --report catalog.report.json
```

Com plano explícito:

```bash
node compiler/compile-catalog.js \
  --source examples/catalog-source.json \
  --plan examples/catalog-generation-plan.json \
  --output catalog.json \
  --report catalog.report.json
```

A mesma fonte e o mesmo plano produzem os mesmos IDs, frames e bindings. O compilador não inventa fatos e bloqueia capacidade excedida, colisão, clipping e referências estruturais inválidas.

## Assets e fatos

Prioridade: fornecido → oficial → derivação segura → geração não factual → fallback → placeholder → pergunta bloqueante.

- produto gerado do zero permanece `draft-only`;
- desenho técnico só nasce de medidas confirmadas;
- migração ou importação nunca promovem aprovação ausente;
- `publish-ready` exige decisão explícita e `publishAllowed: true`;
- base64 não pertence ao documento ou ao manifesto.

## Edição permissiva

Os arquivos são JSON/Markdown comuns. O agente deve preferir `CatalogSource → CatalogGenerationPlan → compilador`; edição direta do documento continua sendo um escape hatch validado. O editor também aceita um `CatalogSource` diretamente e aplica o plano padrão em três ações de interface.

## Atlas de funcionalidades

`feature-inventory.json` é gerado a partir do manifesto e enumera toda capacidade, componente, campo, slot, receita, apresentação, preset de separador, token e ícone. `feature-guide.json` é curado por intenção e informa acesso na interface, pré-condições, resultado, exemplo, limites e contratos relacionados. `feature-governance.json` registra foco e ciclo de vida sem declarar indisponível um contrato apenas por sua expansão estar congelada.

Use o guia para decidir **o que fazer**, o inventário para descobrir **com quais IDs e restrições** e a governança para evitar depender de uma frente pausada ou em consolidação. O build falha quando guia ou governança divergem das capacidades; não edite o inventário gerado manualmente.

## Governança subtrativa

O foco atual é usabilidade, fidelidade e confiabilidade. Expansão multimídia, plataforma online, colaboração, touch/mobile completo e workflow de publicação estão congelados para desenvolvimento. Isso não remove a leitura nem o uso dos contratos existentes.

Uma capacidade `audit` pode ser usada, mas seu acesso ou vocabulário pode mudar em versão posterior. Uma capacidade `frozen` permanece compatível, sem novos formatos ou fluxos. `multiplePages` permanece `paused`. Ações compostas futuras devem reutilizar o compilador e materializar componentes normais, sem introduzir outro modelo de documento.

## Receitas oficiais e autoria manual

`capabilities.json.recipes` declara composições oficiais reutilizáveis. Cada receita informa contexto aceito, tipo raiz e, quando aplicável, o papel que deve receber foco após a inserção. As receitas materializam componentes normais e editáveis; não criam um segundo schema nem impedem ajustes posteriores.

Na interface, o botão `+` insere componentes, receitas e itens salvos no primeiro slot compatível ou no primeiro espaço livre do contexto. Arrastar continua disponível quando o ponto exato faz parte da intenção.

## Ações contextuais e composição em lote

O botão `+` também expõe ações compatíveis com a seleção atual. Em uma tabela, ele adiciona uma linha sem exigir navegação pelo inspetor. Em uma arte, cria uma galeria editável preservando a imagem original e adicionando a primeira variação. Dentro da galeria, adiciona outra arte com legenda própria.

Quando um contêiner compatível está selecionado, `+` insere dentro dele e abre esse contexto. No arraste, o destino padrão é o contêiner compatível mais profundo sob o ponteiro. Use `Shift` para ignorar o alvo interno e inserir sobre o contexto atualmente aberto. Em uma tabela vinculada a produto, **Variação do produto** cria em uma única ação a entidade semântica, a linha comercial ligada e uma imagem com legenda; não simule essa relação duplicando apenas a linha visual.

Seleções irmãs no mesmo contexto podem receber alinhamento, distribuição, equalização, valores exatos, deltas, espaçamento uniforme por eixo e separadores editáveis. `capabilities.json.separatorPresets` descreve os presets oficiais; o resultado continua composto por átomos `separator`, sem introduzir um formato paralelo. A precisão geométrica do conjunto é uma superfície central; mínimos, restrições e diagnóstico solicitado/resolvido continuam progressivos.

## Linguagem editorial 1.6

O átomo `text` mantém conteúdo simples e declarativo. `align`, `verticalAlign`, `scale` e `overflow` controlam composição sem HTML ou CSS arbitrário. Use somente os valores publicados no manifesto. `iconScale` controla a escala interna de `icon` e `specification` sem alterar seus frames.

Os modos de `product-card` têm prioridade visual real: `standard` equilibra, `hero` amplia arte e título, `technical` amplia especificações, `variants` prioriza galeria e legendas e `data-only` maximiza a região informativa. Todos preservam a mesma subárvore, bindings, tabela e IDs.

Modo editorial e arranjo são decisões distintas. Use `presentation.overrides.arrangement` com `auto`, `horizontal` ou `stacked`. `stacked` representa explicitamente **arte acima → especificações abaixo**, inclusive em `standard` ou `technical`; `horizontal` mantém as duas regiões lado a lado, inclusive em `variants`. `auto` preserva o comportamento histórico: empilha em cards compactos e em `variants`, usando lado a lado nos demais cards amplos. Não escolha `variants` apenas para obter geometria vertical.

## Variantes e legendas vinculadas

Use `variants[].commercialRowIds` e `commercialRows[].variantId` para expressar identidade, sem inferir vínculos pela posição. Cada linha exportada possui `id`. `legends[]` define chave, token e grupo; células e componentes `legend-item` guardam apenas `legendKey`. A interface pode materializar galeria, linha e painel automaticamente, mas as entidades semânticas continuam válidas sem suas representações.

## Limites 1.6.0

- pacote comprimido: 100 MB;
- arquivo individual: 25 MB;
- conteúdo descompactado: 150 MB;
- até 1024 entradas;
- imagens: SVG, PNG, JPEG e WebP;
- uma página A4 por documento nesta fase.
- estratégia padrão: um hero e até seis cards em grade `3×2`; capacidade superior é bloqueada até a paginação do Incremento 06.
