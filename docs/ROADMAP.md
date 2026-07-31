# Roadmap incremental

## Incremento 00 — Fundação arquitetônica ✅

- modelo JSON versionado;
- registro de tipos;
- biblioteca de tokens;
- schema inicial;
- separação de domínio, renderização, inspetor e interações;
- decisões arquitetônicas documentadas.

## Incremento 01 — Editor base A4 ✅

- página A4 vazia;
- drag and drop da biblioteca;
- cabeçalho, card, rodapé, arte/logo, ícone SVG e texto;
- seleção e lista de camadas;
- painel lateral por tipo;
- cores, tipografia, bordas e raios por seleção de token;
- movimento e resize básico;
- snap no grid;
- override com `Alt`;
- trava de eixo com `Shift`;
- salvamento local;
- exportação JSON.

## Incremento 02 — Containers, slots e edição interna ✅

Critérios de aceite:

- entrar e sair de um componente;
- breadcrumb de contexto;
- filhos em coordenadas locais;
- slots de título, arte, especificações e tabela;
- inserir, substituir e reordenar filhos;
- card continua selecionável como unidade.

## Incremento 03 — Layout e snap inteligente ✅

Critérios de aceite:

- guias por borda e centro;
- alinhamento por distâncias iguais;
- tolerância magnética;
- override por eixo;
- auto-layout em linha, coluna e grid;
- redimensionamento com conteúdo mínimo calculado;
- regras responsivas por largura.

## Incremento 03.1 — Estabilização do editor ✅

Critérios de aceite:

- interface utilizável em 1366×768 com zoom do navegador em 100%;
- painéis esquerdo e direito recolhíveis;
- A4 ajustada automaticamente à área disponível;
- recoloração independente de ícones/vetores por token;
- duplicação simples de componentes e subárvores;
- contrato de coleções genéricas sem binários/base64 no documento;
- matriz de cobertura da imagem de referência;
- schema 1.3.0, migração e testes atualizados.

## Incremento 04 — Biblioteca de artes ✅

Critérios de aceite:

- upload e drag and drop de arquivos;
- logo como arte com role `logo`;
- SVG, PNG, JPG e WebP;
- fit, recorte e ponto focal;
- metadados e reutilização de assets;
- placeholders substituíveis sem destruir layout.

Implementado com coleção `assets` referencial, blobs em IndexedDB, limite de 25 MB, metadados de dimensão/MIME, seletor que prioriza itens do projeto e migração para o schema 1.4.0.

## Incremento 04.1 — Conteúdo repetível e composição ✅

Critérios de aceite:

- tabelas derivadas de coleções genéricas com múltiplas linhas;
- legendas vinculadas a artes;
- duplicação direcional para esquerda/direita e deslocamento configurável;
- distribuição de cópias com espaçamento explícito;
- cobertura e testes sem acoplar essas regras ao pipeline binário de assets.

Implementado com coleção `tableRows`, referências ordenadas por `rowIds`, altura mínima derivada da quantidade de linhas, legendas como propriedade de `art`, cópias independentes e migração para o schema 1.5.0.

## Incremento 04.2 — Hierarquia estrutural e navegação ✅

Critérios de aceite:

- transformar cabeçalho e rodapé em contêineres compostos por peças editáveis;
- separar biblioteca, camadas e propriedades por abas ou navegação superior equivalente;
- reduzir scroll obrigatório e explicitar hierarquia informacional;
- destacar átomos e moléculas pertencentes ao card selecionado;
- zoom do workspace por `Ctrl/Cmd + roda`, sem alterar o zoom do navegador e preservando o seletor;
- corrigir contraste das opções do seletor de zoom.

Implementado com cabeçalho de três slots, rodapé com coleção de moléculas, abas nos dois painéis, subárvore enfatizada, zoom lógico intermediário e migração para o schema 1.6.0.

## Incremento 04.2.1 - Impressão e PDF A4 da página atual ✅

Critérios de aceite:

- ação **Imprimir / PDF** abre o diálogo nativo;
- a página atual é projetada em A4 vertical, sem escala do workspace, grid ou controles do editor;
- o usuário pode escolher **Salvar como PDF** sem backend nem duplicação do documento JSON;
- a limpeza do estado de impressão restaura o editor após fechar o diálogo.

Implementado com `window.print()`, CSS `@page`/`@media print`, nome transitório `catalogo-a4` e teste de navegador. O schema continua em 1.6.0.

## Incremento 04.3 — Layout editorial e linhas ✅

Entregue:

- novas Áreas de composição iniciam em modo `row`;
- distribuição por preenchimento, `space between` e `space around`;
- padding e espaçamento configuráveis;
- cálculo de mínimo de filhos nos slots;
- átomo de linha separadora usado pelo cabeçalho.

