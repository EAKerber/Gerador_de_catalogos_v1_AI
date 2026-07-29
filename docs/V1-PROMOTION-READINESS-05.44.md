# Prontidão para promoção da V1 — checkpoint 05.44

## Estado comparado

- base estável: `main@0fda913609c59b231395ea0274abdb66a7c8e1ee`;
- base do checkpoint: `development@0452b3f`;
- merge-base: `0fda913609c59b231395ea0274abdb66a7c8e1ee`;
- divergência antes do 05.44: `development` 38 commits à frente e zero atrás;
- refs remotas após a poda: somente `main` e `development`;
- pull requests abertas após a poda: nenhuma.

O delta é linear em relação a `main`. A promoção não exige resolver
divergência, preservar branch de agente ou integrar conteúdo histórico.

## Contratos preservados

- V1 single-page fechada pelo Incremento 05.23;
- `CatalogDocument 1.16.0`;
- 16 tipos canônicos;
- 45 capacidades governadas;
- nove receitas;
- `CatalogAuthoringKit 1.6.0`;
- impressão/PDF A4 da página atual;
- referências técnica e promocional cobertas por gates bloqueantes.

## Evidência visual

A referência técnica recebida coincide byte a byte com
`docs/reference/catalogo-base.jpeg`:

- SHA-256:
  `4262171d057c6daedd47cd192600fa9f826d739552b4a4c84f38c917c010f2f6`;
- papel: critério canônico da V1;
- cobertura: reconstrução 05.17, PDF A4, zero colisão e zero overflow;
- natureza: referência externa, não golden image.

A referência promocional recebida em 2026-07-28 permanece benchmark pós-V1:

- nome de origem: `WhatsApp Image 2026-07-20 at 09.59.49.jpeg`;
- SHA-256:
  `dfdf29abd4d82f207071e482cb6f49bfd893f28a741039f1e38cffd02b4ab586`;
- não é requisito para reabrir o escopo V1;
- não foi promovida a baseline canônica nem copiada para o repositório.

Os gates promocionais existentes continuam bloqueando geometria, impressão,
preço completo, assets e round-trip. A ausência de golden images permanece uma
decisão explícita, não uma lacuna acidental da suíte.

## Gates do checkpoint

Executados localmente sobre `development@0452b3f`:

- build canônico idempotente;
- 99 contratos Node;
- integridade da referência técnica por hash;
- coerência entre Roadmap, Backlog e política visual.

Obrigatórios na PR do 05.44:

- Node, schema e build;
- árvore gerada sem diff;
- quatro shards Chromium;
- gates técnico e promocional bloqueantes.

O status remoto da PR é a autoridade para esses gates; este documento não
antecipa aprovação da CI.

## Riscos residuais

Não bloqueiam a promoção:

- baseline pixel a pixel não aprovada;
- benchmark promocional externo não versionado;
- P2 de preview do breakpoint e mínimo recomendável;
- P3 de legibilidade no mínimo técnico;
- reparenting, sobreposição promocional e multipágina em discovery ou pausa.

Bloqueiam a promoção:

- qualquer falha nos gates integrais;
- divergência nova entre `main` e o merge-base;
- alteração funcional não auditada no checkpoint;
- mudança de schema, tipos, capacidades ou receitas.

## Decisão e rollback

Com o 05.44 integrado e a CI integralmente verde, `development` fica apta para
promoção por fast-forward ou atualização equivalente de `main`. A promoção
continua condicionada à autorização explícita do usuário.

Rollback: preservar o SHA anterior de `main`, verificar o SHA de origem de
`development` antes da escrita e, diante de qualquer divergência, não mover a
ref. Depois da promoção, uma reversão deve ser deliberada e baseada no commit
anterior registrado; não recriar branches históricas nem mesclar a antiga PR
#1.
