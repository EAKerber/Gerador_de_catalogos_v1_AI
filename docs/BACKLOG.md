# Backlog de produto e usabilidade

Registro consolidado das observações recebidas após o Incremento 04. As prioridades orientam a sequência, mas não substituem validação de interface. A direção canônica está em `PRODUCT-DEFINITION.md`; itens concluídos abaixo permanecem como histórico.

## Validação prática pós-promoção — ensaio de 2026-07-30

**Status atual: V1 — em revisão prática.** `development` é a linha autorizada
para corrigir os bloqueadores deste ensaio; `main@0505893` permanece como marco
técnico preservado até uma nova decisão de consolidação.

O primeiro ensaio real do fluxo **kit → agente externo → pacote → importação →
refinamento** produziu um catálogo tecnicamente válido e resultados visuais
promissores, mas encontrou bloqueios que os gates anteriores não mediam. O
marco técnico promovido em `main@0505893` permanece preservado; a aceitação do
fluxo principal do produto fica reaberta em `development` até os itens P0 e P1
abaixo passarem por um novo ensaio cego.

Essa revisão não reabre multipágina, colaboração, plataforma online, touch ou
expansão multimídia. Ela corrige a distância entre um pacote importável e um
catálogo gerado que possa ser refinado por usuário ou agente sem depender de
zoom do navegador, conhecimento implícito do editor ou edição estrutural
desproporcional.

### Leitura do ensaio

| Dimensão | Resultado | Consequência |
| --- | --- | --- |
| Integridade do pacote e importação | Suficiente | Preservar os gates existentes; eles provaram estrutura e round-trip, não usabilidade de refinamento. |
| Qualidade inicial do resultado | Promissora, mas abaixo da visão descrita pelo agente | Medir fidelidade autoral separadamente de colisão, overflow e validade de schema. |
| Descoberta de capacidades | Parcialmente positiva | O agente encontrou uma função específica quando solicitado; o kit é utilizável, mas as opções relevantes não são salientes o bastante no primeiro planejamento. |
| Refinamento no editor | Bloqueado | O painel exige zoom externo de aproximadamente 67%, repete controles de tamanho e contém botões sem apresentação consistente. |
| Expressividade do card | Incompleta na superfície atual | O usuário não encontrou uma escolha simples para arte acima e especificações abaixo; o card permaneceu percebido como preso ao modo amplo. |
| Componentes internos | Editáveis com atrito excessivo | Escala de ícone, espaçamento do átomo `specification` e rótulos de coluna da tabela não ficaram facilmente controláveis. |
| Tratamento de imagens de referência | Parcial | O produto foi preservado, mas a área útil branca deveria ser ampliada sem deformar ou reinterpretar a referência. |

### Plano de ação e fila bloqueante

| Ordem | Prioridade | Recorte | Decisão de implementação | Critério de saída |
| --- | --- | --- | --- | --- |
| 1 | P0 | Fixture do ensaio real | Preservar entrada, pacote, prompt/conversa relevante, PDF e capturas como uma única evidência de fluxo; distinguir problemas do agente, do kit, do compilador, do editor e do asset. | O mesmo caso pode ser reimportado e comparado sem reconstrução manual da evidência; cada falha possui proprietário e classe. |
| 2 | P0 · concluído 05.48 | Hierarquia e altura útil do inspetor | **Posição e tamanho** pertence à aba **Layout** e não pode consumir o corpo de **Conteúdo** ou **Visual**. Se alguma síntese global permanecer, deve ser compacta e recolhível. | Em `1366×768`, zoom do navegador em 100% e painel na largura mínima suportada, cada aba revela seu primeiro controle específico sem zoom externo e sem rolagem horizontal do documento. |
| 3 | P0 · concluído 05.48 | CSS e estados dos controles | Inventariar botões que caíram no estilo nativo ou perderam variantes; consolidar estilos, foco, hover, disabled e hitbox sem correções isoladas por seletor incidental. | Nenhum botão visível no inspetor usa apresentação nativa acidental; teste Chromium cobre estados e contraste nas três abas. |
| 4 | P1 · concluído 05.49 | Apresentação vertical de produto | Modo editorial e arranjo foram separados sem criar um sexto modo: `presentation.overrides.arrangement` aceita `auto`, `horizontal` ou `stacked`; `auto` preserva toda geometria histórica. A superfície aparece primeiro em **Conteúdo**, no card e em suas peças internas. | Cumprido: **Empilhado** materializa arte acima e especificações abaixo em qualquer modo; **Lado a lado** força colunas; reflow, IDs, undo/redo, lote, round-trip, manifesto e kit preservam o resultado. |
| 5 | P1 | Ergonomia de `specification` | Promover a dívida concreta antes classificada como posterior: expor escala do ícone e densidade interna por controles diretos e limitados, preservando presets e evitando CSS arbitrário. | Ícone, `gap` e `padding` podem ser ajustados ou normalizados sem redimensionar o frame externo; lote, undo, importação e PDF preservam o resultado. |
| 6 | P1 | Cabeçalhos de tabela | Expor rótulo, ordem e visibilidade das colunas na aba **Conteúdo**, mantendo chaves semânticas estáveis e separando renomear de alterar o binding. | Selecionar uma tabela permite renomear seus cabeçalhos diretamente, reordená-los sem editar JSON e preservar células, round-trip e PDF. |
| 7 | P1 | Descoberta no Authoring Kit | Tornar salientes as intenções do ensaio: escolha de apresentação, `specification` versus `fact` versus legenda, escala interna, `slot.span` e edição de colunas. Não duplicar o catálogo de capacidades em prosa concorrente. | Um agente sem contexto prévio encontra e usa as capacidades a partir do kit, sem o usuário precisar nomear a função escondida. |
| 8 | P2 | Fundo útil de imagens factuais | Documentar no fluxo de assets a expansão de área neutra: preferir `contain`, padding/canvas e composição não generativa; quando extensão generativa for necessária, preservar a forma factual do produto e registrar proveniência. | O agente consegue aumentar a área branca ao redor da referência sem cortar, deformar ou reinventar a corrediça; o PDF mantém escala e respiro consistentes. |
| 9 | P0 | Gate de aceitação prática | Repetir o caso com um agente em início frio, usando somente o kit e os dados/referências do ensaio; depois executar uma rodada de revisão com feedback equivalente ao usuário. | Pacote válido, importação e PDF continuam verdes; o agente materializa a intenção vertical, o editor permanece utilizável a 100% e os ajustes de especificação/tabela são encontrados sem orientação nominal. |

### Regra de consolidação revisada

Os gates Node, schema, build, Chromium, colisão e overflow continuam
obrigatórios, mas deixam de ser evidência suficiente para aceitação do fluxo
principal. Um corte pode ser tecnicamente estável e ainda falhar em autoria ou
refinamento. A V1 só volta a ser considerada aceita como produto quando o gate
de agente em início frio e a rodada de revisão passarem; até lá,
`main@0505893` é o baseline técnico e `development` é a linha de estabilização
prática.

## Estado operacional após o Incremento 05.23

