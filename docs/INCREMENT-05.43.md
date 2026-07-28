# Incremento 05.43 — Inventário e classificação histórica

## Objetivo

Transformar `agent/developer-b-05.18` de fonte ambígua em registro auditável,
sem mesclar sua árvore nem reintroduzir implementações anteriores ao estado
canônico.

## Fonte congelada

- histórico: `deec36ab49c14f480294b14192016df409294e43`;
- merge-base: `eae179360068505397e20550d7a47f30bbdcb32b`;
- base canônica: `development@de0559949b85e51a662bcbb73f01317eec9f9860`;
- 489 commits exclusivos;
- 231 caminhos auditados.

## Resultado

- 80 caminhos já canônicos byte a byte;
- 64 caminhos sucedidos no mesmo local;
- 40 documentos preservados somente pelo índice histórico;
- 191 cópias históricas classificadas para descarte;
- nenhum arquivo novo a migrar;
- nenhum merge da branch histórica;
- nenhuma baseline visual promovida.

O inventário registra caminho, categoria, mudança, tamanho, blob SHA, último
commit, quantidade de toques, equivalência em `development`, grupo de
dependência, decisão, justificativa e substituto canônico.

## Documentos

- `HISTORICAL-AUDIT-DEVELOPER-B-05.18.md`;
- `history/DEVELOPER-B-05.18-INVENTORY.json`;
- `VISUAL-EVIDENCE-POLICY.md`.

## Limites

Este incremento não:

- fecha a PR #1;
- exclui `agent/developer-b-05.18`;
- remove outras branches remotas;
- promove `development` para `main`;
- escolhe uma nova baseline visual;
- altera runtime, Authoring Kit, schema, tipos, receitas ou capacidades.

Fechar a PR #1 e excluir a branch histórica continuam condicionados à
integração deste relatório e à aprovação explícita do usuário.
