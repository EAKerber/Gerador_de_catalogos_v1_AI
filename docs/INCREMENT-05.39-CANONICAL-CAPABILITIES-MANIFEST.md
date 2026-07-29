# Incremento 05.39 — Manifesto de capacidades canônico

## Objetivo

Remover o encadeamento tardio de wrappers sobre
`CatalogProjectManifests.buildCapabilitiesManifest`, preservando integralmente
as projeções de intenção editorial e posicionamento inicial provável.

## Escopo

- o gerador canônico chama explicitamente as duas projeções declarativas;
- os contratos de intenção e posicionamento apenas validam a integração e
  expõem sua função de enriquecimento;
- instalação, reinstalação e ordem inversa preservam a identidade do gerador;
- o manifesto continua publicando cinco grupos de intenção, dois hints de
  posicionamento e os 16 tipos canônicos;
- o Authoring Kit permanece derivado pelo build canônico.

## Fora do escopo

- novos tipos, capacidades, intenções ou regras de posicionamento;
- alterações de schema, documento, geometria, impressão ou interface;
- consolidação das receitas tardias;
- expansão da peça promocional de referência.

## Gates

- contrato Node de identidade, idempotência e ordem inversa;
- contratos existentes de intenção, posicionamento, ícones e pacote;
- suíte Node completa e quatro shards Chromium;
- dois builds canônicos consecutivos sem diff.