A **V1 single-page estável** foi encerrada no Incremento 05.23 e integrada em
`development`. O núcleo geométrico e a transação estrutural de
espaçamento/separadores passaram pelos gates Node, schema, build e Chromium
multirreferência. Expansões funcionais não são automaticamente reabertas por
itens históricos: a governança canônica está em
`authoring-kit/feature-governance.json`.

### Concluído — Incremento 05.23

| Prioridade | Recorte | Critério de saída |
| --- | --- | --- |
| P0 | Espaçamento/separadores transacionais | Planejamento isolado; frames, autoridade e criação/atualização de separadores aplicados numa única emissão e num único undo, ou nenhuma mutação. |
| P0 | Regressão final | Node, schema, build, quatro shards Chromium e gates técnico/promocional verdes. |
| P0 | Limites e backlog da V1 | Entregue: estados ativo, dívida, discovery, pausado, congelado e histórico publicados sem ambiguidade. |

O benchmark comparável mais recente permanece o 05.17, com **157 ações,
zero colisão e zero overflow**. Os incrementos 05.20–05.23 são gates de
generalização, interface e confiabilidade, não novas medições integrais.

### Foco permitido após o encerramento

- regressão e correções de confiabilidade;
- coerência entre runtime, Authoring Kit e documentação;
- consolidação interna em recortes isolados;
- discovery explícito antes de reabrir multipágina, colaboração ou frentes congeladas.

O Incremento 05.25 inicia essa consolidação removendo a substituição tardia dos
métodos de posicionamento inicial do store. Cabeçalho e rodapé preservam as
mesmas sugestões declarativas, agora consultadas pelo módulo canônico.
O Incremento 05.26 continua o saneamento pelo alinhamento textual: migração
legada, importação e marcação de escolha explícita passam a pertencer ao store
canônico, sem substituição tardia da classe.
O Incremento 05.27 aplica o mesmo limite arquitetural às políticas de overflow:
normalização legada e escolha explícita passam ao store canônico, preservando
`wrap`, `ellipsis`, `clip` e a aparência histórica do rodapé.
O Incremento 05.36 transfere a convergência de reflow, a sincronização do
baseline e a restauração estável do histórico para o store canônico. O contrato
de compatibilidade deixa de substituir a classe; as subclasses de apresentações
permanecem como recortes posteriores.
O Incremento 05.37 consolida também a estabilização dos modos `variants` e
`data-only` nessa passagem canônica. Os contratos tardios preservam geometria,
inspeção e compatibilidade, mas não substituem mais a classe, `emit` ou
`deleteComponent`.
O Incremento 05.38 transfere a chamada da projeção da biblioteca por intenção
ao renderer canônico. O contrato continua declarando plano, grupos, busca e
estilos, mas não substitui mais `renderPalette` durante a inicialização.
O Incremento 05.39 transfere intenção editorial e posicionamento provável ao
gerador canônico do manifesto de capacidades. Os contratos continuam donos das
projeções declarativas, mas não substituem mais `buildCapabilitiesManifest`.
O Incremento 05.40 torna a confirmação remota específica por tipo de
acknowledgement e mantém o SHA obrigatório no readback independente.
O Incremento 05.41 consolida as nove receitas num único registro canônico,
independente da ordem de instalação.
O Incremento 05.42 publica o handover e eleva a revisão da branch histórica
Developer B a P1. O 05.43 materializa o inventário: 231 caminhos e 489 commits
exclusivos, sem arquivo novo a migrar, com 40 documentos preservados somente
por índice e 191 cópias históricas classificadas para descarte.
Após aprovação explícita, a PR #1 foi fechada sem merge e as 25 branches
`agent/*` foram removidas. O 05.44 registrou esse estado, repetiu os gates e
preparou a decisão de promoção sem mover `main`.

### Triagem histórica — Incremento 05.43

| Prioridade | Recorte | Estado |
| --- | --- | --- |
| P1 | Congelar `agent/developer-b-05.18@deec36a` e seu merge-base | Concluído no 05.43. |
| P1 | Inventariar paths, blobs, tamanhos, último commit e equivalência | 231/231 classificados. |
| P1 | Separar conclusão histórica de implementação canônica | 40 registros no índice; zero arquivo novo a copiar. |
| P1 | Formalizar política de evidência visual | Concluído; nenhuma captura histórica promovida. |
| P1 | Poda e encerramento histórico | Concluído após o 05.43: PR #1 fechada sem merge; 25 branches `agent/*` removidas; somente `main` e `development` preservadas. |
| P1 | Checkpoint de promoção | Concluído no 05.44: delta, gates, riscos e rollback documentados; promoção ainda exige autorização explícita. |

### Entregue — Incremento 05.13

| Prioridade | Entrega | Resultado | Evidência |
| --- | --- | --- | --- |
| P1 | Governança subtrativa | 35 capacidades classificadas: 20 ativas, 5 mantidas, 5 em auditoria, 4 congeladas e 1 pausada. | `feature-governance.json` validado contra o manifesto. |
| P1 | Autoridade de layout | Auto reintegra overrides descendentes; Manual preserva exceções interrompendo garantias recursivas. | Teste de domínio reproduz os dois estados e os comandos de reajuste. |
| P1 | Matriz intenção × mecanismo | Inserção, repetição, posicionamento, reintegração, mínimos, apresentação, separadores, variações e legendas mapeados. | `SUBTRACTIVE-FEATURE-AUDIT-05.13.md`. |
| P1 | Política de compatibilidade | UI pode ser consolidada antes de remover campos; documentos antigos continuam aceitos. | `ADR-025-governanca-subtrativa-e-autoridade-de-layout.md`. |

O 05.13 não remove recursos nem migra documentos. `CatalogDocument` permanece em `1.16.0`; `CatalogAuthoringKit 1.5.2` passa a publicar disponibilidade e governança separadamente.

### Entregue — Incremento 05.14

| Prioridade | Problema confirmado | Evidência | Critério de saída |
| --- | --- | --- | --- |
| P1 | Geometria vertical previsível | Requested/resolved e motivo ficam observáveis no inspetor avançado. | `layout-authority-geometry.test.js`. |
| P1 | Seleção fora do contexto | A árvore ajusta o contexto e seleciona em um clique. | Contrato estático e teste de domínio. |
| P1 | Autoridades concorrentes | Gerenciado/independente/reintegrar substituem Auto/Manual no fluxo normal. | ADR-026 e testes de reflow. |
| P2 | Impressão confiável | Preflight pede confirmação diante de erros e `.toast` é excluído da mídia impressa. | Contrato de UI e teste de impressão. |

### Concluído — Incremento 05.15 Receitas e ações compostas

| Prioridade | Problema | Critério de saída |
| --- | --- | --- |
| P1 | Destino de inserção ignora o alvo visual | Entregue: contêiner selecionado/sob o ponteiro vira destino; `Shift` insere no contexto atual. |
| P1 | Receitas compactas frágeis | Entregue: galeria de cinco imagens, dica a 236 px e organização hero + grade + faixa; benchmark integral segue no 05.16. |
| P1 | Tabela domina a construção manual | Entregue: linha simples, variação semântica, quatro esquemas reutilizáveis e aplicação em lote. |
| P2 | Contraste de tokens de legenda | Entregue para `pack.500`/`pack.300`, com borda de amostra reforçada. |

