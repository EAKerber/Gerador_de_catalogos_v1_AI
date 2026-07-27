# Incremento 05.31 — Normalização transacional à grade

## Objetivo

Reduzir a correção manual de pequenas irregularidades entre cards e peças
irmãs. Snap durante o gesto, alinhamento e distribuição já existiam, mas uma
seleção pronta não podia ser normalizada à grade como conjunto.

## Mudanças

- o inspetor antecipa quantidade de itens alterados, maior ajuste e efeitos de
  reflow;
- a ação permite normalizar somente posições, somente dimensões ou ambos;
- a unidade vem da grade da página e continua válida em coordenadas locais;
- o planejador transacional existente resolve mínimos, limites, autoridade e
  conflitos antes do commit;
- a confirmação aplica todo o conjunto ou nada e cria uma única entrada de
  histórico;
- seleção, schema, tipos, capacidades e Authoring Kit são preservados.

## Gates

- contrato Node para preview, aplicação, alinhamento à grade e undo;
- Chromium em `1366×768` cobrindo o fluxo pelo inspetor;
- suíte Node integral, build canônico idempotente e quatro shards Chromium na
  CI.
