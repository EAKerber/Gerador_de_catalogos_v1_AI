# Incremento 05.32 — Apresentação em lote com confirmação

## Objetivo

Reduzir estados intermediários ao preparar uma apresentação comum para vários
cards. Antes, cada alteração de preset, modo ou densidade era aplicada no
momento da escolha; uma combinação editorial exigia vários commits e vários
reflows mesmo quando o usuário ainda estava decidindo.

## Mudanças

- a seleção múltipla mantém preset, modo e densidade como rascunho efêmero;
- o preview informa os cards afetados e a maior variação de mínimo de altura;
- escolher uma opção não muda o documento nem cria histórico;
- **Aplicar apresentação** confirma o patch inteiro em uma única transação;
- **Descartar rascunho** devolve o inspetor ao documento sem efeitos;
- trocar a seleção descarta automaticamente um rascunho incompatível.

O comportamento usa a apresentação, o reflow e o histórico canônicos. Não há
novo tipo, campo persistido, schema, capacidade ou motor geométrico paralelo.

## Gates

- contrato Node para preview puro e aplicação atômica;
- Chromium em `1366×768` cobrindo rascunho, ausência de mutação/histórico,
  confirmação e undo;
- build canônico idempotente, suíte Node integral e quatro shards Chromium na
  CI.