O 05.15 encerra sem novo campo persistido: esquemas e receitas materializam colunas, componentes e vínculos já canônicos. Continuidade de tarefa e nova medição passam para 05.16.

### Concluído — Incremento 05.16 Interface orientada à tarefa

| Prioridade | Problema | Critério de saída |
| --- | --- | --- |
| P1 | Perda de continuidade entre itens equivalentes | Checkpoint 1: aba, avançado e disclosures são lembrados por tipo durante a sessão. |
| P1 | Ações silenciosas | Checkpoint 1: inserção e ações contextuais sem resultado atualizam o status com causa compreensível. |
| P1 | Receita focal geometricamente inválida | Corrigido: mínimo real da grade e faixa produz zero colisão/overflow. |
| P1 | Nova medição integral | Concluída: 223 ações, −16,5% desde 05.12; zero overflow e oito colisões. |

### Próxima fila — refinamento pós-auditoria

| Prioridade | Problema confirmado | Critério de saída |
| --- | --- | --- |
| P1 | Seleção contextual ainda cobra correção | Encerrado no 05.17: transição atômica e benchmark final com uma tentativa sem efeito, não causada pela seleção entre irmãos. |
| P1 | Geometria domina o fluxo manual | Checkpoint 3: grade heterogênea reduz 27 preenchimentos; preview anterior ao commit e relações persistentes permanecem posteriores. |
| P1 | Composição final permanece inválida | Encerrado no benchmark 05.17: zero colisão e zero overflow sem retirar edição individual. |
| P2 | Galerias exigem edição imagem por imagem | Entregue no checkpoint 2: sincronização ou adição de imagens/legendas em lote; importação binária conjunta permanece posterior. |
| P2 | Legendas exigem três ações por definição | Entregue no checkpoint 2: várias definições e itens visuais materializados em uma transação. |

O relatório comparável está em `REFERENCE-RECONSTRUCTION-USABILITY-AUDIT-05.16.md`. A revisão posterior corrige a interpretação: geometria exata permanece central, mas deve cooperar com manipulação direta, relações e conjuntos em vez de depender de campos isolados.

### Entregue — aprofundamento da biblioteca no Incremento 05.18

A biblioteca possui dezesseis tipos e cobre bem estrutura de página, produto, dados, arte e legendas. A expansão passa por um gate subtrativo: primeiro aprofundar peças existentes, depois admitir somente componentes com intenção recorrente que não possa ser expressa com clareza por composição ou preset.

| Prioridade | Lacuna confirmada | Decisão canônica | Critério de saída |
| --- | --- | --- | --- |
| P1 | Presets de produto semanticamente distintos, mas visualmente próximos | Entregue: `standard`, `hero`, `technical`, `variants` e `data-only` reorganizam os mesmos slots com prioridades distintas. | Testes de domínio, navegador e impressão preservam geometria válida e reversibilidade. |
| P1 | Texto livre com pouca responsabilidade editorial | Entregue: alinhamento horizontal/vertical, escala 80/100/120% e quebra/reticências/corte sem HTML/CSS arbitrário. | Canvas, importação, histórico e PDF cobertos. |
| P1 | Escala interna de ícones depende principalmente da caixa externa | Entregue no átomo e na especificação, preservando frame, tokens e grid. | Escalas 80/100/120% cobertas por persistência e navegador. |
| P1 | Cabeçalho intermediário exige composição manual | Entregue como receita `section-heading`, sem criar tipo persistido. | Kicker opcional, título, complemento e divisor editáveis. |
| P1 | Dados técnicos simples são simulados como texto ou tabela | Entregue como receita `fact`, sem criar tipo persistido. | Ícone opcional, rótulo, valor e unidade semanticamente identificáveis. |
| P2 | Callout existe apenas como receita de baixo nível | Manter a receita atual durante 05.18; promover a componente apenas se edição/reuso continuarem custosos. | Evidência de repetição ou inconsistência antes de criar novo tipo. |
| P2 | Iconografia concentrada na referência de ferragens | Ampliar de forma curada por significado: técnico, desempenho, comercial, contato e confiança; evitar biblioteca indiscriminada. | Cada novo ícone atende ao menos dois fluxos plausíveis e possui categoria, rótulo e SVG monocromático por token. |
| P2 | Biblioteca expõe infraestrutura junto de escolhas editoriais | Manter `layout-container` e peças internas no modelo, mas mover sua descoberta inicial para **Estrutura avançada** ou contexto compatível. | Fluxo inicial prioriza página, produto, dados e comunicação sem remover poder avançado. |

Não entraram como novos tipos: preço, selo, chip, botão, QR code, caixa
colorida, card de contato, aplicação ou variações paralelas de tabela. Preço e
oferta foram posteriormente entregues como receitas compostas no 05.20; os
demais resultados continuam usando componentes, tokens e presets canônicos até
que uma intenção exclusiva seja demonstrada.

### Integração 05.20 — linguagem promocional e gate multirreferência

| Prioridade | Frente | Decisão | Estado / critério |
| --- | --- | --- | --- |
| P0 | Integração curada | Incorporar código e fixtures necessárias a partir de uma branch limpa; excluir workflows experimentais e evidências duplicadas. | Concluído: PR #2 integrada por squash em `development` (`dbfca98`) após 86 testes Node e 63 Chromium. |
| P0 | Regressão integral | Um runner deve descobrir todos os testes, inclusive 05.20 e estresse. | Implementado; nenhum filtro por incremento. |
| P0 | Inicialização segura | Contratos obrigatórios são estáticos, ordenados e fail-closed. | Implementado; runtime parcial não abre o editor. |
| P0 | Rodapé mínimo | Redimensionamento do pai precisa propagar os slots internos. | Corrigido e coberto em 80 px. |
| P0 | Preço completo | Valor e moeda devem permanecer legíveis em tela e impressão. | Gate bloqueante mede conteúdo e `scrollWidth`. |
| P1 | Linguagem promocional | Preço e oferta permanecem receitas; personagem, calendário e desenho técnico permanecem assets. | Nove receitas, dezesseis tipos e schema 1.16.0. |
| P1 | CI reproduzível | Um workflow somente leitura, dependências fixadas e artefatos apenas em falha. | Implementado; nenhum commit/push automático. |
| P2 | Consolidação interna | Transferir subclasses e patches incrementais aos módulos canônicos em recortes isolados. | Posterior; não misturar com novas capacidades. |

O contrato completo do incremento está em `INCREMENT-05.20.md`. A aprovação local de Node não substitui o job Chromium publicado.

### Revisão pós-integração 05.20 — orientação contextual e segurança de edição