O reflow recursivo Auto/Manual e o bloqueio vertical completo foram refinados pelas capturas e movidos para o 04.5.

## Incremento 04.4 — Ocupação múltipla de slots ✅

- capacidade ponderada por `slot.span`;
- controle de ocupação no inspetor;
- distribuição proporcional em slots de linha, coluna e grade;
- migração para o schema `1.7.0`;
- compatibilidade com inserção, duplicação, movimentação e substituição.

## Incremento 04.5 — Consistência recursiva e saída visual ✅

Entregue:

- reflow recursivo em modo Auto por padrão, com override Manual;
- mínimo vertical do pai calculado após reflow completo dos descendentes;
- comparação visual canvas×PDF e estabilização física de linhas finas.

## Incremento 04.6 — Estruturas opcionais e PDF limpo ✅

Entregue:

- colapso automático de tipos internos ausentes e ação estrutural para recriá-los;
- separador contextual quando o espaçamento supera três espessuras mínimas;
- itens de rodapé compostos por átomos independentes de ícone e texto;
- migração compatível por `structureInitialized` no schema `1.9.0`;
- Área de composição invisível no PDF, com filhos preservados;
- remoção de outlines editoriais das subárvores na impressão.

## Incremento 05.0 — Reuso editorial, galerias e numeração ✅

Entregue:

- componentes editados salvos como snapshots reutilizáveis na categoria **Meus componentes**;
- inserção com novos IDs, referências de assets preservadas e linhas de tabela independentes;
- `art-gallery` com múltiplas imagens ordenáveis e legenda própria por imagem, cobrindo os itens 04 e 07 da referência;
- numeração incremental de cards;
- confirmação para compactar conflitos e opção de continuar a sequência a partir de um valor manual superior;
- migração para o schema `1.10.0`.

## Incremento 05.1 — Inventário e binding de conteúdo ✅

Entregue:

- catálogo geral de produtos;
- seleção de itens;
- card vinculado por `productId`;
- template separado do conteúdo;
- overrides locais explícitos;
- atualização de preço sem reconstruir página;
- criação de subcatálogo;
- distinguir templates de apresentação vinculada dos snapshots autônomos já entregues em **Meus componentes**.
- coleção `subcatalogs` com seleção persistida de produtos;
- migração para o schema `1.11.0`.

## Definição canônica — Produto data-first e autoria por agente ✅

Direção aceita:

- o produto é um compilador editorial orientado a dados com editor visual secundário;
- um `CatalogAuthoringKit` versionado é entregue uma única vez a um chat, projeto ou agente;
- cada criação recebe somente dados disponíveis e considerações opcionais;
- preferências ausentes ficam a cargo do agente; fatos ausentes nunca são inventados;
- o agente escolhe reutilizar, gerar, omitir, usar placeholder ou solicitar assets conforme política explícita;
- `CatalogSource`, `CatalogGenerationPlan`, `CatalogDocument` e `CatalogProjectPackage` possuem responsabilidades separadas;
- o pacote final contém JSON, assets, manifestos e relatório e deve ser importável para revisão e PDF.

Referências: `PRODUCT-DEFINITION.md`, `LLM-CATALOG-AUTHORING-FLOW.md`, `ASSET-AUTHORING-POLICY.md`, `ADR-014-agent-authored-portable-catalogs.md` e `ADR-015-risk-based-asset-generation.md`.

## Incremento 05.2 — Segurança de edição e importação JSON ✅

Entregue:

- histórico transacional de até 100 ações com desfazer/refazer e coalescência;
- `Novo documento` separado de futuras ações de página;
- importação de JSON com análise, migração e preview antes da substituição;
- commit atômico confirmado e recuperação do documento anterior por Desfazer;
- estado sujo/salvo e sessão transitória opcional, omitida da exportação autoral;
- bloqueio de schema futuro, tipos desconhecidos, IDs duplicados e frames inválidos;
- relatório de referências indisponíveis e dependências locais de IndexedDB;
- testes de documentos válidos, migráveis, inválidos e malformados;
- migração para o schema `1.12.0`.

## Incremento 05.3 — Pacote portátil e manifestos de autoria ✅

Entregue:

- importar e exportar `CatalogProjectPackage` com manifesto e assets;
- verificar caminhos, MIME, tamanho e hashes antes de persistir arquivos;
- remapear referências portáteis para o storage local;
- manifesto declarativo de componentes, templates, tokens, ícones e capacidades;
- primeira versão do `CatalogAuthoringKit` com guide, schemas e exemplos;
- relatório de importação com erros, avisos e informações;
- contrato inicial de proveniência e estado de publicação dos assets;
- política Assistida registrada no manifesto do projeto.
- preflight de ZIP com bloqueio de path traversal, criptografia, ZIP64 e limites de descompactação;
- migração para o schema `1.13.0`.

