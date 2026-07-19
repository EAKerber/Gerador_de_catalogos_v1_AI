# Discovery 05.11 — Operação, plataformas e catálogo de capacidades

**Status:** encerrada para direcionamento em 2026-07-17 e congelada pelo Incremento 05.13. As decisões continuam válidas como referência futura, mas hospedagem, colaboração, touch/mobile completo e workflow de publicação não possuem incremento ativo. Somente guardrails contra dívida estrutural permanecem aplicáveis ao núcleo atual.

## Objetivo

Preparar o produto para ciclos de teste mais rápidos sem ampliar prematuramente o escopo do editor. Este documento define os próximos problemas, as decisões que já podem ser tomadas e as perguntas que ainda precisam de evidência.

## 1. Correções de interface reabertas

### Barra de comandos

**Evidência.** A barra superior mistura comandos de documento, histórico e ajustes de visualização na mesma linha. Na captura, o conteúdo chega ao limite horizontal, corta a leitura de controles e reduz a separação entre alvos.

**Decisão de produto.** A barra deve preservar, em qualquer largura suportada, as ações de documento: criar, importar, salvar, exportar e imprimir/PDF. Histórico pode usar ícones com `aria-label` e tooltip. Grade, snap, smart, espaços, guias, tolerância e zoom são um grupo de **Visualização**: em largura insuficiente, esse grupo vira um único botão/menu, e não uma sequência comprimida.

**Critérios verificáveis.** Em 1280, 1366 e 1800 px, sem zoom do navegador: nenhum alvo se sobrepõe; nenhum texto é cortado; navegação por teclado alcança todos os comandos; os estados de visualização continuam alteráveis; não há rolagem horizontal do documento inteiro.

**Não é objetivo.** Remover controles ou esconder configurações avançadas sem caminho de descoberta. A redução é hierárquica, não funcional.

### Cards da biblioteca lateral

**Evidência.** Em receitas como “Faixa de aplicações” e “Legenda de embalagens”, o botão `+` invade título/descrição; a largura de abas e textos também não respeita o conteúdo útil.

**Decisão de produto.** O card passa a ter regiões explícitas: ícone, conteúdo fluido, ação primária (`+`) e menu secundário. A ação não participa da largura do texto. Título pode ocupar até duas linhas; descrição usa limite de linhas deliberado e, quando truncada, expõe o conteúdo completo por tooltip/acessibilidade. O card não deve depender de hover para a ação primária.

**Critérios verificáveis.** Em painel recolhido, aberto, em contexto interno e em 1366×768: título, descrição, `+` e menu não se sobrepõem; hit targets são independentes; o foco por teclado deixa clara a ordem; a inserção contextual continua equivalente à inserção por arraste.

## 2. Hospedagem estática por Git

### Hipótese

O editor atual é uma aplicação estática e pode ser publicado sem backend. Isso é útil para testar fluxos reais, compartilhar builds de revisão e obter previews por mudança, mas não cria colaboração nem sincroniza documentos: o estado e os assets do usuário continuam locais ao navegador.

### Direção recomendada

Criar um repositório Git dedicado e conectar uma plataforma de páginas estáticas com previews por branch. Cloudflare Pages é a opção inicial recomendada porque sua integração Git cria deploys automáticos, URLs de preview e checks no repositório; o fluxo de projeto estático não requer adaptar o runtime atual. A documentação também alerta que um projeto iniciado por upload direto não pode ser convertido para integração Git, portanto a escolha deve começar já pelo caminho Git. [Integração Git do Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/git-integration/), [deploy de HTML estático](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)

Netlify e GitHub Pages seguem alternativas válidas a comparar por política de plano, domínio e governança, mas não devem definir a arquitetura da aplicação.

### Contrato mínimo antes do primeiro deploy