Esta revisão separa capacidades já existentes de lacunas, oportunidades e riscos. Não cria um sistema adaptativo opaco nem promove sobreposição/camadas promocionais ao núcleo. A interface pode orientar a próxima ação, mas deve preservar acesso estável às capacidades, explicar por que uma sugestão apareceu e manter toda ação autoral explícita, reversível e compatível com o JSON canônico.

#### Estado observado

| Classe | Frente | Estado atual | Decisão / critério de saída |
| --- | --- | --- | --- |
| Existente | Contexto e próxima ação provável | A biblioteca filtra compatibilidade; o `+` combina componentes e ações derivadas da seleção; abas/disclosures lembram continuidade por tipo; ações sem efeito explicam a causa. | Preservar como base determinística da orientação contextual. |
| Existente | Seleção contextual | Camadas ajusta o contexto e seleciona um descendente na mesma ação; multisseleção aceita apenas irmãos; breadcrumb reflete o contexto aberto. | Não reabrir a transição atômica como problema genérico; medir apenas atritos restantes. |
| Existente | Grade e autoridade | Grid, snap global, smart snap, guias, tolerância, snap X/Y, override livre por eixo e estados gerenciado/independente/reintegrar já existem. | Usar estes contratos; não criar um segundo motor geométrico. |
| Incompleto | Inspector progressivo | Conteúdo, Layout, Visual e Avançado organizam propriedades e a sessão lembra estado, mas a priorização ainda é majoritariamente fixa por tipo. | Auditar tarefas reais antes de alterar ordem ou visibilidade. |
| Entregue 05.21 | Painéis laterais redimensionáveis | Divisórias por mouse/teclado, mínimo igual à largura anterior, máximo preservando o canvas, restauração e preferência local. | Manter; medir apenas regressões em 1366×768 e no zoom fit. |
| Entregue 05.21 | Breadcrumb resiliente | Raiz, pai e contexto atual permanecem visíveis; ancestrais intermediários usam menu acessível. | Manter como projeção do contexto único do store. |
| Entregue 05.33 | Camadas como instrumento de seleção e ordem | Subárvores recolhíveis, revelação/rolagem, contexto, seleção e estados hierárquicos foram preservados; irmãos podem subir ou descer dentro do mesmo grupo/slot por controles acessíveis, com reflow e undo. | Busca e intervalo continuam adiados. Reparenting, cruzamento entre slots, drag-and-drop e alteração do modelo de empilhamento permanecem em discovery. |
| Discovery | Trava geométrica persistente | A auditoria 05.22 confirmou alto acoplamento com mínimos, slots, auto-layout e lote, enquanto a reconstrução 05.17 terminou válida sem constraints persistentes. | Não implementar na V1. Testar primeiro proteção direta efêmera, posição independente, snapshots e undo; promover locks somente com falha observada dessas alternativas e migração de schema justificada. |
| Em validação 05.31 | Alinhamento por grade | Snap por eixo e alinhamento/distribuição em lote existem; o 05.31 acrescenta preview e normalização explícita da seleção. | Posições, dimensões ou ambos; respeitar mínimos, autoridade local e coordenadas locais; uma única transação reversível. |

#### Discovery — contextualização inteligente dinâmica

| Hipótese | Oportunidade | Guardrails obrigatórios | Evidência necessária |
| --- | --- | --- | --- |
| Foco por intenção extrapolada | Ordenar ações e abrir a seção mais provável a partir de seleção, contexto, última ação, diagnóstico geométrico e tarefa corrente. | Regras determinísticas e inspecionáveis; indicar “por que isto está em foco”; nunca executar automaticamente; não esconder capacidades; preferência de sessão separada do documento. | Comparar ações, trocas de contexto e tentativas sem efeito nos fluxos manual, gerado, refinado e importado. |
| Interface como guia | Sugerir próximo passo, correção de overflow/colisão, componente compatível, receita ou ação em lote. | Sugestão dispensável, reversível e não modal; distinguir recomendação de erro bloqueante; não fabricar conteúdo comercial; evitar ciclos e repetição. | Cenários com referência técnica, peça promocional e um terceiro catálogo contrastante. |
| Foco adaptativo estável | Manter continuidade sem fazer controles “saltarem” enquanto o usuário edita. | Reordenar somente em limites claros de tarefa; fixar ação escolhida; oferecer visão “Todas as opções”; registrar somente telemetria local de ensaio, sem perfil remoto. | Teste de previsibilidade: o mesmo estado produz o mesmo foco e nenhuma opção muda durante preenchimento ou drag. |
| Sugestões conscientes da geometria | Combinar mínimos, slots, grid, colisões e autoridade antes de sugerir resize, distribuição ou inserção. | Preview obrigatório para mudanças compostas; explicar efeitos em filhos/irmãos; respeitar overrides; uma transação por aceite. | Casos compactos, hierarquias profundas e cards/tabelas no mínimo técnico. |

A primeira etapa desta discovery é um inventário de sinais e comandos existentes, não uma IA autônoma na interface. O resultado deve decidir se basta um ranking declarativo de ações, um guia de tarefa com estados explícitos ou uma combinação pequena dos dois.

Decisão posterior: a contextualização não usará IA, modelos locais/remotos, classificação probabilística ou geração de conteúdo. A solução deve permanecer em regras declarativas, intenção explicitamente escolhida, diagnósticos do próprio editor e resultados determinísticos. O contrato técnico e a ordem dos recortes estão em `INCREMENT-05.21.md`.

#### Oportunidades e riscos revelados pelas mudanças recentes

| Tipo | Observação | Encaminhamento |
| --- | --- | --- |
| Oportunidade | As nove receitas promocionais e os modos editoriais tornam possível inferir intenção sem criar novos tipos persistidos. | Usar metadados de receita, papel do asset, modo do card e diagnóstico como sinais declarativos. |
| Oportunidade | `section-heading` e `fact` podem resolver lacunas recorrentes das referências técnica e promocional, mas ainda precisam de contraste externo. | Manter candidatas; testar contra catálogo diferente antes de ampliar os dezesseis tipos. |
| Oportunidade | Camadas pode virar o ponto comum entre navegação, seleção, ordem e diagnóstico, reduzindo deslocamento entre canvas e inspector. | Evidência recebida: a ausência de reordenação incomoda no uso. Promover como P2 apenas a mudança de ordem entre irmãos, reutilizando a operação canônica já existente; manter reparenting e sobreposição promocional em discovery separada. |
| Risco | Aumentar a largura mínima dos painéis reduz o canvas justamente em 1366×768. | Recalcular zoom fit continuamente, impor máximo dependente da área útil e testar ambos os painéis no mínimo e no máximo. |
| Risco | Sugestões adaptativas podem tornar a interface imprevisível, esconder poder avançado ou reforçar uma intenção inferida incorretamente. | Toda capacidade continua acessível em posição estável; ranking é explicável, desligável na sessão e coberto por testes determinísticos. |
| Risco | Mínimos, slots, auto-layout e comandos em lote já competem como escritores geométricos mesmo sem locks. | Toda edição manual migrada deve planejar reflow e autoridade numa cópia, validar o conjunto e fazer um único commit ou nenhum; locks permanecem fora da V1. |
| Risco | Breadcrumb e Camadas podem duplicar navegação com estados divergentes. | Contexto e seleção permanecem uma única fonte no store; ambas as superfícies apenas projetam e comandam a mesma transição. |


