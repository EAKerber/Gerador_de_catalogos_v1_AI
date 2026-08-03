# Definição canônica do produto

> **PATRIMÔNIO DA V1.** Este documento descreve a visão que orientou a V1; não é
> uma especificação aprovada da V2. A fase atual e os gates de reavaliação estão
> em `docs/START-HERE.md` e `docs/project/STATUS.md`.

## Status

Direção de produto aceita em 2026-07-14 e atualizada pelos Incrementos 05.10, 05.13 e 05.17. Este documento orienta backlog, arquitetura, interface e kit de autoria para agentes. Implementações atuais que ainda não atendem a esta definição são tratadas como etapas de migração, não como mudança da visão.

## 1. Visão

O Catálogo V1 é um **compilador editorial de catálogos orientado a dados, com editor visual de revisão e refinamento**.

O fluxo principal começa com dados de produto, assets disponíveis e considerações editoriais opcionais. Um agente munido do kit oficial decide o que não foi especificado, produz um projeto portátil e entrega um catálogo pronto para revisão, importação e PDF.

A edição manual é secundária, mas deve permanecer:

- fácil para as ações mais prováveis no contexto atual;
- permissiva para exceções e refinamento profundo;
- reversível por histórico;
- não destrutiva em relação a conteúdo, vínculos e assets;
- progressiva: intenção primeiro, composição depois, valores exatos por último.

### Foco de desenvolvimento após o 05.13

O ciclo ativo prioriza **usabilidade, fidelidade e confiabilidade**. A criação manual do zero permanece suportada como benchmark integrado e escape hatch: ela revela falhas que também encarecem a correção de catálogos gerados, mas não substitui o fluxo data-first como direção principal.

Expansão multimídia, plataforma online, colaboração, touch/mobile completo e workflow de publicação ficam congelados. Essas frentes só influenciam decisões atuais quando ignorá-las criaria dependência irreversível, duplicação arquitetônica, quebra futura de schema/pacote/IDs ou regressão de compatibilidade. PDF continua sendo uma saída de fidelidade do catálogo.

Preservar arquitetura significa preservar contratos e decisões válidas, não toda opção ou implementação. Capacidades podem ser mantidas, auditadas, congeladas, pausadas, ocultadas, fundidas ou depreciadas. Toda opção persistente exposta precisa representar uma intenção distinta e compreensível.

## 2. Resultado esperado

Ao receber o kit de autoria uma única vez, um chat, projeto ou agente especializado deve ser capaz de criar diferentes catálogos sem receber novamente toda a documentação. Para cada catálogo, o usuário fornece apenas os dados disponíveis e, se desejar, preferências ou restrições adicionais.

O agente deve saber:

- quais componentes, templates, modos, presets, tokens e assets estão disponíveis;
- quais fatos nunca pode inventar;
- quais decisões editoriais pode tomar autonomamente;
- como detectar conteúdo, asset ou capacidade ausente;
- quando reutilizar, gerar, omitir, usar placeholder ou perguntar;
- como validar e empacotar o projeto;
- como relatar decisões, suposições e pendências.

O resultado é um `CatalogProjectPackage` contendo o JSON materializado, assets e manifestos necessários. Ao ser importado pelo editor, deve reproduzir a visão do catálogo, permitir ajustes manuais e gerar PDF.

## 3. Papéis do sistema

### Agente de catálogo

- interpreta dados e brief;
- normaliza o conteúdo sem alterar fatos;
- escolhe direção editorial, templates, modos e densidade;
- decide a estratégia de assets conforme as capacidades disponíveis;
- gera um plano editorial;
- aciona ou segue o compilador e o validador fornecidos pelo kit;
- entrega o pacote e um relatório conciso.

### Compilador

- materializa IDs, páginas, componentes, frames, slots e bindings;
- aplica templates e regras determinísticas;
- resolve fallbacks conhecidos;
- não inventa conteúdo comercial ou técnico.

