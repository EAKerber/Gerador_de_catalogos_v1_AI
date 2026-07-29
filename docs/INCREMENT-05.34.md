# Incremento 05.34 — publicação canônica pelo conector

## Recorte

As correções manuais comprovadas nas publicações 05.31 e 05.33 passam a formar
um protocolo versionado para o transporte `github-connector`. O protocolo deriva
os caminhos diretamente do commit local, normaliza as formas conhecidas de
retorno do conector e valida a identidade antes da montagem da árvore.

## Comportamento

- `npm run --silent git:publication-manifest` gera JSON com commit, árvore,
  contagem e todos os blobs rastreados em `HEAD`;
- caminhos, modos e SHAs vêm de `git ls-tree`, sem enumeração improvisada;
- respostas diretas, aninhadas ou em arrays são reduzidas a um SHA inequívoco;
- divergência de contagem, caminho, modo ou SHA exige uma reconstrução canônica;
- somente uma reconstrução é permitida;
- uma segunda divergência bloqueia a publicação antes de branch, PR ou ref;
- o SHA da árvore criada ainda precisa coincidir com a árvore do manifesto.

## Limites

- a credencial do conector não é exposta ao processo Node;
- criação de blobs, árvore, commit, branch e PR continua na orquestração externa;
- CI, promoção da PR e squash permanecem gates deliberados;
- nenhum código, schema ou capacidade do editor é alterado.

## Gates

- regressão com manifesto completo e lista parcial;
- normalização das estruturas observadas no conector;
- `continue`, `rebuild-once` e `block` cobertos;
- CLI validada contra a árvore Git real;
- suíte Node integral.
