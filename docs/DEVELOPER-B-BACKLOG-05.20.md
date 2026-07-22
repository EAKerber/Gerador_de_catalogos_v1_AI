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
6. Distinguir defeito de produto de erro ou ambiguidade do harness antes de alterar runtime.

## Incrementos

### DB-05.20.1 — Benchmark de generalização promocional

**Estado:** concluído e corrigido.

Resultado `pass-with-findings` no run `29883102904`:

- 219 ações;
- 59 componentes;
- quatro ofertas;
- zero colisões;
- zero overflows;
- três tarefas finais revertidas/refeitas em três passos;
- exportação/reimportação equivalentes;
- PDF A4 gerado;
- nenhum bloqueador final;
- único finding emitido: três assets deliberadamente ausentes no runner.

### DB-05.20.2 — Hit testing e seleção de peças internas

**Estado:** concluído como correção de harness, sem mudança de runtime.

O finding inicial não era causado por `specification`, `icon`, z-index ou sobreposição. O diálogo já estava aberto depois de um clique intencional no placeholder de arte. Como a arte já estava selecionada, o helper antigo encerrou cedo e deixou o modal ativo.

Correção:

- seleção de `art` para edição passa pela árvore de Camadas;
- clique no placeholder permanece reservado à escolha/substituição de asset;
- seleções não-art continuam no canvas;
- diálogo residual é diagnosticado explicitamente.

Validação no run `29883102906`:

- quatro modos do card;
- oito cenários detalhados;
- quatro aberturas intencionais da biblioteca;
- 100 alternâncias entre arte, especificação e ícone;
- zero falhas;
- zero erros de página ou console;
- schema e geometria externa inalterados.

### DB-05.20.3 — Diagnóstico da referência ausente

**Estado:** ativo.

**Prioridade:** P1.

O relatório final marcou `missingReferences: 1` apesar de modelo, DOM e round-trip íntegros.

Escopo:

- registrar a referência e o componente de origem no relatório de publicação;
- distinguir asset ausente, coleção ausente, binding ausente e referência opcional;
- confirmar se `assetId: null` deve ou não participar da contagem;
- repetir o documento promocional com e sem assets;
- preservar a contagem resumida para compatibilidade.

Critério de aceite:

- o relatório identifica precisamente cada referência;
- placeholders deliberados não são confundidos com corrupção;
- referências obrigatórias continuam bloqueantes;
- `missingReferences` permanece derivado dos detalhes, sem contagem paralela inconsistente.

### DB-05.20.4 — Fronteiras da coalescência de histórico

**Estado:** condicionado; não reproduzido no benchmark corrigido.

**Prioridade:** P3 diagnóstico.

A execução inicial exigiu dois passos para três tarefas. Depois da correção semântica do harness, o run final exigiu exatamente três undos e três redos, com equivalência integral.

Este incremento só deve ser reativado se novo teste reproduzir agrupamento entre tarefas distintas. Nesse caso:

- registrar chaves e timestamps de coalescência;
- verificar seleção, troca de contexto e edição de outro componente;
- preservar coalescência de digitação no mesmo campo;
- impedir agrupamento entre tarefas visualmente distintas.

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
- reduzir o total de 219 para menos de 180 sem automatizar conteúdo.

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

## Ordem atualizada

1. DB-05.20.3 — identificar e classificar a referência ausente.
2. DB-05.20.5 — aplicação conjunta de frame.
3. Reexecutar DB-05.20.1 e medir redução de ações.
4. Decidir sobre DB-05.20.6.
5. Refinar legibilidade e executar benchmark com assets.
6. Reabrir DB-05.20.4 somente se a coalescência voltar a divergir.

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
