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
7. Preferir capacidades gerais a atalhos específicos de uma única peça de referência.

## Incrementos

### DB-05.20.1 — Benchmark de generalização promocional

**Estado:** concluído e consolidado.

Resultado final no run `29886064651`:

- 180 ações;
- 59 componentes;
- quatro ofertas;
- 11 aplicações conjuntas de frame;
- zero aberturas de **Avançado** para geometria;
- zero colisões;
- zero overflows;
- zero referências obrigatórias ausentes;
- três tarefas finais revertidas/refeitas em três passos;
- exportação/reimportação equivalentes;
- PDF A4 gerado;
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

**Estado:** concluído.

A referência era um `product-card` local com `productId: null`, estado válido que o validador anterior confundia com ID explicitamente inexistente.

O `CatalogDocumentValidator 1.1.0` agora expõe:

- `references.missing` para IDs obrigatórios ausentes;
- `references.invalid` para vínculos existentes, porém incompatíveis;
- `references.optional` para vínculos deliberadamente vazios.

Resultados:

- `missingReferences` deriva exclusivamente de `references.missing.length`;
- card local aparece como `product / local-content`;
- arte sem arquivo aparece como `asset / placeholder-without-asset`;
- produto, asset, linha, legenda, variação e token explicitamente ausentes continuam diagnosticados e bloqueantes quando aplicável;
- app e AuthoringKit permanecem em paridade;
- schema continua `1.16.0`.

Validações finais:

- relatório dedicado: run `29884113297`;
- benchmark promocional: zero referências ausentes;
- gate estável e build idempotente aprovados.

### DB-05.20.4 — Fronteiras da coalescência de histórico

**Estado:** condicionado; não reproduzido no benchmark corrigido.

A execução inicial exigiu dois passos para três tarefas. Depois das correções semânticas do harness, todas as execuções finais exigiram exatamente três undos e três redos, com equivalência integral.

Este incremento só deve ser reativado se novo teste reproduzir agrupamento entre tarefas distintas. Nesse caso:

- registrar chaves e timestamps de coalescência;
- verificar seleção, troca de contexto e edição de outro componente;
- preservar coalescência de digitação no mesmo campo;
- impedir agrupamento entre tarefas visualmente distintas.

### DB-05.20.5 — Aplicação conjunta de frame

**Estado:** concluído.

A implementação reutiliza `applyComponentFramesBulk` como única autoridade geométrica e permite uma seleção mínima de um item.

Entregas:

- rascunho conjunto de `x`, `y`, largura e altura;
- uma confirmação e uma entrada de histórico;
- presets topo seguro, base segura, coluna esquerda, coluna principal e faixa total;
- mínimos técnicos e limites preservados;
- undo/redo exatos;
- comando essencial sempre visível para seleção única;
- controles legados, mínimos e identificação mantidos em **Avançado**;
- store principal e AuthoringKit em paridade.

Métricas:

- geometria: 44 → 11 ações;
- total: 219 → 180 ações;
- aberturas de **Avançado**: 6 → 0;
- zero regressões de publicação, persistência ou histórico.

Validações:

- regressão dedicada: run `29886064630`;
- benchmark promocional: run `29886064651`;
- gate estável: run `29886064641`.

### DB-05.20.6 — Arranjo promocional de alto nível

**Estado:** adiado por ausência de necessidade comprovada.

A meta de 180 ações foi atingida com uma capacidade geométrica geral, sem receita promocional completa. Criar uma estrutura específica agora adicionaria superfície de manutenção antes de demonstrar valor adicional.

O incremento só deve ser reaberto se novos benchmarks mostrarem repetição consistente da mesma macroestrutura em múltiplas peças e contextos.

Restrições preservadas para eventual retomada:

- não criar novo tipo;
- não preencher conteúdo comercial fictício;
- manter cada peça independente;
- tratar a composição como receita removível e editável;
- manter reprodução manual como benchmark de transparência.

### DB-05.20.7 — Legibilidade de benefícios e callout

**Estado:** ativo.

**Prioridade:** P2 visual.

Melhorar representação em blocos estreitos sem alterar semântica:

- rótulos de benefício com wrap controlado de até duas linhas;
- tamanho mínimo recomendável para ícone + rótulo;
- preservação da escala interna 80/100/120 do vetor;
- callout amplo e compacto explicitamente diferenciados;
- maior hierarquia de título sem sacrificar o corpo;
- validação de tela e PDF;
- nenhuma dependência da moldura de `layout-container` na impressão;
- nenhuma mudança de tipo, receita obrigatória ou schema.

Critérios de aceite:

- quatro benefícios estreitos sem truncamento indevido, vazamento ou colisão;
- rótulos longos preservados em até duas linhas;
- callout amplo mais dominante que o compacto;
- conteúdo opcional continua removível;
- tela e impressão equivalentes;
- benchmark promocional continua em no máximo 180 ações.

### DB-05.20.8 — Benchmark com assets reais

**Estado:** pendente.

**Prioridade:** P3, depois da legibilidade.

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

1. DB-05.20.7 — legibilidade de benefícios e callout.
2. Reexecutar DB-05.20.1 e confirmar até 180 ações.
3. DB-05.20.8 — benchmark com assets reais.
4. Reabrir DB-05.20.4 somente se a coalescência voltar a divergir.
5. Reavaliar DB-05.20.6 somente após múltiplos benchmarks convergentes.

## Gates do ciclo

Nenhum incremento pode ser considerado concluído se introduzir:

- erro de página ou console;
- divergência modelo × DOM;
- perda em exportação/reimportação;
- undo/redo não reversível;
- colisão ou overflow não presentes no benchmark anterior;
- referência obrigatória ausente;
- mudança de schema;
- promoção acidental de receita para tipo;
- dependência nova no compilador sem espelho no AuthoringKit;
- aumento do benchmark promocional acima de 180 ações sem justificativa explícita.