## Incremento 05.4 — Conteúdo semântico, apresentações e UI progressiva ✅

Entregue:

- `CatalogSource 1.0.0` extensível para produtos, atributos, destaques, aplicações, variantes e papéis de assets;
- tabelas por colunas e valores semânticos arbitrários;
- vocabulário de template, modo, densidade, estado responsivo, preset, override e snapshot;
- requisitos, estados aceitos e fallbacks de asset por preset oficial;
- presets compacto, padrão e confortável para escala/espaçamento interno;
- mínimo técnico separado do recomendável/personalizado;
- inspetor priorizado por Intenção, Composição e Exato, com divulgação progressiva;
- legenda cromática por chave estável, token e fallback textual acessível;
- gates separados para pacote de rascunho e pacote para publicação;
- migração para o schema `1.14.0`.

## Incremento 05.5 — Plano editorial, compilador e validação ✅

Entregue:

- schema `CatalogGenerationPlan 1.0.0`, plano `hero-grid` automático e alternativa `grid-only`;
- compilador determinístico para IDs, componentes, slots, frames, linhas e bindings;
- decisões documentadas de template, modo, densidade e fallback;
- validação estrutural, referencial, editorial e geométrica integrada ao pacote;
- reparos automáticos limitados a arredondamento seguro de até 2 px;
- exemplo de referência compilado com 7 produtos, 16 linhas, zero colisões e zero overflow;
- importação direta de `CatalogSource` em três ações e uma transação reversível;
- `CatalogAuthoringKit 1.1.0` com CLI e runtime autocontido;
- migração para `CatalogDocument 1.15.0`.

## Incremento 05.6 — Eficiência da construção manual ✅

Entregue:

- colagem de produtos vindos de Excel, Sheets, TSV ou CSV;
- criação, organização e vínculo de cards a partir da seleção do inventário;
- colagem de várias linhas na tabela selecionada;
- modos substituir e acrescentar com limite seguro de 12 linhas;
- operações compostas atômicas e reversíveis;
- sete produtos e sete cards em cinco ações manuais observáveis;
- distinção documental entre ações automatizadas e ações da construção manual;
- reflow imediato ao alterar apresentação e correção da grade de especificações em modo compacto.

## Incremento 05.7 — Refinamento manual em lote ✅

Entregue:

- multisseleção contextual de irmãos no canvas e em Camadas;
- `Shift/Ctrl/Cmd+clique` e `Ctrl/Cmd+A` no contexto aberto;
- alinhamento e distribuição por uma única transação;
- aplicação de preset, modo, densidade e tokens aos itens elegíveis;
- duplicação e exclusão de conjunto com um único desfazer;
- inspetor específico de seleção múltipla;
- refinamento de densidade de sete cards em duas ações observáveis;
- preservação do fluxo individual e do schema autoral sem estado de sessão obrigatório.

## Incremento 05.8 — Estruturas prontas e inserção contextual ✅

Entregue:

- registro oficial e versionado de receitas, separado dos templates salvos pelo usuário;
- página-base composta por cabeçalho, conteúdo principal e rodapé em uma transação;
- foco automático no papel `primary-content` após a criação da página-base;
- faixas prontas de aplicações, legenda de embalagens e dica editorial;
- inserção por `+` no primeiro slot compatível ou espaço livre, mantendo drag and drop para posicionamento exato;
- hidratação dos filhos padrão de cabeçalho e rodapé sem duplicar o modelo de documento;
- manifesto de receitas no `CatalogAuthoringKit 1.2.0`;
- página-base e sete cards vinculados em seis ações, com zero colisão e zero overflow.

## Incremento 05.9 — Ações contextuais e composição em lote ✅

Entregue:

- `+` contextual para adicionar linha à tabela, converter arte em galeria e acrescentar imagens;
- preservação do ID, asset e conteúdo da arte original na conversão;
- gap uniforme horizontal, vertical ou automático para seleções irmãs;
- separadores em lote com cinco presets oficiais e edição posterior como átomos comuns;
- integração ao auto-layout quando o conjunto selecionado corresponde aos filhos gerenciados;
- toggles para estados binários persistentes;
- inspetor reorganizado em Conteúdo, Layout, Visual e divulgação Avançada;
- saneamento geométrico da toolbar e das abas esquerdas em `1366×768`;
- `CatalogAuthoringKit 1.3.0` com ações e presets declarados.

## Incremento 05.10 — Variantes semânticas e legendas visuais ✅

Entregue:

