# Incremento 05.24 — estado canônico da V1

## Direção

Consolidar o encerramento da V1 single-page sem reabrir frentes funcionais e
sem duplicar capacidades já entregues no 05.18. O recorte transforma o estado
do projeto em contrato verificável, não apenas em narrativa dispersa.

## Problema confirmado

Após a integração do 05.23, `BACKLOG.md` e `ROADMAP.md` ainda marcavam o
incremento como em execução. A auditoria da biblioteca também mantinha como
lacunas os modos de produto, controles editoriais, escala de ícones,
`section-heading` e `fact`, embora runtime, Authoring Kit e testes já
comprovassem essas entregas.

## Contrato

- `feature-governance.json` publica a V1 single-page como `stable`;
- governança e manifesto publicam o mesmo incremento corrente;
- backlog diferencia fila ativa de histórico entregue;
- roadmap não reabre o 05.23;
- um teste Node bloqueia regressões nesses vínculos;
- nenhum tipo, capacidade ou campo de `CatalogDocument 1.16.0` é alterado.

## Gates

- coerência entre manifesto, governança, backlog e roadmap;
- 16 tipos, 45 capacidades e schema `1.16.0`;
- build idempotente do Authoring Kit;
- regressão Node integral;
- quatro shards Chromium técnico/promocional na CI.

## Fora do incremento

- multipágina e balanceamento;
- colaboração;
- expansão multimídia ou workflow de publicação;
- novos componentes;
- remoção de contratos compatíveis;
- reescrita do store.
