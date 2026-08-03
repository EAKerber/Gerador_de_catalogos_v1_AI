# Relatório de encerramento da V1

## Estado deste documento

- **Checkpoint analítico:** `05.62`
- **Base examinada:** `development@efe9c063404910e902b109f340ff2dab7358876e`
- **Último incremento funcional:** `05.60`
- **Classificação:** relatório concluído para revisão; o gate de encerramento
  ainda não equivale a aprovação arquitetural
- **Escopo:** reconstruir objetivo, trajetória, resultado e motivo do
  congelamento; não decidir a arquitetura da V2

## Veredito executivo

A V1 deve permanecer encerrada como **protótipo técnico congelado**. Ela provou
que é possível representar um catálogo por dados, materializá-lo em componentes
editáveis, transportar assets com integridade e exportar a projeção do editor.
Também produziu mecanismos úteis de edição em lote, validação estrutural,
proveniência e regressão automatizada.

Ela não provou que esses mecanismos formem um produto capaz de gerar, revisar e
publicar autonomamente um catálogo de qualidade. O caminho crítico contém
autoridades e gates diferentes: um documento pode passar pela geometria JSON,
continuar tipograficamente inadequado no DOM e ainda depender de um agente para
perceber que a composição que “cabe” é ruim. No último ensaio em início frio, a
política correta de enquadramento estava no kit, mas não se tornou decisão no
documento materializado.

Portanto, o encerramento não se baseia em quantidade de bugs ou preferência
estética. Baseia-se no desalinhamento entre o objetivo do produto e seus sinais
de sucesso. Continuar a evolução funcional da V1 antes de reavaliar essas
fronteiras aumentaria o custo afundado e reduziria a confiança nas validações.

## Objetivo original e resultado obtido

| Dimensão | Intenção da V1 | Resultado preservado | Conclusão |
| --- | --- | --- | --- |
| Fonte de verdade | JSON orientado a fatos e intenção | `CatalogSource`, `CatalogGenerationPlan` e `CatalogDocument` serializáveis | Parcialmente atingido; há três contratos e divergência interna de versão do plano |
| Materialização | Compilador determinístico | Compilação, decisões, reparos e relatório estruturado | Atingido para estrutura; não executa DOM nem round-trip |
| Edição | Canvas A4 com componentes semânticos | 16 tipos, coleções, slots, bindings, undo/redo e operações em lote | Atingido como capacidade; custo e descoberta continuam altos |
| Layout | Geometria válida e adaptável | Frames locais, mínimos, auto-layout, reflow e diagnóstico de colisão | Atingido apenas para envelopes; não garante conteúdo ou qualidade editorial |
| Integridade textual | Texto legível e não truncado | Auditor DOM adicionado no 05.56 | Detecta, mas não fecha automaticamente o ciclo de correção |
| Imagens | Assets fiéis e bem enquadrados | Proveniência, aprovação e enquadramento por instância | Capacidade comprovada; decisão autoral não é materializada de forma confiável |
| Portabilidade | Pacote reimportável e verificável | ZIP, hashes, MIME, rollback e referências portáteis | Patrimônio técnico comprovado |
| PDF | Saída da mesma projeção do editor | Impressão A4 da página renderizada | Parcial; depende do DOM/browser e não substitui inspeção material |
| Autoria por agente | Fonte → plano → compilador → auditoria → entrega | Authoring Kit 1.7.2 e políticas explícitas | Disciplina factual melhorou; ciclo visual permaneceu aberto |
| Publicação | Gate que represente qualidade publicável | Gates estrutural, factual, de assets e texto | Insuficiente para composição visual, semântica e decisão de correção |

## Trajetória mensurável

### 1. Viabilidade e custo de operação manual

Os ensaios comparáveis sobre a referência técnica reduziram o trabalho manual
sem mudar o alvo:

| Ensaio | Ações | Colisões | Overflows de frame | Resultado |
| --- | ---: | ---: | ---: | --- |
| Linha histórica | 319 | não consolidado aqui | não consolidado aqui | baseline |
| 05.12 | 267 | 8 | 2 | reconstrução incompleta; 65% de cobertura representacional |
| 05.16 | 223 | 8 | 0 | continuidade e lotes reduziram trabalho, sem resolver geometria |
| 05.17 | 157 | 0 | 0 | geometria por intenção e edição em lote fecharam o alvo estrutural |