- identidade estável de variante vinculando imagens e linhas comerciais;
- ação **Adicionar variação** com materialização automática opcional;
- painel de legenda composto por grupos e itens editáveis;
- criação ou reutilização de item visual ao adicionar uma definição de legenda;
- células, itens e tokens vinculados por `legendKey`, com fallback textual;
- migração conservadora das legendas cromáticas do 05.4;
- validação de contraste, vínculos quebrados e fatos ausentes antes da publicação.
- `CatalogDocument 1.16.0`, `CatalogSource 1.1.0` e `CatalogAuthoringKit 1.4.0`;
- `+` contextual para grupos e itens de legenda, com uma transação por materialização.

## Incremento 05.11 — Saneamento visual e atlas funcional ✅

Critérios de aceite:

- barra de comandos sem corte, colisão ou scroll horizontal em 1280, 1366 e 1800 px;
- comandos de documento sempre descobríveis e preferências de visualização agrupadas progressivamente;
- cards da biblioteca com regiões independentes para conteúdo, `+` e menu secundário;
- ações essenciais acessíveis por teclado e sem dependência de hover;
- inventário de capacidades gerado a partir do manifesto;
- primeiro guia curado de funcionalidades, com intenção, acesso, pré-condições, exemplo, limites e IDs de contrato;
- testes geométricos e screenshots que cubram as duas regressões visuais;
- nenhuma mudança de schema salvo se uma inconsistência for descoberta e promovida explicitamente.

Entregue com `CatalogAuthoringKit 1.5.0`, inventário gerado, quinze fluxos curados e cobertura de regressão dedicada. `CatalogDocument` permanece em `1.16.0`.

## Incremento 05.12 — Auditoria de construção manual e intenção contextual ✅

Critérios de aceite:

- repetir a referência usada na linha de base de 319 ações em `1366×768`, somente pela interface pública;
- contar cliques, preenchimentos, arrastes, trocas de contexto, correções e tentativas sem efeito;
- relacionar frequência de uso, dificuldade, severidade e capacidade de representação;
- comparar geração automatizada e construção manual sem misturar as métricas;
- propor a próxima redução de ações a partir dos dados, sem implementar otimizações durante a medição.

Entregue com ensaio integral em Chromium real e somente pela interface pública: **267 ações**, contra 319 na linha de base (−52; **−16,3%**), 39 trocas de contexto, 43 mudanças de foco, 29 correções e 7 tentativas sem efeito. A reconstrução alcançou 65% da matriz visual, mas terminou com 8 colisões e 2 overflows; tabelas e geometria responderam por 157 ações (58,8%). A evidência inclui JSON, log categorizado, screenshots e PDF A4. `CatalogDocument` permanece em `1.16.0` e o kit passa a `1.5.1` para identificar o editor 05.12.

## Incremento 05.13 — Auditoria subtrativa e governança de recursos ✅

Critérios de aceite:

- inventariar todas as capacidades declaradas e atribuir estado de governança;
- mapear intenções para caminhos de interface e identificar autoridades concorrentes;
- testar o papel real do reflow Auto/Manual e dos reajustes de slot/auto-layout;
- formalizar política de consolidação, depreciação e remoção compatível;
- congelar expansão multimídia, plataforma online, touch/mobile e publicação;
- preservar schema e documentos anteriores enquanto o caminho substituto não existir.

Entregue com governança das 35 capacidades: 20 ativas, 5 mantidas, 5 em auditoria, 4 congeladas e 1 pausada. O teste de autoridade confirmou que o reflow Auto restaura overrides descendentes e o Manual preserva exceções ao interromper garantias recursivas. Nenhuma remoção ou migração foi feita; `CatalogDocument` permanece em `1.16.0` e o kit passa a `1.5.2`.

## Incremento 05.14 — Confiabilidade estrutural e autoridade de layout ✅

Critérios de aceite:

- substituir a escolha técnica Auto/Manual por autoridade gerenciada/independente/reintegrar no fluxo normal;
- manter overrides locais duráveis sem desligar validade recursiva da subárvore;
- tornar previsível o commit geométrico e expor valor solicitado, resolvido e motivo;
- permitir selecionar uma camada fora do contexto atual sem clique silenciosamente inerte;
- estabilizar galeria, dica e legenda em larguras compactas;
- excluir mensagens transitórias da projeção PDF e apresentar diagnóstico de saída;
- preservar leitura do schema 1.16.0 e definir janela de depreciação sem quebra.