### Validador

- verifica schema e integridade referencial;
- verifica contratos de componentes, slots e tokens;
- detecta overflow, conteúdo ausente e assets inválidos;
- verifica contraste e condições relevantes para PDF;
- classifica problemas em erro, aviso ou informação;
- oferece reparos determinísticos quando seguros.

### Editor

- importa e apresenta o resultado;
- destaca pendências e reparos sugeridos;
- oferece revisão contextual e ajustes progressivamente mais finos;
- preserva acesso às propriedades avançadas;
- exporta o projeto e a saída em PDF.

### Estado materializado no 05.5

- `CatalogSource` pode ser importado diretamente pela interface;
- o plano `hero-grid` é inferido quando nenhum plano é fornecido;
- o compilador e o validador acompanham o `CatalogAuthoringKit 1.4.0`;
- a referência de sete produtos é gerada em três ações, com zero colisões e overflow;
- paginação, novas famílias de página e balanceamento permanecem extensões previstas, não responsabilidades da edição manual.

### Estado materializado no 05.10 para variações e legendas

- variantes são entidades vinculáveis a assets e linhas comerciais, não duplicações visuais sem identidade;
- a criação manual pode materializar galeria e linha em uma ação, mantendo cada representação editável;
- legendas semânticas possuem painel, grupos e itens opcionais vinculados pela mesma chave das células;
- `CatalogSource 1.1.0` fornece ao agente esse vocabulário sem exigir edição direta da árvore visual.

### Estado materializado no 05.6 para edição manual

- a métrica de três ações do 05.5 é classificada exclusivamente como geração automatizada;
- planilhas podem alimentar o inventário por colagem e confirmação explícita;
- uma seleção de produtos pode criar, organizar e vincular cards sem repetir o comando por item;
- várias linhas podem ser aplicadas à tabela selecionada sem preencher célula por célula;
- operações compostas permanecem reversíveis e não eliminam a edição individual;
- foco contextual persistente continua necessário.

### Estado materializado no 05.7 para refinamento manual

- seleção múltipla é contextual e limitada a irmãos, preservando um único sistema de coordenadas;
- `Shift/Ctrl/Cmd+clique` alterna itens e `Ctrl/Cmd+A` seleciona o conteúdo direto do contexto;
- alinhamento, distribuição, apresentação, tokens, duplicação e exclusão operam em lote;
- o inspetor do conjunto mostra somente comandos elegíveis, sem fundir conteúdo incompatível;
- cada comando de lote é uma transação única e reversível;
- seleção cruzando pais e foco contextual preditivo amplo permanecem posteriores.

### Estado materializado no 05.8 para montagem estrutural

- receitas oficiais declaram estruturas frequentes sem criar um schema paralelo;
- página-base, faixa de aplicações, legenda de embalagens e dica editorial entram como subárvores editáveis;
- o botão `+` expressa a intenção de inserir automaticamente; arrastar continua expressando posição exata;
- o store escolhe slot compatível ou espaço livre e recusa sobreposição silenciosa;
- o papel `primary-content` direciona o foco depois da página-base;
- receitas oficiais passam a integrar o manifesto de capacidades do kit;
- previsão contextual ampla e adaptação por uso continuam incrementais.

### Direção geométrica canonizada no 05.17

- precisão exata é uma capacidade central de refinamento, não um escape hatch periférico;
- o custo indesejado é a repetição de correções numéricas isoladas, não a existência de X, Y, largura e altura;
- manipulação direta, relações entre elementos e valores numéricos devem cooperar sobre a mesma seleção;
- operações sobre conjuntos preservam mínimos, autoridade local, histórico e geometria solicitada/resolvida;
- assistência estética sugere e explica relações, mas não substitui julgamento do usuário;
- constraints relacionais persistentes só entram após evidência de que comandos relacionais efêmeros são insuficientes.