### Frentes congeladas

Expansão multimídia, hospedagem, colaboração, touch/mobile completo e workflow de publicação não possuem incremento ativo. PDF continua no núcleo de fidelidade; portabilidade existente é apenas mantida.

### Definido, mas fora do próximo incremento

| Prioridade | Frente | Decisão já canônica | Gatilho de entrada |
| --- | --- | --- | --- |
| P2 | Hospedagem estática por Git | Decisão preservada, sem implementação no ciclo atual. | Descongelamento explícito após fidelidade/confiabilidade. |
| P1 | Snapshots locais | Contrato portátil preservado; nenhuma expansão operacional. | Descongelamento explícito. |
| P2 | Sala browser-only | Direção local-first preservada, sem protótipo ou infraestrutura. | Descongelamento explícito. |
| P2 | Fundamentos touch/mobile | Apenas guardrails contra dependência exclusiva de mouse/hover/teclado. | Descongelamento explícito. |
| P2 | Documento multipágina | Pausado, não congelado; layout e reflow já possuem gates, mas a retomada não é automática. | Encerramento formal da V1 single-page e decisão explícita. |

### Discovery congelada

- regras condicionais avançadas entre dados de tabela e legendas cromáticas;
- política exata de autoaceite de comandos/objetos em uma sala;
- retenção e inclusão do log colaborativo em snapshots;
- limite de participantes validado por benchmark;
- critérios objetivos para reconsiderar TURN;
- escopo de revisão/correção em touch depois da nova medição manual.
- componente de sobreposição/camadas para peças promocionais (mascote, calendário, selos e faixas): investigar empilhamento, posicionamento livre ou ancorado, seleção, interação com reflow e fidelidade na exportação; discovery apenas, sem entrar como requisito do núcleo ou bloqueio de merge.

Essas perguntas permanecem documentadas, mas não competem com o backlog ativo.

## Registro consolidado após a definição de produto

| Prioridade | Tema | Resultado esperado | Dependências | Estado |
| --- | --- | --- | --- | --- |
| P0 | Desfazer e refazer | Histórico transacional com `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z` e `Ctrl+Y`; seleção e zoom não entram no histórico. | Store | Concluído 05.2 |
| P0 | Importação JSON segura | Analisar, migrar e visualizar o relatório antes do commit; preservar recuperação do documento anterior. | Histórico, schema | Concluído 05.2 |
| P0 | Assets portáteis | ZIP com manifesto, hashes e arquivos; importar no storage e remapear referências sem base64. | Importador | Concluído 05.3 |
| P1 | Kit de autoria por agente | Guide versionado, schemas, manifestos, exemplos, compilador, validador e empacotador reutilizáveis em várias criações. | Manifestos declarativos | Concluído 05.5 — Kit 1.1 com CLI e runtime autocontido |
| P1 | Ciclo de vida dos assets | Modo Assistido por default, proveniência, fidelidade, aprovação e gates diferentes para rascunho e publicação. | Manifesto de assets, templates | Base 05.4 mantida; expansão congelada 05.13 |
| P1 | Manifesto de capacidades | Separar metadados declarativos do registro runtime e expor tipos, slots, modos, presets, requisitos e fallbacks. | Registro de componentes | Concluído 05.4 |
| P1 | Modelo semântico de produto | Substituir a limitação `specOne/specTwo` por atributos, destaques, aplicações, variantes, assets e valores comerciais tipados. | CatalogSource | Base concluída 05.4; binding semântico no compilador 05.5 |
| P1 | Plano e compilador editorial | Materializar páginas, IDs, slots e frames a partir de intenção editorial validável. | Templates oficiais, modelo de produto | Concluído 05.5 para estratégias `hero-grid` e `grid-only`; novas famílias seguem incrementais |
| P1 | Interface progressiva | Priorizar conteúdo e problemas, depois layout e visual; manter geometria e restrições em divulgação avançada. | Manifesto de capacidades | Vocabulário atual auditado; continuidade de tarefa passa ao 05.16 |
| P1 | Redução de ações manuais | Agrupar cadastro, vínculo, preenchimento e composição repetitivos sem retirar controle nem edição individual. | Histórico, inventário, tabelas | 05.17: 157 ações, −50,8% desde a base; zero colisão/overflow |
| P1 | Tamanho recomendável | Separar mínimo técnico de mínimo recomendado/personalizado e permitir override explícito com aviso de overflow. | Histórico, layout | Concluído 05.4 |
| P1 | Escala interna dos átomos | Fonte, ícone, padding, gap e presets compacto/padrão/confortável, sem CSS arbitrário. | Tokens de densidade | Presets mantidos; novos controles congelados salvo dívida concreta |
| P1 | Templates, modos e densidades | Formalizar vocabulário, IDs, requisitos, fallback e bindings das apresentações oficiais. | Manifesto, modelo de produto | Contratos mantidos; exposição conjunta em auditoria 05.13 |
| P2 | Legenda cromática semântica | Chave estável vinculada aos dados e tokens, com contraste, fallback e precedência definidos. | Tabela genérica, modelo de produto | MVP mantido; regras condicionais congeladas |
| P1 | Variações semânticas materializadas | Uma variação de produto deve vincular imagem, legenda e linhas comerciais sem simular a entidade como uma linha visual. | CatalogSource, coleções, galeria e tabela | Concluído 05.10 — vínculo estável e materialização opcional |
| P1 | Legenda visual hierárquica | Ao criar uma legenda, materializar opcionalmente o item visual; permitir painel, subgrupos destacáveis e itens vinculados por chave. | Legenda semântica, tokens e componentes compostos | Concluído 05.10 — painel, grupos, itens e migração conservadora |
| P1 | Barra de comandos responsiva | Ações primárias devem permanecer descobríveis e acionáveis; preferências de visualização não podem cortar, comprimir ou competir com comandos de documento. | Chrome, atalhos e viewport | Concluído 05.11 |
| P1 | Cards da biblioteca lateral | Título, descrição, botão `+` e menu secundário precisam de áreas reservadas, sem sobreposição ou truncamento enganoso em largura útil reduzida. | Biblioteca de componentes e receitas | Concluído 05.11 |
| P1 | Catálogo de funcionalidades para agentes | Referência humana e legível por agente com recursos, pontos de acesso, pré-condições, atalhos, exemplos e limitações, derivada do manifesto quando possível. | Manifesto de capacidades e kit | Concluído 05.11 — inventário gerado + 15 fluxos curados |
| P1 | Governança subtrativa | Classificar capacidades e remover, fundir ou ocultar mecanismos sem intenção exclusiva, preservando contratos compatíveis. | Manifesto, testes por intenção, migração | Concluído 05.13 como política; execução incremental 05.14–05.16 |
| P2 | Hospedagem estática por Git | Publicar o editor atual com deploy de preview, testes e promoção controlada, sem confundir hospedagem com persistência compartilhada. | Repositório, CI e política de dados | Congelado 05.13 |
| P1 | Persistência local-first e snapshots | Projeto portátil com checkpoints, backups e restauração local; futura colaboração por sala browser-only, autoridade do hoster e réplicas manuais, sem banco central como fonte de verdade. | Pacote, hashes, histórico, WebRTC/sinalização efêmera e política de conflito | Congelado; somente compatibilidade |
| P2 | Fundamentos touch e mobile | Evitar dependências futuras de hover, mouse e teclado sem prometer paridade editorial mobile antes da medição de esforço manual. | Eventos, shell responsivo e acessibilidade | Guardrail; expansão congelada |
| P2 | Paginação e balanceamento | Distribuir produtos e seções em múltiplas páginas sem overflow, preservando intenção e ordem. | Compilador, multipágina | Pausado até o encerramento formal da V1 e decisão explícita |
| P2 | Revisão do chrome do editor | Consolidar toolbar, ações contextuais, camadas, atalhos e largura/recolhimento dos painéis. | Interface progressiva | Auditoria subtrativa ativa; interface orientada à tarefa 05.16 |