Entregue com autoridade local durável, reintegração explícita, seleção entre contextos, geometria solicitada/resolvida e preflight de impressão. O recálculo deixa de reativar exceções descendentes; `reflow.mode` permanece apenas para leitura compatível. A estabilização visual específica de galeria, dica e legenda foi mantida no 05.15 para ser tratada junto das receitas, sem misturar novamente autoridade estrutural e presets. `CatalogDocument` permanece em `1.16.0` e o kit passa a `1.5.3`.

## Incremento 05.15 — Comandos compostos e receitas focais ✅

Critérios de aceite:

- criar camada de comandos semânticos compartilhada por UI, histórico, compilador e kit;
- salvar e aplicar esquemas de tabela separadamente dos valores comerciais;
- aplicar esquema a uma seleção compatível com preview e exceções locais;
- organizar seleção como hero + grade + faixa final sem criar modelo paralelo;
- consolidar duplicação e separadores em superfícies progressivas;
- garantir uma transação reversível por comando.

Entregue: destino contextual para `+`/arraste com override por `Shift`, variação semântica em uma transação, dica responsiva a 236 px, galeria compacta de cinco imagens, contraste de legendas, quatro esquemas reutilizáveis, aplicação em lote e organização hero + grade + faixa. Os comandos materializam o modelo existente e permanecem reversíveis; `CatalogDocument` continua em `1.16.0` e o kit passa a `1.5.5`.

## Incremento 05.16 — Interface orientada à tarefa e nova medição

Critérios de aceite:

- manter aba, disclosure e tarefa ao navegar entre itens equivalentes;
- priorizar ações por intenção atual sem esconder o escape hatch avançado;
- repetir separadamente criação manual, geração e refinamento do catálogo gerado;
- medir ações, correções, trocas de contexto, tentativas sem efeito e validade final;
- demonstrar zero ação silenciosa e zero colisão/overflow produzidos por receitas oficiais.

Concluído: memória de aba/disclosures por tipo durante a sessão, diagnóstico explícito para inserções sem resultado, correção geométrica da receita hero + grade + faixa e reconstrução integral comparável. O benchmark caiu de 267 para 223 ações; tabelas caíram de 82 para 56 e overflows de dois para zero. O próximo ciclo deve atacar seleção contextual, ações geométricas de grupo e coleções de galeria/legenda até a mesma composição terminar sem colisões.

## Incremento 05.17 — Geometria orientada por intenção

Critérios de aceite:

- preservar geometria exata como capacidade central;
- fundir seleção e transição de contexto em uma ação;
- reunir manipulação relacional e numérica na multisseleção;
- equalizar dimensões, aplicar valores exatos e deslocar por delta em transações reversíveis;
- manter mínimos, autoridade local e geometria solicitada/resolvida;
- adiar constraints persistentes até que relações efêmeras demonstrem insuficiência.

Checkpoints 1–3 concluídos: seleção atômica, relações, valores exatos, deltas, diagnóstico, coleções em lote e grade de caixas heterogêneas. O `SIGSEGV` foi isolado em uma cópia Chromium truncada. No runtime íntegro, o benchmark integral caiu de 223 para 157 ações e terminou com zero colisão/overflow. Preview anterior ao commit e constraints persistentes continuam adiados por falta de evidência de necessidade.

## Incremento 05.18 — Profundidade da biblioteca e linguagem editorial

Critérios de aceite:

- manter os dezesseis tipos atuais durante o primeiro checkpoint e aprofundar os átomos existentes antes de ampliar o registro;
- oferecer composição tipográfica previsível com alinhamento, escala discreta e overflow explícito;
- oferecer escala interna de ícone sem depender de redimensionar a caixa externa;
- tornar os modos de `product-card` visual e geometricamente distintos usando a mesma estrutura canônica;
- preservar tokens, histórico, mínimos, PDF e documentos 1.16.0;
- reservar `section-heading` e `fact` como únicas candidatas imediatas, sujeitas a teste de intenção após a consolidação;
- reorganizar futuramente a descoberta por intenção, mantendo peças internas e `layout-container` disponíveis no caminho avançado.

O incremento não reabre expansão multimídia, publicação, colaboração ou touch/mobile. Também não introduz editor rico, CSS arbitrário nem famílias redundantes de preço, selo, botão, QR code ou tabela.

## Incremento 05.20 — Linguagem promocional e integração multirreferência

Critérios de aceite:

- preservar os dezesseis tipos e o schema 1.16.0;
- representar ofertas comerciais repetidas como receitas nativas editáveis, não como tabela;
- tratar personagem, calendário, ilustração e desenho técnico como assets;
- manter valores de preço completos em tela e impressão;
- validar catálogos técnico e promocional em Chromium;
- preservar PDF A4, pacote portátil, reimportação, histórico e hashes de assets;
- carregar contratos obrigatórios de forma estática e bloquear inicialização parcial;
- executar a suíte integral por um workflow somente leitura e reproduzível;
- integrar por branch limpa e PR draft antes de qualquer merge em `development`.