## 4. Fluxo canônico por catálogo

1. O usuário fornece uma lista, tabela ou arquivo de produtos e pode anexar imagens e considerações editoriais.
2. O agente identifica os dados disponíveis, as lacunas e suas próprias capacidades.
3. O agente normaliza os dados sem fabricar fatos.
4. Somente dúvidas realmente bloqueantes ou de alto impacto factual são apresentadas ao usuário.
5. Decisões editoriais não especificadas usam defaults, heurísticas e templates do kit.
6. Assets são reutilizados, gerados, solicitados ou substituídos por placeholder conforme a política oficial.
7. O agente cria o plano editorial e materializa o documento final com o compilador.
8. O pacote passa por validação estrutural, referencial, editorial e visual.
9. O agente corrige automaticamente apenas problemas cujo reparo seja determinístico e seguro.
10. O agente entrega o pacote importável e um relatório de decisões, avisos e pendências.
11. O editor importa o pacote, remapeia assets e apresenta a visão final.
12. O usuário revisa, ajusta e exporta o PDF.

## 5. Política de autonomia e perguntas

O agente deve **decidir por padrão e perguntar por exceção**.

### Deve decidir autonomamente

- template, modo e densidade quando não especificados;
- ordem editorial inferível da lista ou categoria;
- quantidade de produtos por página dentro dos limites conhecidos;
- distribuição, espaçamento e hierarquia visual;
- uso de assets já disponíveis e claramente relacionados;
- fallbacks de apresentação documentados pelo kit;
- omissão de campos opcionais vazios quando o template permitir.

### Deve perguntar ou registrar bloqueio

- código, preço, medida, compatibilidade ou especificação técnica ausente quando esse dado for obrigatório na apresentação escolhida;
- identidade de produto ambígua;
- associação incerta entre imagem e produto;
- decisão que possa alterar significado comercial ou técnico;
- ausência de autorização ou capacidade para gerar um asset indispensável;
- conflito entre instruções do usuário e regras normativas do kit.

### Nunca deve inventar

- preços, códigos, dimensões, quantidades de embalagem ou especificações;
- certificações, compatibilidades, materiais ou benefícios técnicos;
- imagens fotorrealistas apresentadas como representação fiel de um produto específico sem base visual suficiente.

Quando um fato não obrigatório estiver ausente, o agente pode omiti-lo, escolher um template que não o exija ou registrar a pendência.

## 6. Política canônica de assets

O modo **Assistido** é o default:

- assets fornecidos e oficiais têm prioridade;
- derivações são permitidas quando preservam o produto confirmado;
- fundos, grafismos, swatches e iconografia genérica podem ser gerados autonomamente;
- imagens factuais de produto geradas do zero são apenas rascunho até aprovação;
- desenhos técnicos não são inventados e só podem ser gerados deterministicamente a partir de dados confirmados;
- templates declaram assets obrigatórios, opcionais e fallbacks;
- ausência de imagem usa fallback antes de provocar uma pergunta;
- exportação para publicação bloqueia assets obrigatórios ausentes ou não aprovados.

Os modos Estrito e Criativo podem ser escolhidos por catálogo. A política normativa completa está em `ASSET-AUTHORING-POLICY.md`.

## 7. Hierarquia da edição manual

O inspetor e as ações contextuais seguem três níveis visíveis e uma divulgação técnica:

1. **Conteúdo:** produto vinculado, texto, dados, imagem, legenda, modo e densidade que expressem a peça.
2. **Layout:** direção, distribuição, slots, alinhamento, padding, espaçamento, divisórias e ordem.
3. **Visual:** tokens, tipografia, escala de ícone e aparência.
4. **Avançado:** frames, spans, constraints, mínimo calculado, responsividade e overrides técnicos.

Os níveis não são modos de permissão. **Avançado** preserva a profundidade sem expor geometria antes de ela ser necessária. Estados binários persistentes usam toggles; comandos instantâneos usam botões.