- repositório sem documentos reais de clientes, blobs de IndexedDB ou segredos;
- branch principal protegida por testes de runtime, schema e Chromium;
- preview para pull request e promoção explícita para produção;
- `README` de execução local e política de versões do kit;
- cabeçalhos de cache que não sirvam JavaScript antigo depois de uma migração de schema;
- teste em HTTPS para importação, exportação, IndexedDB e impressão/PDF;
- aviso visível: “dados deste navegador” até existir sincronização autenticada.

### Conflitos e limites

- hospedar não resolve persistência, compartilhamento, autenticação, backup ou acesso entre dispositivos; isso pertence ao Incremento 07;
- repositório público simplifica preview, mas exige revisão de licença, marca, assets de exemplo e dados de catálogo;
- deploy Git deve usar integração desde o início: Cloudflare informa que não alterna um projeto entre upload direto e integração Git. [Limite de Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)

## 3. Fundamentos mobile e touch

### Posição

O produto continua **desktop-first para criação editorial completa**. Mobile, na fase inicial, deve oferecer revisão, inspeção, pequenas correções e importação/exportação segura — não a mesma velocidade ou a mesma densidade de composição do desktop. Essa restrição é deliberada: tentar “encolher” o canvas desktop no celular esconderia controles sem reduzir o número de ações.

### Decisões que evitam dívida futura

- usar Pointer Events e coordenadas lógicas, sem pressupor `mouse`, hover ou roda;
- separar intenção (`selecionar`, `mover`, `redimensionar`, `abrir ação`) do adaptador de interação; atalhos de teclado são aceleradores, não o único caminho;
- manter todos os alvos críticos com tamanho touch acessível e alternativa explícita a hover;
- projetar shell com painéis como regiões substituíveis por drawer/bottom sheet, sem acoplar o store à posição visual do painel;
- considerar `safe-area`, teclado virtual, `visualViewport`, pan e pinch para o workspace antes de criar gestos próprios;
- preservar o zoom lógico do documento, independente do zoom do navegador e do pinch do dispositivo.

### Adiado conscientemente

- paridade para multisseleção avançada, resize preciso, drag de múltiplos objetos e composição densa em telas pequenas;
- nova linguagem visual exclusiva para mobile;
- gestos complexos que concorram com scroll/pinch sem teste observável.

### Critério de entrada para implementação maior

Depois de repetir o ensaio de ações no desktop, definir dois perfis com metas próprias: **revisar em touch** e **criar em desktop**. Só então medir quais passos mobile trazem ganho real; não usar a contagem de ações desktop como proxy direto para telefone.

## 4. Catálogo de funcionalidades para humano e agente

### Necessidade

O `capabilities.json` já descreve componentes e capacidades, mas não explica claramente quando usar cada recurso, por onde ele é acessível nem quais pré-condições possui. Um documento manual puro ficaria desatualizado; um manifesto puro é insuficiente para orientar uma LLM ou uma pessoa.

### Decisão proposta

Criar dois artefatos ligados:

1. **Inventário gerado** a partir do manifesto: IDs, componentes, slots, campos, modos, tokens, ícones, atalhos e capacidades.
2. **Guia de uso curado**: intenção, ponto de entrada na UI, pré-condições, resultado, exemplo mínimo, limitações e relação com geração por agente.

O manifesto continua sendo a fonte técnica de verdade. O guia não duplica enumerações; referencia IDs estáveis e é revisado quando a experiência muda.

### Formato mínimo de cada funcionalidade

| Campo | Exemplo |
| --- | --- |
| Intenção | “Adicionar variação comercial” |
| Acesso | Inventário → editar produto → Variações semânticas |
| Pré-condição | Produto existente; card vinculado somente se houver materialização |
| Resultado | Variante, linha comercial e arte opcional com `variantId` |
| Exemplo | “Branco”, código e preço próprios |
| Limites | Uma linha pertence a no máximo uma variante |
| Contrato | `CatalogSource.products[].variants` |

### Uso futuro pelo kit de iniciação