Isso demonstra melhoria real de eficiência: 50,8% menos ações entre a linha
histórica e o 05.17. Não demonstra qualidade visual autônoma. O relatório do
05.17 ainda usa a definição de validade disponível naquele momento e antecede
o auditor DOM do 05.56.

### 2. Primeiro fluxo externo preservado

O 05.52 conservou o primeiro fluxo real `kit → agente → pacote → editor →
feedback → pacote revisado`. O pacote permaneceu reimportável e os fatos
fornecidos puderam ser corrigidos sem quebrar compilação, schema ou geometria.
O mesmo caso revelou falhas de autoria, descoberta, cabeçalho de tabela e
composição de assets. A saída revisada foi preservada como evidência, não
aprovada como padrão visual.

### 3. Gates renderizados e disciplina factual

O 05.56 surgiu porque um pacote estruturalmente válido continha dez
truncamentos visíveis no PDF. A V1 passou então a distinguir:

- colisão de frames no documento;
- extrapolação de frame sobre o pai;
- clipping ou reticência no DOM;
- colisão texto–texto e texto–objeto;
- fonte abaixo de 6 pt.

O 05.57 removeu defaults comerciais plausíveis, tornou pendências bloqueantes
em publicação e separou a estrutura do footer de seus fatos. Esses incrementos
são correções de governança importantes, mas chegaram depois que o sistema já
possuía vários caminhos de materialização e validação.

### 4. Enquadramento de arte

O 05.59 adicionou `fit`, foco, zoom e deslocamento por instância sem alterar os
bytes do asset. O ensaio causal 05.59B usou o mesmo produto e slot em quatro
condições:

| Condição | Ocupação útil | Ganho sobre original |
| --- | ---: | ---: |
| Original em `contain` | 16,37% | 1,00× |
| Canvas neutro expandido | 16,33% | 1,00× |
| Recorte externo | 30,73% | 1,88× |
| Enquadramento do editor | 30,52% | 1,86× |

O editor ficou 0,68% abaixo do recorte externo e preservou a identidade do
asset. A capacidade está comprovada para o caso controlado. O 05.60 converteu
o achado em política do Authoring Kit 1.7.2.

### 5. Ensaio de encerramento em início frio

No ensaio posterior com agente limpo, os relatórios apresentados declararam
zero colisões e zero overflows estruturais, mas o resultado materializado
continuou com truncamentos, baixa ocupação de imagens e hierarquia textual
insuficiente. As artes permaneceram nos defaults de enquadramento apesar da
orientação do kit. Uma intervenção manual mostrou que o controle do editor
alterava materialmente a ocupação, confirmando a capacidade e expondo a falha
do ciclo autoral.

Esses achados são `observed` no processo, não `reproduced` no repositório: os
pacotes e PDFs finais ainda não foram incorporados. Eles justificam o
congelamento decidido pelo usuário, mas não podem ser usados para uma medida
nova até a ingestão prevista no índice de evidências.

## Caminho crítico e perda de garantia

| Passagem | Autoridade de escrita na V1 | Gate existente | Limite comprovado |
| --- | --- | --- | --- |
| Fatos → `CatalogSource` | agente/usuário e normalizador | schema e validação factual | origem factual depende da disciplina e da proveniência de entrada |
| Fonte → plano | agente ou normalizador padrão | `CatalogGenerationPlan.validate` | intenção de alto nível não expressa todos os refinamentos pós-compilação |
| Plano → documento | `CatalogCompiler` e `DocumentStore` | schema, referências e geometria | compilador declara texto renderizado e round-trip como `notRun` |
| Documento → layout | store, registro de componentes e `CatalogLayoutEngine` | mínimos e colisões de frames | mínimos são de componente; não constituem medição final do conteúdo |
| Layout → DOM | `CatalogRenderer` e renderers por tipo | auditor DOM 05.56 | o auditor observa depois da materialização; não decide reflow ou reautoria |
| DOM → PDF | CSS de impressão e browser | preflight estrutural/textual | diálogo e inspeção do PDF permanecem externos ao compilador |
| Documento → ZIP | `CatalogProjectPackageManager` | hashes, MIME, paths, assets e gate | portabilidade não prova fidelidade visual ou qualidade editorial |
| Relatórios → agente | Authoring Kit e interpretação do agente | política textual | nenhum controlador executa `renderizar → medir → corrigir → repetir` |

