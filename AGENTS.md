# Instruções operacionais do repositório

## GitHub: conector antes de declarar bloqueio por `gh`

A ausência do executável local `gh` não é, isoladamente, um bloqueio para
operações GitHub neste projeto.

Antes de interromper um fluxo por `gh: command not found`, verifique as
capacidades do conector GitHub disponíveis na sessão e use-as quando cobrirem a
operação necessária.

## Governança de decisões e higiene de branches

O fluxo determinístico é uma salvaguarda de execução, não um veto semântico.
Ele exige base remota comprovada, branch curta, PR revisável, CI aplicável e
readback das escritas; ele **não** impede uma decisão, fix ou contorno ad hoc
explicitamente escolhido pelo usuário. Para esse tipo de recorte, registre a
decisão, o escopo e os gates proporcionais na PR em vez de classificá-lo como
bloqueado por estar fora de um roteiro anterior.

Branches `agent/*` são temporárias. A rotina recorrente também pode encerrar
sem merge a PR elegível cujo `head` esteja nesse namespace e cuja base não seja
`main`, quando ela já estiver integrada, tiver sido substituída de modo
identificável ou estiver explicitamente abandonada. Ela não pode encerrar uma
PR ativa apenas para simplificar o inventário. Depois de a PR correspondente
ser integrada ou fechada nessas condições, o agente deve incluir a branch no
inventário de poda da mesma etapa, quando a capacidade disponível permitir. A
rotina só pode remover uma branch quando todos estes critérios forem
comprovados por readback:

1. o nome começa literalmente por `agent/`;
2. a branch não é `main` nem `development`;
3. não há PR aberta que dependa dela;
4. ela está integrada no destino ou foi fechada/abandonada de modo explícito;
5. a lista exata de refs candidatas foi mostrada antes da escrita.

Nunca force-push, zere, renomeie ou mova `main` ou `development` como parte da
poda. Se qualquer critério não puder ser demonstrado, preserve a ref e registre
a pendência; a higiene não autoriza inferência destrutiva.

Para diagnosticar GitHub Actions:

1. resolva a PR e seu `head_sha`;
2. obtenha as execuções associadas ao commit;
3. liste os jobs da execução;
4. identifique jobs e etapas com falha;
5. busque os logs do job pelo conector;
6. registre run, job, etapa, erro e evidência antes de propor uma correção.

Para publicar quando o push Git autenticado não estiver disponível:

0. execute `npm run git:preflight -- --json` no commit limpo e siga o transporte
   declarado; confirme que `remoteBase` coincide com `base` e não repita
   descoberta de worktrees, SSH ou `gh`;
1. use objetos Git pelo conector apenas numa branch de agente;
2. preserve a ordem e as mensagens dos commits;
3. transfira arquivos grandes sem truncamento;
4. compare a árvore remota com a árvore local antes de atualizar a ref;
5. abra PR draft para `development`;
6. mantenha `main` intocada;
7. integre somente após todos os gates.

Declare bloqueio somente quando faltar a capacidade específica no conector ou
quando ele retornar erro de autenticação/permissão. Não transforme a ausência
da CLI em uma solicitação de configuração ao usuário se o conector já estiver
autorizado.

Detalhes e checklist auditável: `docs/GITHUB-OPERATIONS.md`.