O agente recebe o manifesto, o guia e exemplos validados. A geração deve preferir `CatalogSource → plano → compilador`; a lista de funcionalidades serve para decidir o que é representável, o que exige asset e o que deve virar pergunta ao usuário. Ela não é uma licença para inferir fatos comerciais.

## 5. Ordem recomendada

1. Corrigir barra e cards da biblioteca, com teste visual em 1280/1366/1800.
2. Produzir o inventário de funcionalidades gerado e o primeiro guia curado.
3. Repetir a medição de ações da referência no desktop e priorizar pela fricção medida.
4. Criar repositório e CI; publicar preview estático por Git.
5. Aplicar apenas os fundamentos touch enquanto os pontos de interação forem tocados; não iniciar uma reescrita mobile antes da medição.

Essa ordem preserva a arquitetura atual: melhora a descoberta de ações, transforma o manifesto em documentação operacional, torna a revisão externa mais fácil e só então amplia o alcance de plataforma.

## 6. Persistência local-first e colaboração por snapshots

### Preferência de produto

Não haverá backend centralizado nem banco de dados remoto como fonte de verdade. O projeto deve sobreviver fora de qualquer serviço de hospedagem: um catálogo é um conjunto portátil de documento, assets, manifesto e histórico de snapshots que pode ser guardado e restaurado localmente.

### Terminologia necessária

“Servidor” precisa ser separado em dois papéis:

- **host da aplicação:** entrega os arquivos estáticos do editor; não é dono dos catálogos e não recebe seus dados;
- **hoster do projeto:** pessoa que inicia a sala e mantém o *head* canônico na própria aba do navegador.

A segunda função é a que pode ser “dona do projeto”. Ela não pressupõe nuvem, banco central nem aplicativo auxiliar. Pastas e downloads são destinos manuais de backup, não servidores de sincronização.

### Decisão proposta: autoridade local com réplicas

O modo padrão continua individual: IndexedDB acelera o trabalho no navegador, mas não é tratado como backup confiável nem como origem única. O usuário possui snapshots portáteis explícitos.

Quando a colaboração existir, o hoster mantém a autoridade enquanto sua aba estiver aberta e publica o estado aceito para a sala. Participantes não recebem réplica persistente automática; quem quiser uma cópia faz download manual. Trabalho offline e merge de branches ficam fora do primeiro corte.

Isso conserva o princípio desejado:

- nenhum catálogo depende de uma base de dados central;
- a perda de uma máquina não elimina o projeto se existirem exportações manuais;
- colaboração não requer que o host da aplicação conheça os documentos;
- iniciar outra sala a partir de um snapshot não reescreve IDs do projeto.

### Formato conceitual de snapshot

O `CatalogProjectPackage` atual é a base correta, mas um snapshot colaborativo precisa acrescentar metadados de linhagem, sem mudar o documento editorial:

```text
snapshot/
  catalog-project.zip        # pacote portátil atual
  snapshot-manifest.json     # id, pais, autor/dispositivo, data, hash e mensagem
  assets/                    # já endereçados por hash no pacote
```

Campos mínimos do manifesto:

- `snapshotId` content-addressed;
- `parentSnapshotIds`, permitindo histórico em grafo e branches locais;
- `projectId` estável;
- `authorDeviceId` e, futuramente, assinatura opcional;
- hash do pacote, versão de schema/kit e mensagem de checkpoint;
- política de retenção e de backup.

O pacote continua abrível sozinho. O manifesto de snapshot acrescenta operação e recuperação, mas não entra no modelo visual do catálogo.

### Colaboração em fases

| Fase | Capacidade | Conflito | Infraestrutura |
| --- | --- | --- | --- |
| 0 | Snapshot, download, restauração e cópia para pasta escolhida | Não há merge | Somente navegador + ZIP |
| 1 | Compartilhar/importar proposta, comparar e escolher versão | Resolução manual por snapshot/entidade | Arquivo, pasta compartilhada ou envio direto |
| 2 | Sala browser-only; hoster serializa comandos e propostas | Fila e conflito explícito por alvo | WebRTC direto + sinalização efêmera, sem TURN |
| 3 | Resiliência adicional somente após evidência | Políticas de merge e recuperação ampliadas | Relay ou outras extensões ainda não decididas |

