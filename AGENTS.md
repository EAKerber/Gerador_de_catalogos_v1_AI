# Instruções operacionais do repositório

## GitHub: conector antes de declarar bloqueio por `gh`

A ausência do executável local `gh` não é, isoladamente, um bloqueio para
operações GitHub neste projeto.

Antes de interromper um fluxo por `gh: command not found`, verifique as
capacidades do conector GitHub disponíveis na sessão e use-as quando cobrirem a
operação necessária.

Para diagnosticar GitHub Actions:

1. resolva a PR e seu `head_sha`;
2. obtenha as execuções associadas ao commit;
3. liste os jobs da execução;
4. identifique jobs e etapas com falha;
5. busque os logs do job pelo conector;
6. registre run, job, etapa, erro e evidência antes de propor uma correção.

Para publicar quando o push Git autenticado não estiver disponível:

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