## Automação da criação entregue no 05.5

O ensaio da referência exigia 319 ações manuais. A importação direta de `CatalogSource` executa análise, plano padrão, compilação, gate geométrico e commit em três ações de interface. Essa é uma métrica do fluxo automatizado e não representa redução da construção manual.

| Tema descoberto no ensaio | Resposta 05.5 | Estado |
| --- | --- | --- |
| Gate geométrico de publicação | Detecta colisão, clipping, filho fora do pai e componente fora da página; integra compilação e pacote. | Concluído |
| Compilador com empacotamento | Estratégias determinísticas `hero-grid` e `grid-only` materializam uma matriz declarada e validada. | Concluído para uma página |
| Card compacto real | Mínimo técnico de 220 px e geometria compacta coordenada. | Concluído |
| Tabela editorial densa | Header de 16 px e linhas de 20 px no preset compacto. | Concluído |
| Entrada bulk de produtos | `CatalogSource` completo é aceito diretamente pelo importador. | Concluído para JSON; colagem CSV/planilha permanece posterior |
| Reflow/repaginação por crescimento | Recompilar produz geometria válida; edição manual ainda não repagina irmãos. | Parcial; depende do Incremento 06 |
| Templates de página | `hero-grid` é a primeira família oficial. | Parcial; ampliar após validação |
| Foco contextual persistente e edição em lote | Não altera o fluxo de geração, mas ainda encarece refinamento manual. | Ativo |

## Redução de ações da construção manual — 05.6

O primeiro lote ataca os 122 preenchimentos e 184 cliques do ensaio sem substituir a escolha do usuário por compilação automática.

| Repetição manual | Resposta 05.6 | Estado |
| --- | --- | --- |
| Cadastro produto por produto | Colagem de planilha/TSV/CSV com cabeçalhos reconhecidos e confirmação única. | Concluído |
| Criar e vincular cada card | Produtos selecionados criam cards vinculados em uma grade escolhida pelo usuário. | Concluído |
| Célula por célula | Colagem de várias linhas na tabela selecionada, substituindo ou acrescentando. | Concluído |
| Estados parciais no histórico | Cada operação composta é uma transação única com rollback e um `Ctrl/Cmd+Z`. | Concluído |
| Seleção múltipla no canvas | Irmãos por Shift/Ctrl/Cmd+clique ou todos do contexto por Ctrl/Cmd+A; alinhar, distribuir, aplicar apresentação/tokens, duplicar e excluir em lote. | Concluído 05.7 |
| Foco contextual persistente | Manter ações prováveis visíveis ao alternar entre card, tabela, galeria e inventário. | Ativo |
| Templates de seção | Receitas oficiais de página, aplicações, legenda e callout; inserção por `+` ou drag, componentes comuns e foco declarado. | Concluído 05.8 |

Medição parcial observada: cadastrar sete produtos, criar sete cards, vinculá-los e organizá-los caiu de pelo menos 56 ações identificáveis para 5 ações, redução conservadora de 91,1%. A repetição integral posterior, no 05.12, registrou 267 ações: o ganho do subfluxo não eliminou o custo de tabelas, contexto e geometria.

Medição adicional 05.7: depois dos cards existirem, aplicar uma mesma densidade aos sete caiu de pelo menos 14 ações para 2 (`Ctrl+A` + escolha), redução de 85,7% nesse refinamento.

Medição adicional 05.8: a fundação manual da página — cabeçalho, área principal, rodapé e entrada no contexto — caiu de pelo menos 4 comandos para 1, redução de 75% nesse subfluxo. Página-base e sete cards vinculados ficaram prontos em 6 ações observáveis, com zero colisão e zero overflow. A auditoria 05.12 confirmou que seleção cruzando pais, geometria final e continuidade contextual ainda tornam a reconstrução completa custosa.

Medição adicional 05.9: adicionar uma linha à tabela ou uma variação visual à arte caiu para um único comando contextual depois da seleção. Espaçamento uniforme e separadores entre vários irmãos também formam uma única transação. O ensaio integral 05.12 demonstrou que configurar sete esquemas/linhas ainda consumiu 82 ações e que operações geométricas consumiram outras 75.

## Problemas confirmados pela auditoria de responsividade 05.4 — 2026-07-15

Os itens abaixo foram reproduzidos em Chromium real por interação com a interface. Eles reabrem comportamentos anteriormente considerados concluídos quando a evidência mostrou cobertura incompleta.

O ensaio posterior de reconstrução da referência, suas métricas e os candidatos ainda não promovidos ao backlog estão em `REFERENCE-RECONSTRUCTION-USABILITY-AUDIT-05.4.md`.