Não se deve chamar a fase 1 de edição simultânea. Ela é colaboração assíncrona por snapshots, mais simples e adequada ao modelo de documento atual.

### Conflitos e regras de merge

O primeiro merge não deve usar “última escrita vence” para o documento inteiro. A ordem recomendada é:

1. detectar alteração concorrente pelo ID estável de entidade/componente;
2. mesclar automaticamente somente alterações independentes;
3. apresentar escolha explícita para conteúdo comercial, geometria concorrente, exclusão versus edição e bindings;
4. preservar os dois ramos até a confirmação do snapshot resultante.

Uma colaboração realmente simultânea exigiria CRDT ou uma camada operacional equivalente. Isso é deliberadamente posterior: introduzi-la antes de medir a colaboração real aumentaria muito a complexidade e poderia conflitar com o reflow determinístico e com operações compostas do editor.

### Implicações técnicas agora

- IndexedDB deve ser reclassificado como cache/sessão local, não como backup;
- exportação de pacote deve ganhar, no futuro, checkpoints nomeados e aviso de cópia de segurança;
- o store, o compilador e o pacote devem continuar determinísticos para que diffs de snapshots sejam compreensíveis;
- assets precisam manter hash e identidade estável, evitando duplicação a cada réplica;
- o protocolo futuro deve expor comandos, propostas e snapshots versionados, não uma API central de edição do canvas;
- File System Access API pode melhorar a experiência em navegadores compatíveis, mas deve ter fallback de download/upload para não tornar o projeto dependente de um fornecedor.

### Questões levantadas nesta etapa

Estas perguntas registram a exploração inicial. As respostas que as substituem aparecem em **Refinamento aceito**, **Decisão de escopo para o protótipo** e no handoff final.

1. Qual experiência torna checkpoints e download manual difíceis de esquecer?
2. Qual granularidade de comparação traz valor inicial: projeto, página, produto, componente ou campo?
3. Que metadados de linhagem são úteis sem sugerir identidade verificada?
4. Por quanto tempo snapshots locais devem ser retidos na interface?

### Recomendação de decisão inicial

Adotar **snapshots ZIP + importação/exportação explícita**, com pasta escolhida quando a API do navegador permitir, como fase 0. Depois validar propostas assíncronas antes de criar a sala P2P. Isso entrega recuperação real imediatamente e mantém aberta a colaboração sem introduzir aplicativo auxiliar ou banco central disfarçado.

### Refinamento aceito: sala de colaboração no navegador

O produto não terá aplicação auxiliar, login ou conta. A colaboração é uma sessão temporária aberta por uma pessoa que já possui o projeto local. A experiência desejada é próxima de uma sala de apresentação: link, senha, limite de participantes, nomes ilustrativos e permissões controladas pelo host.

#### Papéis e autoridade

- **Hoster:** é a pessoa que iniciou a sala e mantém a cópia autoritativa do projeto no navegador. Só ela pode importar JSON, pacote, fonte semântica ou qualquer artefato que substitua/regenere o projeto inteiro. Também é a única pessoa que exporta o snapshot canônico.
- **Colaboradora visualizadora:** entra com edição desligada por padrão; pode navegar, selecionar e inspecionar sem alterar o projeto.
- **Colaboradora editora:** recebe permissão explícita do hoster. Suas ações são propostas/operadas contra a cópia do hoster; o hoster serializa e publica o resultado aceito para a sala.
- **Proponente de asset/objeto:** pode enviar arte, template, componente, produto ou outro objeto candidato. O conteúdo fica em uma bandeja de propostas e somente entra no projeto após aceite do hoster ou de uma regra de autoaceite configurada por ele.

