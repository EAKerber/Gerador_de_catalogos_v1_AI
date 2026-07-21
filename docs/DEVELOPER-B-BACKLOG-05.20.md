# Developer B — backlog 05.20

## Origem

Este backlog deriva exclusivamente do benchmark DB-05.20.1, executado contra uma peça promocional diferente da referência original.

Não autoriza merge nem altera as decisões base do projeto. O objetivo do ciclo é reduzir esforço, melhorar confiança de edição e esclarecer limites de representação antes de adicionar novos tipos.

## Princípios

1. Corrigir problemas observados antes de ampliar a biblioteca.
2. Preservar os 16 tipos e as sete receitas enquanto não houver evidência contrária.
3. Tratar efeitos gráficos complexos como assets quando não exigirem comportamento editável próprio.
4. Medir redução de ações, não apenas existência de controles.
5. Manter exportação, reimportação, impressão e histórico como gates bloqueantes.

## Incrementos propostos

### DB-05.20.1 — Benchmark de generalização promocional

**Estado:** concluído.

Resultado `pass-with-findings` no run `29875259956`:

- 221 ações;
- 59 componentes;
- quatro ofertas;
- zero colisões;
- zero overflows;
- exportação/reimportação equivalentes;
- PDF A4 gerado;
- nenhum bloqueador final.

### DB-05.20.2 — Hit testing e seleção de peças internas

**Prioridade:** P1 — correção imediata.

Reproduzir e corrigir o caso em que clicar numa `specification` ou num `icon` interno abre a biblioteca de artes.

Escopo:

- identificar o elemento que recebe o pointer event;
- medir caixas e z-index de arte, trigger e irmãos;
- limitar a área clicável de `data-open-asset-library` ao frame efetivo da arte;
- garantir que contexto interno priorize seleção de filhos editáveis;
- preservar o clique intencional no placeholder de arte;
- testar card `variants`, `technical`, `hero` e `data-only`;
- validar mouse, teclado, Camadas, tela e impressão.

Critério de aceite:

- cem seleções alternadas de arte, especificação e ícone sem abertura indevida de diálogo;
- clique no placeholder de arte continua abrindo a biblioteca;
- nenhuma mudança de schema ou geometria externa.

### DB-05.20.3 — Diagnóstico da referência ausente

**Prioridade:** P1.

O relatório final marcou `missingReferences: 1` apesar de modelo, DOM e round-trip íntegros.

Escopo:

- registrar a referência e o componente de origem no relatório de publicação;
- distinguir asset ausente, coleção ausente, binding ausente e referência opcional;
- confirmar se `assetId: null` deve ou não participar da contagem;
- repetir o documento promocional com e sem assets.

Critério de aceite:

- o relatório identifica precisamente a referência;
- placeholders deliberados não são confundidos com corrupção;
- referências obrigatórias continuam bloqueantes.

### DB-05.20.4 — Fronteiras da coalescência de histórico

**Prioridade:** P2.

Três edições em tarefas/componentes diferentes foram revertidas em dois passos, embora undo e redo tenham preservado o estado exato.

Escopo:

- registrar chaves e timestamps de coalescência em teste diagnóstico;
- verificar se seleção, troca de contexto ou edição de outro componente encerra a janela anterior;
- preservar coalescência de digitação no mesmo campo;
- impedir agrupamento entre tarefas visualmente distintas.

Critério de aceite:

- digitação contínua no mesmo campo permanece uma ação;
- edição em outro componente inicia nova unidade;
- troca de contexto inicia nova unidade;
- benchmark final usa três passos para três tarefas distintas.

### DB-05.20.5 — Aplicação conjunta de frame

**Prioridade:** P2 — maior oportunidade de redução de esforço.

O benchmark exigiu 44 ações separadas para `x`, `y`, largura e altura.

Escopo inicial:

- permitir editar os quatro valores e aplicar em uma única ação;
- oferecer presets “topo seguro”, “base segura”, “coluna esquerda”, “coluna principal” e “faixa total” como sugestões, não travas;
- reutilizar `CatalogManualEntry` quando possível;
- manter snap e mínimos técnicos;
- uma aplicação deve gerar uma entrada de histórico.

Meta:

- reduzir a geometria do benchmark de 44 para no máximo 18 ações;
- reduzir o total de 221 para menos de 180 sem automatizar conteúdo.

### DB-05.20.6 — Arranjo promocional de alto nível

**Prioridade:** P2, condicionado ao DB-05.20.5.

Avaliar um comando ou receita de página que crie apenas a estrutura espacial inicial de uma promoção:

- identidade e heading no topo;
- coluna de argumentos/facts;
- região principal de produto;
- região técnica/callout;
- benefícios;
- rodapé.

Restrições:

- não criar novo tipo;
- não preencher conteúdo comercial fictício;
- manter cada peça independente;
- tratar a composição como receita removível e editável.

A promoção do benchmark deve continuar reproduzível manualmente; a receita serve para medir redução de ações, não para esconder limitações.

### DB-05.20.7 — Legibilidade de benefícios e callout

**Prioridade:** P3.

Melhorar representação em blocos estreitos sem alterar semântica:

- rótulos de benefício com wrap controlado ou duas linhas;
- tamanho mínimo recomendável para ícone + rótulo;
- callout com preset amplo e compacto explicitamente diferenciados;
- validação de tela e PDF;
- nenhuma dependência da moldura de `layout-container` na impressão.

### DB-05.20.8 — Benchmark com assets reais

**Prioridade:** P3, depois das correções P1/P2.

Reexecutar a promoção com:

- logo;
- foto/render do produto;
- desenho técnico;
- asset composto opcional para personagem, megafone e faixas.

Medir:

- tempo de importação e vinculação;
- fidelidade de crop/foco;
- persistência no pacote de projeto;
- PDF;
- diferença entre asset composto e reconstrução nativa.

## Ordem recomendada

1. DB-05.20.2 — seleção/hit testing.
2. DB-05.20.3 — referência ausente.
3. DB-05.20.4 — coalescência de histórico.
4. DB-05.20.5 — frame conjunto.
5. Reexecutar DB-05.20.1 e medir redução de falhas e ações.
6. Decidir sobre DB-05.20.6.
7. Refinar legibilidade e executar benchmark com assets.

## Gates do ciclo

Nenhum incremento pode ser considerado concluído se introduzir:

- erro de página ou console;
- divergência modelo × DOM;
- perda em exportação/reimportação;
- undo/redo não reversível;
- colisão ou overflow não presentes no benchmark anterior;
- mudança de schema;
- promoção acidental de receita para tipo;
- dependência nova no compilador sem espelho no AuthoringKit.
