# Backlog de produto e usabilidade

Registro consolidado das observações recebidas após o Incremento 04. As prioridades orientam a sequência, mas não substituem validação de interface. A direção canônica está em `PRODUCT-DEFINITION.md`; itens concluídos abaixo permanecem como histórico.

## Fila priorizada após o Incremento 05.14

Esta fila é a referência operacional para novos incrementos. O registro consolidado abaixo preserva decisões e entregas anteriores, mas não deve ser usado isoladamente para escolher o próximo trabalho.

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
| P1 | Seleção contextual ainda cobra correção | Implementação 05.17: transição atômica e contratos de pai/filho/irmão; confirmar zero tentativa no próximo benchmark Chromium. |
| P1 | Geometria domina o fluxo manual | Checkpoint 05.17: equalização, valores exatos e deltas sobre seleção; preview e relações persistentes permanecem posteriores. |
| P1 | Composição final permanece inválida | Mesmo alvo encerra com zero colisão e zero overflow, sem retirar edição individual. |
| P2 | Galerias exigem edição imagem por imagem | Entrada de coleção permite adicionar imagens/legendas em lote e refinar exceções. |
| P2 | Legendas exigem três ações por definição | Entrada de coleção materializa várias definições e itens visuais em uma transação. |

O relatório comparável está em `REFERENCE-RECONSTRUCTION-USABILITY-AUDIT-05.16.md`. A revisão posterior corrige a interpretação: geometria exata permanece central, mas deve cooperar com manipulação direta, relações e conjuntos em vez de depender de campos isolados.

### Frentes congeladas

Expansão multimídia, hospedagem, colaboração, touch/mobile completo e workflow de publicação não possuem incremento ativo. PDF continua no núcleo de fidelidade; portabilidade existente é apenas mantida.

### Definido, mas fora do próximo incremento

| Prioridade | Frente | Decisão já canônica | Gatilho de entrada |
| --- | --- | --- | --- |
| P2 | Hospedagem estática por Git | Decisão preservada, sem implementação no ciclo atual. | Descongelamento explícito após fidelidade/confiabilidade. |
| P1 | Snapshots locais | Contrato portátil preservado; nenhuma expansão operacional. | Descongelamento explícito. |
| P2 | Sala browser-only | Direção local-first preservada, sem protótipo ou infraestrutura. | Descongelamento explícito. |
| P2 | Fundamentos touch/mobile | Apenas guardrails contra dependência exclusiva de mouse/hover/teclado. | Descongelamento explícito. |
| P2 | Documento multipágina | Pausado, não congelado; depende de layout e reflow confiáveis. | Resultados dos Incrementos 05.14–05.16. |

### Discovery congelada

- regras condicionais avançadas entre dados de tabela e legendas cromáticas;
- política exata de autoaceite de comandos/objetos em uma sala;
- retenção e inclusão do log colaborativo em snapshots;
- limite de participantes validado por benchmark;
- critérios objetivos para reconsiderar TURN;
- escopo de revisão/correção em touch depois da nova medição manual.

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
| P1 | Redução de ações manuais | Agrupar cadastro, vínculo, preenchimento e composição repetitivos sem retirar controle nem edição individual. | Histórico, inventário, tabelas | 05.16: 223 ações, −16,5% desde 05.12 e −30,1% desde a base |
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
| P2 | Paginação e balanceamento | Distribuir produtos e seções em múltiplas páginas sem overflow, preservando intenção e ordem. | Compilador, multipágina | Pausado até 05.14–05.16 |
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
| P1 | Overflow interno do rodapé | No mínimo técnico `500×80`, após remover um `footer-item`, filhos restantes ultrapassam o limite inferior do rodapé e textos internos são truncados. | O mínimo efetivo deve considerar a geometria final dos átomos do rodapé; nenhum filho pode sair do pai em Auto. | Reaberto após 04.6 |
| P1 | Colapso incompleto no card | Após remover arte e todas as especificações, o card permanece com mínimo calculado de 334 px e conserva um grande espaço vazio entre título e tabela. | Remover o último filho de um tipo deve liberar sua reserva, recompor slots restantes e recalcular o mínimo do card. | Reaberto após 04.6 |
| P2 | Recomendado personalizado inalcançável | Um card com três linhas aceita recomendado `310×240`, mas a transição para modo compacto eleva o mínimo calculado para `310×334`; o valor salvo não pode ser atingido pelo resize. | Ao editar o recomendado, mostrar o mínimo calculado para o conteúdo e avisar ou ajustar valores atualmente inalcançáveis, sem transformar o recomendado em barreira rígida. | Confirmado |
| P2 | Descontinuidade de mínimo por breakpoint | Ao reduzir a largura do card de 350 para 310 px, o layout compacto aumenta o mínimo vertical de 278 para 334 px. A mudança é correta estruturalmente, mas pouco previsível. | Preview e inspector devem antecipar a troca de modo e explicar a consequência vertical antes do commit do resize. | Confirmado |
| P2 | Rótulos do editor sobrepostos | No card técnico há contato entre o rótulo do pai e **Título com símbolo**; no rodapé técnico, rótulos de pai, itens e ícones se sobrepõem fortemente. | Rótulos exclusivos do editor devem usar empilhamento, deslocamento ou redução contextual sem cobrir conteúdo ou outros rótulos; não afeta a projeção de PDF. | Confirmado |
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