“Nome” é apenas um apelido de sessão. O log deve registrar `apelido + id efêmero da sessão + horário`, deixando claro que atribuição é operacional e não prova de identidade. O hoster pode renomear, remover e bloquear novos ingressos enquanto a sala estiver ativa.

#### Sessão e conectividade

Uma sala precisa de um **serviço efêmero de sinalização** para que navegadores em redes diferentes se encontrem. Depois da negociação, dados podem trafegar por WebRTC; quando a rede exigir relay, um relay transporta bytes, mas não se torna dono nem armazenamento permanente do projeto.

Isso preserva a decisão de não ter backend centralizado de persistência, mas elimina uma ambiguidade: uma página estática sozinha não consegue receber conexões arbitrárias da internet. O serviço de sinalização deve manter somente estado temporário de sala, limite, presença e oferta/resposta de conexão; nunca documento, asset ou snapshot canônico.

Consequências assumidas:

- o hoster precisa manter a aba aberta e conectada; se sair, a sala é encerrada, sem eleição automática de novo dono;
- participantes podem guardar cópia manualmente por download; réplicas automáticas entre dispositivos não fazem parte da primeira fase;
- reconexão recupera do último estado emitido pelo hoster ou de um snapshot que ele reenviar;
- o link é um convite, não autorização suficiente: a senha e/ou aprovação do hoster permanecem necessárias;
- transporte seguro deve ser transparente ao usuário; senha não deve ser guardada como conta, apenas usada para ingressar na sessão e proteger a negociação/acesso.

#### Modelo operacional recomendado

1. Hoster abre um projeto local e seleciona **Abrir colaboração**.
2. Define senha, máximo de participantes e política inicial: visualização, aprovação manual ou edição permitida.
3. O editor cria link de sala e mantém a cópia canônica exclusivamente no navegador do hoster.
4. Quem entra escolhe apelido e solicita acesso; o hoster aprova quando a política exigir.
5. Ações editoriais são enviadas como comandos validados, não como JSON inteiro. O hoster aplica, registra e retransmite a mudança aceita.
6. Assets e objetos entram como propostas com hash, tamanho e metadados; o hoster aprova, rejeita ou habilita autoaceite para aquela sessão.
7. Ao encerrar, somente o hoster escolhe salvar/exportar o snapshot oficial. Participantes interessados baixam cópia manualmente.

Esse modelo evita CRDT na primeira versão, preserva operações compostas e reflow determinístico, e torna a colaboração reversível pelo histórico já existente.

#### Limites iniciais e pontos de atenção

- definir máximo conservador de participantes após benchmark; como o hoster é o concentrador, **4–8** é uma faixa inicial mais realista que uma sala grande;
- desfazer/refazer precisa indicar autoria e efeito global: por default, o hoster desfaz a última operação aceita; desfazer individual de colaboradora é uma extensão posterior;
- edição simultânea de geometria no mesmo componente deve entrar em fila ou pedir resolução, jamais aplicar duas posições silenciosamente;
- importação por colaboradora fica limitada a proposta de objeto/asset validado pelo registro e schema; não é permitido enviar documento raiz, mudança de schema, pacote ou plano que recompila a página;
- presença em segundo plano e suspensão de abas móveis podem interromper uma sessão, por isso colaboração ativa não deve depender de mobile na primeira fase;
- link e senha não resolvem confidencialidade de tela, cópia manual ou captura de conteúdo; são controle de acesso à sessão, não DRM.

#### Parâmetros ainda necessários para o protótipo

1. A entrada será sempre aprovada pelo hoster, ou pode ser automática até o limite quando a senha está correta?
2. Autoedição significa aplicar imediatamente comandos de todas as editoras, ou aprovar automaticamente apenas classes seguras (texto, propriedades, novas propostas)?
3. Quais objetos uma colaboradora pode propor no primeiro corte: assets, componentes/templates, produtos e linhas — todos ou apenas alguns?
4. O log deve sobreviver dentro do snapshot exportado, e por quanto tempo, ou é somente visual durante a sala?
5. O máximo inicial será fixo em 4, configurável até 8, ou definido por benchmark antes de expor a opção?

