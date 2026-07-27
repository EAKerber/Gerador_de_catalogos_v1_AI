# Incremento 05.29 — Fluxo direto de placeholders

## Objetivo

Retomar melhorias perceptíveis do editor sem reconstruir a biblioteca de artes
entregue no Incremento 04. O recorte reduz ambiguidade e aquisição de alvo no
caminho mais frequente: placeholder → arte existente ou arquivo do computador.

## Mudanças

- o placeholder continua integralmente clicável e anuncia `Escolher arte`;
- o diálogo explicita `1. Escolha uma arte do projeto`;
- o upload aparece depois como `2. Ou adicione do computador`;
- cada card de asset passa a ser um único botão, clicável em toda a miniatura e
  operável por teclado;
- o reuso mantém o mesmo `assetId` e não duplica blobs ou metadados;
- upload, IndexedDB, preview, fit, foco, recoloração SVG e reload são
  preservados.

Não há mudança de schema, formato de documento, persistência ou tipo de
componente.

## Medição do fluxo Git

A linha de base observada nos incrementos 05.24–05.27 consumia aproximadamente
40–55% das mensagens operacionais e 20–30% do raciocínio ativo com descoberta
de checkout, tentativas de transporte e reconstrução manual.

O 05.29 mede:

| Indicador | Antes do 05.28 | 05.29 |
| --- | ---: | ---: |
| Descobertas de checkout/worktree por incremento | múltiplas | 0 após a criação da worktree limpa |
| Tentativas SSH | recorrentes | 0 |
| Diagnósticos de autenticação repetidos | múltiplos | 0 |
| Execuções de pré-voo necessárias | inexistente | 3 neste incremento; 1 esperada nos próximos |
| Transporte selecionado automaticamente | não | `github-connector` |
| Contingências não previstas | recorrentes | 1, referência remota local obsoleta |

O primeiro pré-voo eliminou descoberta de checkout, SSH e `gh`, mas revelou que
comparava ancestralidade com `origin/development@eba4a6c` sem confrontá-la com o
head remoto `f4d26f6`. O contrato passou a consultar `ls-remote`, expor
`remoteBase` e bloquear `origin-development-stale`. O segundo ciclo provou a
regressão e atualizou a referência; o terceiro é o checkpoint limpo final.

Mesmo com a correção do próprio mecanismo, o 05.29 usou uma única worktree
derivada do commit integrado, zero tentativas SSH, zero buscas por checkpoints
históricos e nenhuma nova solicitação de autorização. Nos próximos incrementos,
o caminho normal volta a uma execução de pré-voo mais publicação pelo transporte
declarado. A espera normal da CI não conta como esforço de diagnóstico Git.

## Gates

- contrato estático da ordem e semântica do seletor;
- navegador em 1366×768 cobrindo clique direto no placeholder;
- upload de SVG e vínculo automático;
- abertura por teclado e escolha da miniatura por teclado;
- reuso sem duplicação;
- persistência e hidratação depois de reload;
- suíte Node integral, build idempotente e quatro shards Chromium na CI.
- regressão do pré-voo com remoto atualizado e referência local obsoleta.