O incremento foi integrado em `development` com os gates Node, build e Chromium aprovados.

## Incremento 05.21 — Navegação contextual e painéis

Entregue:

- breadcrumb resiliente com ancestrais condensados;
- painéis laterais redimensionáveis preservando a área útil;
- Camadas recolhíveis, com foco, revelação e estados distintos;
- contextualização formalmente restrita a regras determinísticas, sem IA;
- schema `1.16.0` preservado.

Busca, reordenação, reparenting e orientação contextual mais sofisticada permanecem adiados.

## Incremento 05.22 — Encerramento geométrico da V1

Concluído e integrado em `development` pela PR #4:

- corrigir atomicidade e observabilidade das mutações geométricas existentes;
- simular clamp, mínimos, slots, auto-layout e reflow antes do commit;
- aplicar frame, derivados e autoridade numa única ação ou não aplicar nada;
- preservar o schema `1.16.0`;
- não implementar locks persistentes na V1;
- não reescrever a aplicação do zero.

O checkpoint cobre canvas, frame avançado do inspetor e comandos geométricos
de multisseleção. A CI integrada aprovou Node, build, schema e os quatro shards
Chromium. A arquitetura V2 continuará como migração interna incremental sob os
mesmos gates.

## Incremento 05.23 — Transação estrutural e fechamento da V1 ✅

Concluído e integrado em `development` pela PR #5:

- planejar espaçamento e separadores numa cópia isolada;
- validar frames, mínimos, limites, reflow, autoridade e alterações estruturais;
- aplicar o estado planejado numa única emissão e num único undo, ou não aplicar;
- preservar 16 tipos, 45 capacidades e `CatalogDocument 1.16.0`;
- executar a regressão integral técnico/promocional;
- publicar limites da V1 e reduzir o backlog operacional.

A V1 single-page fica estável após aprovação de Node, schema, build e quatro
shards Chromium. O Incremento 05.24 consolida esse estado nos artefatos de
governança e adiciona um gate contra reabertura documental acidental.

Não entram neste incremento: locks persistentes, multipágina, colaboração,
contextualização por IA, novos tipos e reescrita do store.

## Incremento 05.25 — Consolidação interna do posicionamento inicial

Concluído:

- mover o cálculo de posições prováveis para o registro declarativo;
- fazer o store canônico consultar o registro durante a inserção;
- retirar a substituição tardia de métodos do protótipo;
- preservar comportamento, histórico, Authoring Kit e schema `1.16.0`;
- validar Node, build e quatro shards Chromium antes da integração.

## Incremento 05.26 — Consolidação interna do alinhamento textual

Concluído:

- mover normalização de alinhamento legado para o store canônico;
- marcar escolhas explícitas em `updateComponent`, sem interceptor tardio;
- preservar importação, análise, histórico e aparência do rodapé;
- reduzir o contrato de runtime a registro, estilos e verificação;
- proibir por teste a substituição da classe ou de seus métodos;
- preservar schema `1.16.0`, 16 tipos, 45 capacidades e kit `1.6.0`;
- validar Node, build e quatro shards Chromium antes da integração.

## Incremento 05.27 — Consolidação interna do overflow textual

Concluído e integrado em `development` pela PR #9:

- mover normalização de overflow legado para o store canônico;
- marcar escolhas explícitas em `updateComponent`, sem interceptor tardio;
- preservar `wrap`, `ellipsis`, `clip`, importação, análise, histórico e
  aparência do rodapé;
- reduzir o contrato de runtime a registro, estilos e verificação;
- proibir por teste a substituição da classe ou de seus métodos;
- preservar schema `1.16.0`, 16 tipos, 45 capacidades e kit `1.6.0`;
- validar Node, build e quatro shards Chromium antes da integração.

## Incremento 05.28 — Estabilização do fluxo Git

Concluído e integrado em `development` pela PR #10:

- iniciar cada incremento numa worktree limpa derivada do
  `origin/development` integrado;
- substituir descoberta repetitiva de checkout/transporte por um pré-voo único;
- distinguir credencial Git local ausente de falha de rede, divergência remota
  e indisponibilidade do conector;
- selecionar `direct-git`, `github-connector` ou `blocked` por evidência;
- preservar worktrees históricos sem torná-los base de novos incrementos;
- manter `main` intocada e a CI completa como gate de integração.

## Incremento 05.29 — Fluxo direto de placeholders

Concluído e integrado em `development` pela PR #11:

