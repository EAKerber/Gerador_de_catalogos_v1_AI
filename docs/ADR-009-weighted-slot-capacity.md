# ADR-009 - Capacidade ponderada de slots

## Contexto

Slots declaravam uma capacidade máxima, mas cada filho sempre consumia exatamente uma posição. Isso impedia uma peça de ocupar múltiplos espaços sem abandonar o contrato semântico do slot.

## Decisão

Cada referência de slot passa a persistir `span`, inteiro entre `1` e a capacidade do slot. A ocupação é a soma dos spans, não a quantidade de filhos. Documentos anteriores migram para `span: 1`.

Layouts em linha e coluna distribuem o eixo principal proporcionalmente ao span. Grades empacotam o filho em células consecutivas e respeitam a quantidade de colunas do slot. Se a soma exceder a capacidade, a alteração é recusada ou segue o fluxo explícito de substituição.

## Consequências

- a semântica de slot e as coordenadas locais são preservadas;
- a capacidade torna-se mensurável em unidades reservadas;
- duplicação conserva span somente quando houver capacidade disponível;
- reflow recursivo entre contêineres permanece uma etapa separada do Incremento 04.5.
