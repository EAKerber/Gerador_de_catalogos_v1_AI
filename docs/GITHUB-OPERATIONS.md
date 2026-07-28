# Operação GitHub determinística

## Problema formalizado

O ambiente do ChatGPT pode disponibilizar o conector GitHub sem instalar a CLI
`gh`. Esses mecanismos têm autenticação e disponibilidade independentes.

O erro recorrente ocorreu quando a ausência de `gh` foi tratada como prova de
que o GitHub inteiro estava indisponível. Isso produziu bloqueios contraditórios:
o mesmo ambiente publicava branches, criava PRs e consultava Actions pelo
conector, mas uma etapa posterior solicitava que o usuário instalasse a CLI.

## Decisão

O projeto adota resolução por capacidade, não por ferramenta:

- conector GitHub é o caminho preferencial para dados e mutações remotas que ele
  exponha;
- `git` local é usado para estado, diff, testes e identidade da árvore;
- `gh` é usado somente quando instalado, autenticado e necessário para uma
  capacidade não exposta pelo conector;
- `gh: command not found` nunca encerra o fluxo antes da descoberta das
  capacidades atuais do conector.

## Diagnóstico de CI sem `gh`

Entrada mínima:

- repositório;
- número da PR;
- commit head esperado.

Sequência:

1. buscar a PR e confirmar `base`, `head`, `head_sha`, estado draft e
   mergeabilidade;
2. buscar workflow runs pelo `head_sha`;
3. selecionar a execução do workflow esperado;
4. listar jobs e suas etapas;
5. buscar logs apenas dos jobs com falha;
6. separar falha funcional, falha de teste, flake e infraestrutura;
7. manter a PR em draft até a correção e todos os gates passarem.

Evidência obrigatória no relatório:

- URL/número da PR;
- ID e número da execução;
- ID e nome do job;
- etapa e conclusão;
- mensagem de erro relevante;
- gates que passaram;
- efeito sobre merge e branches.

## Publicação sem push autenticado

### Pré-voo único

Depois de criar o commit limpo e antes de publicá-lo, execute:

```bash
npm run git:preflight
```

O comando verifica, numa única passagem, raiz, branch `agent/*`, árvore limpa,
base `origin/development`, head real de `development` via `ls-remote`,
frescor da referência local, ancestralidade, leitura remota e autenticação de
push com `--dry-run`. A saída declara um transporte:

- `direct-git`: o push local está autenticado;
- `github-connector`: leitura Git funciona, mas a credencial local está ausente;
- `blocked`: rede, divergência, base ou estado local impedem publicação segura.

Uma referência local `origin/development` diferente de `remoteBase` é bloqueada
como `origin-development-stale`; atualize-a por fetch e repita o comando. A
ancestralidade nunca deve ser aprovada apenas contra uma referência local
obsoleta.

Use `npm run git:preflight -- --json` para saída legível por máquina e
`npm run git:preflight -- --local-only` em testes sem rede. Não repita descoberta
de worktrees ou tentativas SSH depois que esse relatório identificar o caminho.

Quando o commit já está validado localmente e o push HTTPS não possui
credencial, o conector pode publicar objetos Git:

1. executar `npm run --silent git:publication-manifest` e usar exclusivamente
   o JSON da lista canônica derivada de `HEAD`;
2. criar/reutilizar blobs e normalizar cada retorno com
   `tools/git-connector-publication.js`, independentemente de o SHA vir no
   resultado direto ou aninhado;
3. validar contagem, caminhos, modos e SHAs antes de montar a árvore;
4. se houver divergência, descartar a lista produzida e reconstruí-la uma única
   vez a partir do manifesto canônico; uma segunda divergência bloqueia o fluxo;
5. criar a árvore sobre o base correto;
6. verificar que o SHA da árvore remota coincide com `tree` no manifesto local;
7. criar commits com pais, ordem e mensagens equivalentes;
8. atualizar somente a branch de agente;
9. abrir PR draft para `development`.

Arquivos grandes devem ser tratados como risco de transporte. Conteúdo
truncado não pode ser publicado. A ref só pode ser atualizada depois da
comparação integral da árvore.

### Confirmação por leitura após escritas

O retorno imediato de uma escrita é um acknowledgement, não a autoridade final
do fluxo. Depois de criar blob, árvore, commit, branch ou PR:

1. normalize e valide a identidade própria da operação presente na resposta:
   SHA para objetos Git, nome/ref para criação de branch e base/head para PR;
2. faça uma leitura independente do objeto ou referência criada;
3. compare o estado lido com SHA, base, head e árvore esperados;
4. prossiga quando a leitura confirmar o estado, mesmo que o acknowledgement
   tenha omitido campos;
5. bloqueie quando a leitura divergir ou não puder comprovar a identidade.

Registre as ocorrências em categorias distintas:

- `acknowledgement-incompleto`: a escrita ocorreu, mas a resposta não contém
  identidade suficiente;
- `acknowledgement-inconsistente`: a resposta identifica outro objeto, mas a
  leitura independente confirma o estado esperado;
- `conteudo-remoto-incorreto`: um objeto foi criado com bytes ou SHA divergentes;
- `conteudo-remoto-nao-verificavel`: a leitura independente não fornece
  identidade suficiente para continuar;
- `enumeracao-parcial`: uma leitura de conjunto omitiu entradas;
- `orquestracao-local`: a falha ocorreu antes da chamada externa e não pertence
  à série do conector.

Uma resposta incompleta nunca autoriza repetição cega da escrita: primeiro leia
o estado remoto para evitar objetos, branches ou PRs duplicados.

`create_branch` não promete um SHA no acknowledgement normalizado. Quando ele
confirma o nome/ref solicitado, essa resposta é completa para a operação; o SHA
continua sendo comprovado exclusivamente pelo readback da referência. Nome
ausente ou divergente continua sendo classificado como incidente, e SHA
divergente ou não verificável no readback continua bloqueando a publicação.

O módulo versionado consolida os fallbacks comprovados nas publicações 05.31 e
05.33. Ele evita que uma enumeração parcial seja aceita como entrada, normaliza
as formas conhecidas de resposta do conector e expõe a decisão
`continue`/`rebuild-once`/`block`. A credencial do conector não é exposta ao
processo Node, portanto a criação dos objetos continua sendo orquestrada pelo
agente; entrada, validação e política de retomada não devem ser reimplementadas
na execução.

## Critério de bloqueio real

O fluxo só é bloqueado quando:

- a operação necessária não existe no conector nem nas ferramentas locais;
- o conector solicita conexão/reconexão;
- há erro explícito de permissão;
- a identidade de árvore, branch, commit ou PR não pode ser comprovada;
- a ação extrapola a autorização do usuário.

Na ausência desses sinais, o agente deve continuar pelo caminho disponível e
registrar qual capacidade substituiu a CLI.

Credenciais do conector não são reutilizáveis pelo executável `git`. Portanto,
`transport=github-connector` é um diagnóstico de separação de autenticação, não
uma falha do repositório nem uma solicitação automática de nova autorização.

## Aplicação ao incidente da PR #4

O fallback foi validado na execução `Catalog Integration #90`
(`30224993219`):

- PR resolvida pelo conector;
- cinco jobs enumerados;
- Node/schema/build aprovados;
- três de quatro shards Chromium aprovados;
- logs do shard `Chromium and visual gates (1/4)` obtidos pelo conector;
- falha real localizada em `browser-reference-manual-audit.test.js`;
- reconstrução técnica: 4 colisões, 0 overflows.

Assim, a ausência de `gh` não é o bloqueio. A PR deve permanecer draft até a
regressão geométrica ser explicada e corrigida.