### Diretriz de infraestrutura aceita

A preferência é operar código e regras próprias para colaboração, sem depender de um produto de sincronização que se torne dono dos dados. Serviços gratuitos com limite de acessos, tráfego ou conexões simultâneas são aceitáveis para a fase inicial, porque o uso previsto é baixo e uma sala indisponível não pode impedir o hoster de abrir, salvar, exportar ou recuperar seu projeto local.

Essa diretriz se traduz em três camadas independentes:

| Camada | Responsabilidade | Política |
| --- | --- | --- |
| Hospedagem estática | Entregar o editor | Pode usar plano gratuito; não recebe projetos |
| Sinalização | Criar sala, presença, senha, ofertas/respostas WebRTC | Código próprio, estado efêmero, limite gratuito aceitável |
| Relay TURN | Encaminhar bytes quando a conexão direta falhar | Fora do protótipo; só será reconsiderado por evidência de uso real |

O sistema deve degradar de forma honesta: se a sinalização atingir cota, ficar indisponível ou a conexão direta falhar, a colaboração ao vivo não abre ou mostra falha de conexão; o projeto local e exportação continuam funcionando. Não deve haver fallback silencioso que envie o catálogo para armazenamento de terceiro.

Antes de disponibilizar a sala, medir conexões diretas bem-sucedidas versus falhas, bytes transmitidos, falhas por navegador/rede e participantes ativos, sempre com telemetria agregada e sem conteúdo de projeto. Esses dados definem se TURN algum dia deixa de ser extensão dispensável e passa a justificar seu custo operacional.

### Decisão de escopo para o protótipo

O protótipo de colaboração não terá TURN. Ele usa sinalização efêmera e tentativa de conexão WebRTC direta; portanto, colaboração ao vivo é explicitamente *best-effort*. Para uso próprio entre conhecidos, isso entrega a capacidade central — hoster, sala, visualização, edição autorizada e propostas — sem introduzir a infraestrutura de relay que concentra manutenção de rede, portas, tráfego e custos potenciais.

Quando a conexão direta falhar, a interface deve informar que a rede não permitiu a sala ao vivo e indicar o fallback já previsto: o hoster preserva o projeto local e quem precisar de cópia usa exportação/download manual de snapshot. TURN permanece como extensão opcional, ativada somente se testes reais mostrarem falhas frequentes ou incompatíveis com o uso pretendido.

## 7. Resultado da Discovery e handoff

### Decisões canônicas

- o próximo incremento é **05.11 — Saneamento visual e atlas funcional**;
- hospedagem, persistência e colaboração são camadas separadas;
- o editor permanece uma aplicação web estática e local-first;
- o projeto pertence ao hoster no navegador; não existe conta nem banco central;
- colaboração futura usa comandos validados, WebRTC direto e sinalização efêmera;
- o protótipo não oferece TURN e assume conectividade *best-effort*;
- autoria completa continua desktop-first; fundamentos de interação não podem criar dívida touch desnecessária;
- a nova auditoria de ações acontece no 05.12, depois do saneamento e antes de outra rodada de automação manual.

### Parâmetros a validar, não bloqueios

- máximo inicial entre 4 e 8 participantes;
- classes seguras para eventual autoaceite;
- retenção do log e sua presença em snapshots;
- taxa de falha P2P que justificaria reconsiderar TURN;
- conjunto mínimo de correções realmente útil em touch.

### Fora de escopo do 05.11

- deploy público;
- snapshots colaborativos;
- sala ao vivo, sinalização e WebRTC;
- redesign mobile;
- regras cromáticas condicionais avançadas;
- documento multipágina.

O detalhamento executável do 05.11 está no `BACKLOG.md`; a sequência de incrementos está no `ROADMAP.md`.