- preservar o placeholder inteiro como entrada direta para a biblioteca;
- explicitar a sequência biblioteca do projeto → computador;
- transformar cada miniatura existente em uma única ação acessível;
- provar seleção por mouse, reuso por teclado, upload, persistência e reload;
- preservar IndexedDB, `assetId`, schema `1.16.0`, 16 tipos e 45 capacidades;
- bloquear publicação quando `origin/development` local estiver obsoleta;
- medir o ganho operacional do pré-voo Git estabilizado no 05.28.

## Incremento 05.30 — Altura alcançável após remoção estrutural

Concluído e integrado em `development` pela PR #12:

- remover a reserva compacta de especificações quando o último item desse tipo
  não existe;
- somar a galeria ao mínimo somente quando ela está presente;
- antecipar no painel a altura alcançável pelo reflow;
- oferecer ajuste explícito ao conteúdo em uma única ação reversível;
- preservar a tabela integralmente dentro do card reduzido;
- repetir a medição do fluxo Git após a correção de frescor remoto do 05.29.

## Incremento 05.31 — Normalização transacional à grade

Concluído e integrado em `development` pela PR #13:

- antecipar quantos itens serão alterados, o maior ajuste e efeitos derivados;
- normalizar posições, dimensões ou ambos pela grade da página;
- respeitar mínimos, limites, autoridade local e coordenadas do contexto;
- bloquear conflitos antes do commit;
- aplicar a seleção inteira numa única ação reversível;
- preservar schema `1.16.0`, 16 tipos e 45 capacidades.

## Incremento 05.33 — Reordenação acessível em Camadas

Concluído e integrado em `development` pela PR #15:

- expor a operação existente de reordenação diretamente em Camadas;
- mover irmãos acima ou abaixo somente dentro do mesmo grupo/slot;
- oferecer controles acessíveis por mouse e teclado;
- desabilitar ações nos limites do grupo;
- preservar ordem serializada, reflow e uma ação reversível;
- manter reparenting, cruzamento de slots e drag-and-drop fora do recorte.

## Incremento 05.34 — Publicação canônica pelo conector

Concluído e integrado em `development` pela PR #16:

- derivar a lista completa de publicação diretamente do commit local;
- normalizar respostas diretas e aninhadas do conector;
- validar contagem, caminhos, modos e SHAs antes da montagem da árvore;
- reconstruir a entrada canônica no máximo uma vez;
- bloquear qualquer ref remota após uma segunda divergência;
- preservar comparação exata da árvore, PR draft, CI e squash como gates.

## Incremento 05.35 — Rótulos contextuais do editor

Concluído e integrado em `development` pela PR #17:

- impedir que a seleção revele recursivamente todos os rótulos descendentes;
- preservar o rótulo da seleção primária;
- manter descendentes destacados e, dentro do contexto editável, revelar
  somente o filho em hover ou foco;
- usar projeção compacta sem interseção entre rótulos;
- preservar impressão, schema, tipos e capacidades.

## Incremento 05.36 — Store canônico de reflow e histórico

Concluído e integrado em `development` pela PR #18:

- transferir convergência de reflow, baseline e restauração do histórico ao
  store canônico;
- preservar reflow manual, dirty state, undo/redo e importação;
- impedir que o contrato tardio substitua classe ou `emit`.

## Incremento 05.37 — Store canônico das apresentações adaptativas

Concluído e integrado em `development` pela PR #19:

- estabilizar `variants` e `data-only` na passagem canônica;
- preservar geometria e inspeção nos contratos de apresentação;
- impedir substituições tardias de classe, `emit` e `deleteComponent`.

## Incremento 05.38 — Renderer canônico da biblioteca por intenção

Concluído e integrado em `development` pela PR #20:

- chamar a projeção declarativa da biblioteca pelo renderer canônico;
- preservar plano, busca, teclado, grupos e contexto;
- reduzir a instalação tardia a verificação e estilos;
- proibir por teste a substituição de `renderPalette`;
- preservar schema `1.16.0`, 16 tipos e 45 capacidades.

## Incremento 05.39 — Manifesto de capacidades canônico

Concluído e integrado em `development` pela PR #21:

- chamar intenção editorial e posicionamento provável pelo gerador canônico;
- preservar cinco grupos, dois hints e a projeção individual dos 16 tipos;
- reduzir os contratos tardios a validação e enriquecimento declarativo;
- provar identidade do método, reinstalação idempotente e ordem inversa;
- preservar schema `1.16.0`, 16 tipos e 45 capacidades.

## Incremento 05.40 — Confirmação determinística de referências Git

Concluído e integrado em `development` pela PR #22:

- distinguir acknowledgements de objetos Git, branches e PRs;
- validar nome/ref no retorno de `create_branch`;
- manter o SHA como autoridade obrigatória no readback da referência;
- eliminar o falso incidente recorrente sem relaxar bloqueios de divergência;
- preservar integralmente o escopo funcional da V1.