| Prioridade | Tema | Evidência reproduzida | Resultado esperado | Estado |
| --- | --- | --- | --- | --- |
| P1 | Colisão na toolbar alvo | Em `1366×768`, **Imprimir / PDF** ocupava aproximadamente 18 px da área de **Grid**; em 1280 px a colisão também envolvia **Exportar** e **Grid snap**. | A toolbar preserva hitbox, rótulo e separação em 1366×768, com rótulos compactos e teste geométrico dos sete controles de visualização. | Concluído 05.9 |
| P1 | Overflow interno do rodapé | No mínimo técnico `500×80`, títulos e complementos podiam ultrapassar o item. | Concluído em 05.18.12.2: slots responsivos, recorte defensivo e teste Chromium de tela/impressão. | Concluído 05.18.12.2 |
| P1 | Colapso incompleto no card | Após remover arte e todas as especificações, o card permanecia com reserva vertical da composição completa. | Concluído 05.30: mínimo prospectivo, comando explícito de ajuste ao conteúdo, tabela contida e undo. | Concluído 05.30 |
| P2 | Recomendado personalizado inalcançável | Um card com três linhas aceita recomendado `310×240`, mas a transição para modo compacto eleva o mínimo calculado para `310×334`; o valor salvo não pode ser atingido pelo resize. | Ao editar o recomendado, mostrar o mínimo calculado para o conteúdo e avisar ou ajustar valores atualmente inalcançáveis, sem transformar o recomendado em barreira rígida. | Confirmado |
| P2 | Descontinuidade de mínimo por breakpoint | Ao reduzir a largura do card de 350 para 310 px, o layout compacto aumenta o mínimo vertical de 278 para 334 px. A mudança é correta estruturalmente, mas pouco previsível. | Preview e inspector devem antecipar a troca de modo e explicar a consequência vertical antes do commit do resize. | Confirmado |
| P2 | Rótulos do editor sobrepostos | No card técnico havia contato entre o rótulo do pai e **Título com símbolo**; no rodapé técnico, rótulos de pai, itens e ícones se sobrepunham fortemente. | Concluído 05.35: seleção revela somente o rótulo primário; filhos mantêm destaque e, no contexto editável, revelação local compacta por hover/foco; impressão permanece limpa. | Concluído 05.35 |
| P1 | Barra superior sem hierarquia responsiva | A captura mostra comandos de documento e ajustes de visualização comprimidos/cortados na mesma faixa; “Grade” perde leitura e controles deixam de ter separação segura. | Agrupar **Documento**, **Histórico** e **Visualização**; reduzir visualização para menu/overflow antes de ocultar ou cortar ações; preservar atalhos e rótulos acessíveis. | Concluído 05.11 |
| P1 | Ações sobrepostas em cards da biblioteca | A captura mostra `+` invadindo títulos e descrições de receitas, enquanto a aba e textos ficam truncados. | Card com coluna de ação fixa, título/descrição com largura própria, truncamento intencional e hit targets independentes; testar painel estreito e contexto interno. | Concluído 05.11 |
| P2 | Abas esquerdas sem largura suficiente | **Componentes** possuía conteúdo maior que sua caixa útil e invadia visualmente **Produtos** em todos os viewports testados. | O painel ganhou largura estável e distribuição proporcional entre as três abas; teste real bloqueia truncamento em 1366×768. | Concluído 05.9 |
| P3 | Legibilidade no mínimo técnico | Em largura técnica, especificações longas e células de embalagem usam elipse; a estrutura permanece contida, mas informação comercial pode ficar oculta. | Diferenciar truncamento editorial aceitável de dado obrigatório; dados comerciais devem oferecer modo, tooltip ou ajuste de densidade que preserve acesso ao valor completo. | Confirmado; avaliar com presets |

## Histórico de observações e entregas

| Prioridade | Tema | Problema observado | Direção proposta | Incremento-alvo | Estado |
| --- | --- | --- | --- | --- | --- |
| P1 | Cabeçalho e rodapé | Os componentes se comportavam como átomos únicos, não como coleções editáveis. | Transformá-los em contêineres compostos, com peças, slots, ordem e edição interna. | 04.2 | Concluído |
| P1 | Hierarquia dos painéis | Biblioteca, camadas e propriedades exigiam scroll longo para revelar informação. | Criar hierarquia informacional com abas, preservando contexto e reduzindo scroll obrigatório. | 04.2 | Concluído |
| P2 | Zoom do workspace | O seletor funcionava, mas faltava ajuste fluido no centro da página. | Manter o seletor e capturar `Ctrl/Cmd + roda` sobre o workspace para alterar apenas a escala da A4. | 04.2 | Concluído |
| P3 | Contraste do zoom | Opções do seletor podiam aparecer com texto branco sobre fundo branco. | Normalizar `color`, `background-color` e `color-scheme` de `select/option`. | 04.2 | Concluído |
| P2 | Ênfase contextual | Selecionar um card não evidenciava suficientemente os átomos e moléculas pertencentes. | Realçar a subárvore no canvas e na árvore de camadas. | 04.2 | Concluído |
| P3 | Área em linha | A Área de composição inicia em modo livre, embora a expectativa mais frequente seja organizar os primeiros filhos em linha. | Alterar o default de novos componentes para `row`; preservar o modo salvo em documentos existentes. | 04.3 | Concluído |
| P1 | Reflow recursivo de slots | Reajustar um pai ainda podia redimensionar filhos sem reaplicar **Reajustar ao slot** nos próprios descendentes e irmãos afetados. | Usar modo **Auto** por padrão e **Manual** como override; no Auto, propagar reflow pai→filhos→slots e irmãos afetados, com proteção contra ciclos. | 04.5 | Concluído |
| P2 | Numeração de cards | Novos cards não mantinham uma sequência editorial assistida e conflitos manuais não orientavam a renumeração. | Incrementar ao adicionar; ao repetir um número, perguntar se deve compactar os posteriores; ao informar valor acima da contagem, perguntar se a sequência futura deve continuar desse valor. | 05.0 | Concluído |
| P2 | Biblioteca de componentes personalizados | Um componente editado ainda não podia ser preservado para reutilização em outras composições. | Salvar a subárvore selecionada em **Meus componentes**; ao inserir, gerar novos IDs e preservar estrutura, tokens, conteúdo, assets e valores de tabela independentes. | 05.0 | Concluído |
| P2 | Galeria com legenda por imagem | A cobertura anterior tratava uma legenda por átomo `art`, mas a referência dos itens 04 e 07 combina várias imagens/variações no mesmo card, cada uma com sua própria legenda. | Composição `art-gallery` ordenável, com legenda vinculada individualmente a cada imagem e layout adaptável à quantidade de variações. | 05.0 | Concluído |
| P1 | Inventário e cards vinculados | Conteúdo de produto ainda precisava ser repetido manualmente em cada card. | Coleção `products`, aba Inventário e `binding.productId`; atualizações propagam apenas campos não sobrescritos e preservam IDs da árvore. | 05.1 | Concluído |
| P2 | Apresentação separada do produto | Um snapshot de card misturava estrutura visual e conteúdo, dificultando trocar a apresentação sem perder o vínculo. | Classificar templates de card como `product-presentation`, aplicar estrutura/tokens preservando número, `productId`, conteúdo e overrides. | 05.1 | Concluído |
| P2 | Seleções e subcatálogos | Faltava criar recortes reutilizáveis do catálogo geral. | Seleção por produto e coleção `subcatalogs` com `productIds` estáveis, sem copiar as entidades. | 05.1 | Concluído |
| P3 | Legenda cromática vinculada à tabela | Cores de células e legendas ainda seriam edições independentes, sujeitas a inconsistência. | Modelar uma legenda semântica por chave estável; regras condicionais avançadas permanecem em Discovery. | 05.4 | MVP concluído |
| P3 | Escala e espaçamento interno dos átomos | Alguns átomos têm formatação pouco consistente ou responsabilidade visual excessiva. | Expor fonte, ícone, padding e gap por presets e ajustes limitados, sem CSS arbitrário. | posterior | Definido |
| P1 | Mínimo de card em composição | Tabela podia ser parcialmente cortada ao aplicar tamanho mínimo dentro de Área de composição. | Medir o mínimo real dos filhos de slots ao recalcular o card. | 04.3 | Concluído |
| P2 | Distribuição de composição | Faltavam opções editoriais de distribuição além do gap fixo. | Expor padding, espaçamento, preencher, space between e space around. | 04.3 | Concluído |
| P2 | Ocupação de slots | Capacidade ainda contava itens, sem reserva de múltiplos espaços por peça. | Persistir `slot.span`, calcular capacidade em unidades e distribuir linha/coluna/grade proporcionalmente. | 04.4 | Concluído |
| P2 | Linha editorial | Linha do cabeçalho era desenho estrutural e inconsistia no PDF. | Átomo separador com orientação, pontas e marcador. | 04.3 | Concluído |
| P1 | Fidelidade da visualização PDF | A visualização de impressão diferia do canvas, principalmente na espessura e terminação de linhas finas. | Criar comparação visual canvas×PDF, normalizar espessuras físicas e evitar arredondamento subpixel no modo de impressão. | 04.5 | Concluído |
| P1 | Mínimo vertical de composição | A Área de composição podia ser reduzida verticalmente além do mínimo real de cards, atravessando a tabela inferior. | Calcular o mínimo do pai com a geometria final dos descendentes após reflow e bloquear resize antes de qualquer sobreposição/corte. | 04.5 | Concluído |
| P2 | Colapso de tipos internos | Em componentes compostos por tipos diferentes, remover todas as peças de um tipo podia manter um espaço vazio reservado. | O último item removido libera sua geometria; a aba **Estrutura** oferece **Adicionar “nome do item”** para recriar a peça e reaplicar o layout. | 04.6 | Concluído |
| P3 | Separador contextual por espaçamento | Espaços amplos entre itens não ofereciam uma ação contextual para inserir uma linha editorial. | Acima de três vezes a espessura mínima do `separator`, oferecer a linha entre pares adjacentes, sem consumir espaço do auto-layout. | 04.6 | Concluído |
| P1 | Composição do item de rodapé | `footer-item` concentrava texto e desenho do ícone na mesma molécula; por isso, alterar a cor vetorial não produzia o resultado esperado. | Cada item passou a conter átomos `icon`, título e complemento, com slots editáveis e migração das props legadas. | 04.6 | Concluído |
| P1 | Área de composição no PDF | O fundo, a borda ou os indicadores da Área de composição ainda podiam aparecer na visualização PDF. | Tratar `layout-container` como estrutura exclusiva do editor na impressão: tornar envelope e conteúdo auxiliar transparentes sem ocultar seus filhos. | 04.6 | Concluído |

