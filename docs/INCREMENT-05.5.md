# Incremento 05.5 — Plano editorial, compilador e validação geométrica

## Resultado

O fluxo principal deixa de exigir a montagem manual da página. Um `CatalogSource 1.0.0` pode ser importado diretamente; o editor cria ou normaliza um `CatalogGenerationPlan 1.0.0`, materializa o `CatalogDocument 1.15.0`, apresenta o diagnóstico e aplica todo o resultado como uma única transação reversível.

O ensaio manual da referência havia exigido 319 ações. O 05.5 acrescenta um caminho automatizado separado que materializa os mesmos 7 produtos e 16 linhas comerciais em 3 ações de interface:

1. abrir **Importar**;
2. escolher o `CatalogSource`;
3. confirmar **Gerar catálogo**.

Essa diferença mede automação da criação, não melhoria da construção manual. O caminho manual permanece disponível para revisão e exceções e passou a ter métrica própria a partir do 05.6.

## Contratos entregues

- schema `CatalogGenerationPlan 1.0.0`;
- estratégias determinísticas `hero-grid` e `grid-only`;
- plano automático quando o arquivo de plano não é fornecido;
- diretivas por produto para papel, preset, modo e densidade;
- políticas explícitas para overflow, asset ausente e reparo seguro;
- metadados de geração no documento: versões, digests, estratégia, plano, decisões e reparos;
- plano preservado separadamente em `plan/catalog-generation-plan.json` no pacote portátil;
- `CatalogAuthoringKit 1.1.0` com compilador CLI e runtime autocontido.

## Compilador

O compilador:

- preserva IDs factuais de produtos;
- gera IDs estáveis de páginas, componentes e linhas comerciais;
- escolhe cabeçalho, hero, grade e rodapé pela estratégia;
- materializa bindings sem copiar fatos para um modelo paralelo;
- converte produtos com variantes em galerias legendadas;
- preserva de 1 a 12 linhas comerciais por produto;
- aplica destaque sem asset por placeholder e registra a decisão;
- produz o mesmo documento para a mesma fonte e plano;
- bloqueia capacidade acima da matriz declarada no plano; o default é um hero e seis cards enquanto a paginação não estiver disponível.

Uso no kit:

```bash
node compiler/compile-catalog.js \
  --source examples/reference-catalog-source.json \
  --output catalog.json \
  --report catalog.report.json
```

## Validação

O `CatalogDocumentValidator` cobre quatro níveis:

- estrutural: tipos, IDs e frames;
- referencial: produtos, linhas e assets;
- editorial: título e valores comerciais ausentes;
- visual: componentes fora da página, filhos fora do pai e colisões não autorizadas.

Colisão, clipping e overflow geométrico bloqueiam a compilação e o pacote. Overlap intencional continua possível somente quando declarado por `layoutItem.overlay` ou `props.allowOverlap`.

Reparos automáticos estão limitados a clamp de até 2 px causado por arredondamento. O compilador não move blocos editoriais, remove conteúdo, altera valores comerciais nem escolhe fatos para fazer um documento passar no gate.

## Densidade editorial

- mínimo técnico do card reduzido de 270 para 220 px de largura;
- recomendado inicial de 270×220 px;
- tabela compacta com header de 16 px e linhas de 20 px;
- geometria compacta de título, arte, especificações e tabela recalculada em conjunto;
- galeria de até cinco variações em uma linha quando o espaço permitir;
- itens do rodapé passam a usar mínimo técnico coerente com título e complemento atomizados.

A referência cabe em três colunas reais, sem sobreposição horizontal, vertical ou com o rodapé.

## Interface

O importador distingue automaticamente:

- `CatalogDocument`: analisar, migrar e importar;
- `CatalogSource`: planejar, compilar, validar e gerar;
- `CatalogProjectPackage`: verificar pacote, hashes e assets.

O preview de `CatalogSource` mostra páginas, componentes, produtos, linhas, ações, colisões e overflow antes do commit. A geração entra no histórico como **Gerar catálogo por dados** e pode ser desfeita com `Ctrl/Cmd+Z`.

## Compatibilidade e schema

- `CatalogDocument` sobe para `1.15.0`;
- `generation` é opcional, portanto documentos manuais continuam válidos;
- documentos anteriores migram sem inventar plano retroativo;
- `CatalogSource 1.0.0` recebe os campos opcionais e compatíveis `tableColumns` e `commercialRows`;
- `CatalogProjectPackage 1.0.0` recebe o descritor opcional `generationPlan`;
- `CatalogAuthoringKit` sobe para `1.1.0`.

## Limites deliberados

- paginação e balanceamento entre páginas continuam no Incremento 06; `grid-only` pode ampliar a matriz de uma única página quando a geometria passar no gate;
- o plano inicial materializa uma família oficial de página, não um sistema aberto de templates de página;
- reflow automático de uma página já editada manualmente continua diferente de recompilar a partir da fonte;
- aplicações, legenda global e callout ainda não possuem moléculas dedicadas;
- assets não são gerados pelo compilador; a política Assistida continua decidindo reuse, placeholder, solicitação ou geração externa.

## Verificação

- compilação determinística repetida byte a byte;
- fonte de referência com 7 produtos, 16 linhas e galerias nos cards 04 e 07;
- zero colisões e zero overflow no relatório;
- gate negativo com colisão artificial;
- bloqueio de capacidade excedida;
- importação no navegador em três ações;
- geração de PDF A4 real a partir da página compilada;
- `Ctrl+Z` recuperando o documento anterior;
- schema de documento, fonte, plano e pacote;
- suíte unitária e suíte completa de navegador legadas.