A fronteira decisiva é a última: a V1 consegue produzir diagnósticos, mas não
possui um mecanismo autoritativo que converta todos eles em nova decisão de
layout e confirme o resultado na mesma superfície. Por isso, mais regras em
prosa ou mais checks isolados não são resposta suficiente.

## Patrimônio demonstrado

Os seguintes resultados merecem presunção favorável na futura matriz de
disposição, sem antecipar a decisão final:

- fixtures com hashes, PDFs, imagens e documentos reexecutáveis;
- pacote portátil com verificação de bytes, MIME, paths, rollback e round-trip;
- separação entre fatos, plano editorial e documento materializado;
- proveniência e aprovação explícitas para assets;
- placeholders inválidos por construção e bloqueio factual de publicação;
- operações de geometria e coleções em lote, com histórico;
- ensaio causal de enquadramento com tela/impressão e asset idêntico;
- infraestrutura de testes Node/Chromium e build idempotente;
- vocabulário de componente, slots e bindings como material de pesquisa.

“Presunção favorável” significa investigar para preservar ou extrair. Não
significa carregar APIs, schemas ou implementação sem nova justificativa.

## Motivos formais do encerramento

1. **Os gates não compõem uma definição única de qualidade.** Geometria,
   tipografia, assets, fatos e composição visual têm autoridades diferentes.
2. **Detecção não implica decisão.** O auditor DOM pode bloquear publicação,
   mas não produz uma política de redução nem um novo layout.
3. **Capacidade não implica uso.** O enquadramento funciona no ensaio causal,
   mas o agente limpo deixou todas as artes nos defaults.
4. **Há contratos internamente divergentes.** O plano externo é `1.1.0`, mas o
   schema do plano embutido no documento exige `1.0.0`.
5. **A complexidade desloca defeitos entre camadas.** Ajustes locais em recipe,
   schema, layout, renderer, editor, kit e testes passaram a gerar correções em
   cadeia.
6. **O sucesso estrutural ficou semanticamente enganoso.** “Zero colisões” pode
   ser verdadeiro para frames e falso para o entendimento de “texto colidido,
   truncado ou mal estruturado” esperado pelo usuário.

## Não conclusões

Este relatório não afirma que:

- toda a V1 deve ser reescrita;
- o motor de layout seja a única causa;
- a referência técnica ou promocional deva ser um golden image;
- o 05.17 ou o 05.59B generalizem para qualquer catálogo;
- a V2 deva permanecer neste repositório;
- documentos V1 devam ou não ser migrados;
- 51 capacidades sejam patrimônio ou dívida em bloco.

Essas escolhas pertencem à matriz de disposição, ao contrato de qualidade e à
comparação arquitetural ainda bloqueantes.

## Limitações da reconstrução

- O checkout usado é raso; a narrativa de Git anterior ao head local foi
  reconstruída por documentos versionados e metadados remotos de PR, não por
  `git log` local completo.
- O ensaio cego final não está materialmente preservado no repositório.
- Alguns documentos históricos chamam “visual” uma validação que naquele
  momento ainda era predominantemente geométrica; o significado foi mantido
  como histórico, não atualizado retroativamente.
- CI verde confirma contratos automatizados, não aprovação estética.

## Condição de aprovação deste gate

O relatório pode ser marcado como aprovado somente quando:

1. os fatos e limites acima forem revisados sem transformar observações em
   reproduções;
2. o índice de evidências permitir localizar cada número relevante;
3. as falhas conhecidas estiverem registradas com teste de refutação;
4. nenhuma conclusão de arquitetura ou implementação V2 tiver sido introduzida.

Até essa revisão, `v1-closure-report-approved` permanece aberto no checkpoint.