O foco inicial é determinado pelo contexto:

| Contexto | Informação prioritária |
| --- | --- |
| Sem seleção | Importar, gerar, abrir projeto ou inserir estrutura |
| Card | Produto, apresentação, densidade, arte e ajuste |
| Tabela | Colunas, linhas, legenda e formatação |
| Contêiner | Direção, espaçamento, distribuição e filhos |
| Átomo | Conteúdo, fonte/ícone, gap e padding |
| Problema detectado | Causa, impacto e reparos seguros |

## 8. Vocabulário de apresentação

| Conceito | Significado canônico |
| --- | --- |
| Tipo | Natureza do componente, como card, tabela ou galeria |
| Template | Receita estrutural completa com slots, bindings e requisitos |
| Modo | Organização editorial dentro de uma família, como destaque ou técnico |
| Densidade | Escala e espaçamento: compacto, padrão ou confortável |
| Estado responsivo | Resultado automático da largura disponível |
| Preset | Conjunto nomeado de propriedades de uma mesma dimensão |
| Override | Exceção manual local e explícita |
| Snapshot | Cópia reutilizável e autônoma em **Meus componentes** |

## 9. Não objetivos

- substituir um editor vetorial genérico;
- expor CSS arbitrário como fluxo normal;
- depender de ajuste manual para construir todas as páginas;
- fazer da geração uma caixa-preta sem relatório ou validação;
- usar cor como único meio de transmitir significado;
- exigir que o usuário repita o kit de autoria a cada catálogo.

## 10. Critérios de sucesso

- os mesmos dados e decisões produzem um projeto estruturalmente equivalente;
- todo pacote importado é validado antes de substituir o documento atual;
- assets do pacote permanecem portáveis e não dependem do navegador de origem;
- o agente pergunta apenas quando a ausência realmente bloqueia ou compromete fatos;
- o usuário consegue corrigir conteúdo, apresentação e layout sem reconstruir o catálogo;
- ações manuais são reversíveis;
- ações automatizadas e manuais possuem métricas separadas;
- repetições manuais previsíveis podem ser executadas em lote sem criar um modelo de documento paralelo;
- operações compostas compartilham a mesma camada semântica entre UI, histórico, compilador e agente;
- nenhuma opção persiste apenas por expor uma mecânica interna sem intenção de usuário correspondente;
- overrides locais permanecem explícitos e duráveis sem desativar garantias estruturais da subárvore inteira;
- canvas, preview e PDF preservam a intenção visual dentro das tolerâncias documentadas;
- decisões e fallbacks aplicados pelo agente são auditáveis no relatório.

## 11. Propriedade, operação e colaboração — direção congelada

O catálogo pertence a quem mantém seu pacote/snapshot, não ao serviço que entrega o editor. O produto permanece disponível no navegador, sem exigir aplicativo próprio, login, conta ou banco central. IndexedDB é estado de sessão local; snapshots portáteis são a unidade explícita de backup, transferência e recuperação.

Em uma futura sala ao vivo, a pessoa que a inicia é o **hoster** e mantém a autoridade do projeto em sua aba. Participantes entram como visualizadores, recebem edição por concessão e não podem importar ou substituir o projeto inteiro. Link e senha controlam ingresso na sessão; apelidos e logs são operacionais, não identidade verificada.

A colaboração é complementar, nunca requisito para a autoria individual. Seu protótipo pode falhar em redes que bloqueiem WebRTC direto porque não haverá TURN. Nesse caso, o editor deve preservar todo o trabalho local, explicar a limitação e oferecer troca manual de snapshot.

Esta direção permanece válida, mas sua implementação está congelada durante o ciclo de saneamento. O núcleo atual apenas preserva determinismo, IDs estáveis, portabilidade e separação entre store e plataforma para não criar dívida futura.