## Regra entregue para numeração

- novos cards recebem o próximo número da sequência atual;
- uma alteração manual para número já existente pode manter a duplicidade;
- antes disso, a interface pergunta se deve compactar os números posteriores à posição original — por exemplo, ao trocar o card `3` por `1`, `4` pode virar `3` e `5` virar `4`;
- ao informar um valor acima da contagem atual, a interface pergunta se novos cards devem continuar a partir desse novo valor;
- a confirmação nunca será implícita e não reescreverá títulos ou outros conteúdos.

## Regras entregues para componentes reutilizáveis e galerias

- **Salvar em Meus componentes** captura uma cópia completa da subárvore selecionada;
- a coleção `templates` guarda o snapshot e suas dependências de linhas de tabela, sem copiar bytes de assets;
- cada inserção renova IDs de componentes, materializa novos `rowIds` e preserva referências de assets existentes;
- cards inseridos por template ou duplicação entram na sequência editorial vigente;
- `art-gallery` é um contêiner de auto-layout que aceita átomos `art` ordenáveis;
- legenda, asset, fit, ponto focal e cor vetorial continuam pertencendo a cada imagem, sem propriedade compartilhada implícita;
- o envelope da galeria é editorial no canvas e fica invisível no PDF, preservando as imagens internas.

## Regras entregues para inventário e binding

- `products` é a fonte de conteúdo reutilizável e cada item normaliza título, duas especificações, código, embalagem, preço e arte principal;
- `product-card.binding.productId` aponta para a entidade, enquanto `templateId` identifica somente sua apresentação;
- alterar um produto atualiza os nós e a primeira linha já existentes, sem trocar IDs de card, peças ou `rowIds`;
- editar título, especificação, célula ou arte de um card vinculado ativa o override local correspondente;
- desativar um override reaplica imediatamente o campo do inventário, sem afetar os demais;
- aplicar um template de apresentação preserva ID, frame, slot, número editorial, produto e conteúdo local; a troca estrutural é explícita;
- inserir o mesmo item de **Meus componentes** por drag and drop continua criando um snapshot autônomo com novos IDs;
- subcatálogos guardam somente uma lista validada de `productIds`; excluir o recorte nunca exclui produtos;
- remover um produto em uso exige confirmação de detach e converte os cards para conteúdo local, preservando a última apresentação.

## Definição do MVP para legenda cromática de tabelas

- o vínculo usa chave estável de domínio, não comparação com texto literal;
- a legenda pertence ao documento ou conjunto de dados e pode ser reutilizada por tabelas;
- a entrada define superfície e texto como tokens coordenados;
- células guardam a chave sem copiar a cor;
- editar a legenda atualiza todos os usos;
- excluir uma entrada cria aviso e fallback neutro;
- duplicar tabela ou card preserva a referência sem duplicar a legenda;
- precedência: override local → entrada semântica → coluna → tabela;
- texto e rótulo continuam transmitindo o significado sem depender da cor;
- regras condicionais, intervalos e concorrência entre múltiplas legendas permanecem em Discovery.

## Regras entregues para composição interna dinâmica

- remover o último filho de um tipo não remove o contrato do slot; remove apenas sua reserva geométrica;
- o restante do componente é recalculado pelo mesmo reflow Auto/Manual já existente;
- a aba **Estrutura** exibe **Adicionar “nome do item”** somente para tipos opcionais ausentes e aceitos pelo contêiner;
- recriar um tipo gera um novo ID, restaura o slot e a ordem sem recuperar silenciosamente conteúdo excluído;
- a ação de inserir separador aparece apenas quando o espaço disponível é maior que `3 ×` sua espessura mínima e existe um par de itens adjacentes válido;
- a orientação do separador acompanha o eixo de distribuição, preservando terminação, grid e tokens;
- `footer-item` continua selecionável e movível como molécula, mas texto e ícone passam a ser filhos independentes;
- a cor vetorial pertence ao átomo `icon`; a migração preserva rótulo, detalhe, símbolo e token de cor dos itens legados.

## Critérios transversais

- preservar o JSON como fonte de verdade;
- manter coordenadas locais e contratos de slots;
- não substituir o zoom lógico por zoom persistido do navegador;
- evitar mudanças destrutivas em documentos migrados;
- acrescentar teste visual/funcional para cada correção de interface.
- nunca fabricar preço, código, medida ou especificação durante geração ou reparo;
- validar pacotes externos antes de persistir documento ou assets;
- registrar versão do kit, decisões, fallbacks e avisos da geração.
