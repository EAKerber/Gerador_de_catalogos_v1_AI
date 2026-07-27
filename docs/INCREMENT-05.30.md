# Incremento 05.30 — Altura alcançável após remoção estrutural

## Objetivo

Fechar a lacuna observada na reconstrução da referência canônica: remover arte
e todas as especificações de um card compacto liberava os slots, mas o mínimo
vertical ainda reservava a composição completa.

## Mudanças

- cards compactos sem especificações calculam somente título, galeria quando
  presente, tabela e margens;
- a ausência simultânea de arte e especificações deixa de cair no mínimo
  compacto completo;
- o painel expõe **Ajustar altura ao conteúdo** com a altura prevista antes do
  commit;
- o ajuste recompõe os slots, preserva a tabela e gera uma única ação
  reversível;
- o cálculo mostrado no painel usa o mesmo reflow prospectivo que valida o
  frame aplicado.

Não há alteração de schema, tipo, coleção, persistência ou Authoring Kit.

## Evidência

No caso reproduzido em `310 × 360 px`, após remover arte e especificações:

- antes: o mínimo permanecia em `258 px` no caminho legado observado;
- depois: o mínimo alcançável é `190 px`;
- a tabela permanece integralmente dentro do card;
- undo restaura `360 px`.

## Medição do fluxo Git

| Indicador | 05.29 | 05.30 |
| --- | ---: | ---: |
| Buscas por worktree/checkpoint | 0 | 0 |
| Tentativas SSH | 0 | 0 |
| Diagnósticos repetidos de credencial | 0 | 0 |
| Sincronizações previstas de `development` | 1 | 1 |
| Pré-voos antes do desenvolvimento | 2 devido à correção de frescor | 1 após sincronização |
| Transporte | `github-connector` | `github-connector` |
| Contingências Git não previstas | 1 | 0 até o checkpoint funcional |

O primeiro comando executado no checkout anterior bloqueou corretamente a base
obsoleta. Após o `fetch` previsto e a criação da worktree diretamente de
`development@516e73e`, uma única execução confirmou base local/remota,
ancestralidade, árvore limpa e transporte. Não houve descoberta de checkout,
SSH, `gh`, nova autorização ou investigação de autenticação.

## Gates

- contrato Node do mínimo alcançável, contenção da tabela e undo;
- Chromium em `1366×768` cobrindo previsão, clique, feedback e undo;
- suíte Node, build canônico idempotente e quatro shards Chromium na CI.