## Incremento 05.41 — Registro canônico de receitas

Concluído e integrado em `development` pela PR #23:

- manter uma única identidade para `CatalogSectionRecipes` e seu registro;
- registrar as nove receitas sem substituições tardias;
- preservar versões, ordem pública, clones independentes e manifestos;
- provar instalação e reinstalação em qualquer ordem;
- preservar schema `1.16.0`, 16 tipos e 45 capacidades.

## Incremento 05.42 — Handover e prioridade da triagem histórica

Concluído e integrado em `development` pela PR #24:

- publicar o estado canônico após o 05.41;
- permitir sugestão proativa, mas não integração automática, de uma promoção
  coerente para `main`;
- elevar `agent/developer-b-05.18` a P1 operacional e documental;
- proibir o merge integral da branch histórica;
- definir inventário, classificação, curadoria, encerramento da PR #1 e poda
  segura como sequência obrigatória.

## Incremento 05.43 — Inventário e classificação histórica

Concluído e integrado em `development` pela PR #25:

- congelar branch, merge-base e base canônica por SHA;
- inventariar os 231 caminhos alterados e seus 489 commits exclusivos;
- registrar tamanho, blob, último commit, equivalência e dependências;
- classificar cada caminho como Aproveitar, Registro histórico ou Descartar;
- separar testes visuais, evidências de CI e baselines canônicas;
- corrigir estados documentais superados sem alterar o runtime;
- manter PR #1, exclusão da branch e promoção para `main` fora do recorte.

## Incremento 05.44 — Checkpoint final de consolidação da V1

Concluído e integrado em `development` pela PR #26:

- registrar a PR #1 fechada e a poda das 25 branches `agent/*`;
- confirmar somente `main` e `development` no remoto;
- documentar o delta linear de 38 commits, sem divergência de `main`;
- vincular por hash a referência técnica canônica da V1;
- manter a referência promocional como benchmark pós-V1, sem promovê-la a
  baseline;
- executar Node, schema, build e quatro shards Chromium;
- publicar riscos, bloqueios e rollback para uma promoção explícita posterior.

O incremento não move `main`, não altera runtime/schema/manifestos e não reabre
locks, multipágina, colaboração, IA ou frentes congeladas.

## Incremento 05.54 — Revisão integral do Authoring Kit

Em validação sobre `development`:

- dar identidade `1.6.1` ao kit posterior à fixture 05.52;
- alinhar proveniência em 05.54;
- publicar padrões pós-compilação para arranjo, densidade, semântica, spans,
  colunas e canvas factual;
- distinguir template de pacote, compilação e empacotamento;
- executar JSON Schemas Draft 2020-12 na suíte Node;
- preservar `CatalogDocument 1.16.0`, runtime visual e limites single-page.

## Incremento 06 — Documento multipágina, balanceamento e exportação ⏸

Pausado até o encerramento formal da V1 single-page e uma decisão explícita de
retomada. Os gates 05.14–05.16 já foram vencidos e não são mais a dependência
operacional desta frente.

Critérios de aceite:

- adicionar, duplicar, ordenar e excluir páginas;
- numeração automática;
- paginação e balanceamento determinísticos a partir do plano editorial;
- preview de impressão multipágina;
- PDF A4 com sangria e margem segura, além da impressão da página atual entregue no 04.2.1;
- exportação de dados para XLSX;
- validação do pacote completo antes da publicação.

## Incremento 07 — Colaboração local-first opcional ❄️

Critérios de aceite:

- checkpoints e restauração por snapshots portáteis antes da colaboração ao vivo;
- sala browser-only com link, senha, apelido ilustrativo e visualização por padrão;
- hoster como única autoridade para importações de projeto e snapshot canônico;
- comandos validados e serializados pelo hoster, com log por sessão;
- WebRTC direto com sinalização efêmera de código próprio;
- protótipo sem TURN, com falha explicada e fallback por download manual;
- nenhuma conta, autenticação de identidade, banco central ou persistência remota de catálogo.

O antigo plano de API central, autenticação, banco remoto e storage compartilhado foi substituído pela decisão local-first registrada em `ADR-024-browser-local-first-collaboration.md`.

## Frentes congeladas sem incremento ativo

- hospedagem estática e deploy por Git;
- expansão multimídia e novos formatos/pipelines de assets;
- workflow de publicação e aprovação avançada;
- interface touch/mobile completa;
- colaboração e infraestrutura de sala.

Essas frentes preservam seus documentos de decisão e só podem ser tocadas para evitar dívida estrutural concreta ou regressão do núcleo atual.
