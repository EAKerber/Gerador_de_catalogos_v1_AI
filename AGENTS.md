# Instruções operacionais do repositório

## Leitura obrigatória antes de agir

Este repositório está em **transição forense da V1**, não em desenvolvimento
funcional normal. Antes de propor, editar, testar, publicar ou podar qualquer
coisa:

1. leia `docs/START-HERE.md`;
2. leia `docs/project/STATUS.md`;
3. valide `docs/project/CHECKPOINT.json`;
4. leia `docs/ADR-029-encerramento-v1-e-governanca-forense.md`;
5. para trabalho de autópsia, siga `docs/autopsy/README.md`.

Não use `README.md`, `docs/BACKLOG.md`, `docs/ROADMAP.md`, handovers antigos,
o atlas de funcionalidades ou o Authoring Kit isoladamente para inferir a fase
atual. Eles contêm evidência e contratos históricos da V1.

## Estado e limite de escopo

- O último incremento funcional é `05.60` / Authoring Kit `1.7.2`.
- A V1 foi encerrada para evolução funcional como **protótipo técnico**, não
  aprovada como produto satisfatório ou pronto para publicação.
- O checkpoint documental `05.61` inicia a autópsia e não altera o editor.
- Até a aprovação dos gates descritos no checkpoint, são permitidos somente:
  documentação, inventário, reprodução de evidência, medições não mutantes e
  testes que protejam esses contratos documentais.

Sem nova decisão explícita do usuário, não:

- corrija runtime, interface, layout, renderer, schema, compilador ou kit;
- acrescente funcionalidades à V1;
- inicie implementação, scaffold ou branch de V2;
- trate CI verde, zero colisão estrutural ou pacote válido como prova de
  qualidade visual;
- crie migração ou compatibilidade V1→V2;
- transforme hipótese de autópsia em decisão arquitetural.

Uma reprodução pode usar o runtime intacto da V1. Se a reprodução exigir
alterar o produto, registre a limitação em vez de corrigi-la.

## Autoridade documental

Em caso de conflito, use esta ordem:

1. instrução atual e explícita do usuário;
2. este `AGENTS.md`;
3. `docs/project/STATUS.md` e `docs/project/CHECKPOINT.json`;
4. ADRs aceitas da fase forense;
5. achados reproduzidos e inventários da autópsia;
6. documentação histórica da V1.

`docs/project/STATUS.md` é o resumo humano atual. O checkpoint JSON é a versão
consultável por agentes e automações. Os dois devem mudar juntos quando fase,
gates, próximo passo ou refs autoritativas mudarem.

## Método da autópsia

Separe sempre:

- **observado:** existe em artefato ou execução identificada;
- **reproduzido:** foi repetido com procedimento e resultado registrados;
- **inferido:** explicação causal ainda falsificável;
- **decidido:** escolha aceita, com alternativas e consequências documentadas.

Não use linguagem de conclusão para hipótese. Cada achado deve identificar a
evidência, a camada afetada, o impacto, a confiança e o teste que poderia
refutá-lo. As imagens de referência são evidências; não são golden images,
templates ou fontes de fatos comerciais.

## Fluxo Git durante a transição

Enquanto o encerramento formal não estiver completo:

- `development` é a base transitória de controle;
- mudanças usam branches curtas `agent/*` derivadas do head remoto comprovado;
- PRs têm base `development` e começam como draft;
- `main`, `archive/v1` e a tag `v1.0.0-prototype` não são movidos ou criados
  antes dos gates de encerramento;
- não existe branch documental permanente;
- `main` só se tornará o plano de controle documental após a promoção formal e
  o readback do snapshot da V1.

Use `docs/GITHUB-OPERATIONS.md` para preflight, publicação, CI e readback. A
ausência do executável `gh` não é, isoladamente, bloqueio: verifique primeiro o
conector GitHub disponível. Nunca force-push nem reescreva refs protegidas.

Poda é uma operação posterior ao snapshot. Até lá, apenas inventarie refs.
Quando autorizada pelo checkpoint, uma branch só pode ser removida se o nome
literal começar por `agent/`, não houver PR aberta dependente e a integração ou
abandono estiver comprovado por readback. Nunca infira segurança apenas por
ancestralidade quando a PR tiver usado squash.

## Protocolo de continuidade

Antes de encerrar uma unidade de trabalho documental:

1. registre decisões aceitas em ADR;
2. atualize o índice/evidência/achado afetado;
3. atualize `STATUS.md` e `CHECKPOINT.json` se o próximo passo mudou;
4. declare o que continua aberto e qual é o próximo passo exato;
5. valide links, JSON e o contrato de entrypoints;
6. publique por branch curta e PR revisável.

Evite transcrever conversas inteiras. Preserve decisões, evidências,
alternativas, critérios, incertezas e consequências suficientes para que um
agente novo continue sem depender do chat.
