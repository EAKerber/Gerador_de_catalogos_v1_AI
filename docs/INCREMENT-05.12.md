# Incremento 05.12 — Auditoria manual e intenção contextual

## Objetivo

Repetir integralmente a reconstrução manual da referência em `1366×768`, separar essa métrica do fluxo automatizado e transformar a evidência em prioridades executáveis, sem otimizar o editor durante a medição.

## Entregas

- teste Playwright auditável com todas as mutações pela interface pública;
- log categorizado de 267 ações;
- contagem de cliques, preenchimentos, seleções, trocas de contexto, foco, correções e tentativas sem efeito;
- documento, capturas e PDF do ensaio;
- matriz de cobertura atualizada de 56% para 65%;
- ranking de fricção por fase;
- problemas confirmados promovidos ao backlog;
- resposta planejada para o Incremento 05.14;
- `CatalogAuthoringKit 1.5.1`, sem mudança funcional ou de schema, apenas alinhado à identificação do editor 05.12.

## Resultado

- linha de base 05.4: 319 ações;
- 05.12: 267 ações na execução canônica, com faixa observada de 267–268;
- redução: 52 ações, ou 16,3%;
- 7 produtos, 7 cards, 16 linhas, galerias 3/5 e 8 legendas;
- 8 colisões e 2 overflows detectados;
- 29 correções, das quais 7 começaram como clique sem efeito;
- tabelas e geometria: 157 ações, 58,8% do total.

## Contratos

- `CatalogDocument` permanece em `1.16.0`;
- nenhuma migração foi necessária;
- a arquitetura data-first e o compilador permanecem canônicos;
- `CatalogAuthoringKit 1.5.1` preserva capacidades e schemas do 1.5.0, atualizando a identificação do incremento;
- hospedagem, multipágina e colaboração continuam fora do runtime.

## Validação

- execução real em Chromium, `1366×768`, via `file://`;
- exportação JSON pela toolbar;
- PDF A4 gerado após acionar **Imprimir / PDF**;
- relatório de publicação coletado após o ensaio;
- contrato estático das evidências;
- suíte de domínio, schema, kit e chrome preservada.

Relatório detalhado: `REFERENCE-RECONSTRUCTION-USABILITY-AUDIT-05.12.md`.
