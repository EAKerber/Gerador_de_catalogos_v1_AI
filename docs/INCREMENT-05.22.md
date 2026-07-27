# Incremento 05.22 — encerramento geométrico da V1

**Estado:** integrado em `development` pela PR #4, com Node, build, schema e
quatro shards Chromium aprovados.

## Direção

O incremento corrige a atomicidade geométrica existente sem introduzir locks, constraints persistentes, campos de schema ou nova superfície visual. A decisão estratégica é concluir a V1 confiável e preparar uma migração arquitetural interna posterior, preservando documentos, testes e contratos de domínio.

Locks de largura, altura e proporção deixam de ser consequência presumida desta infraestrutura. Permanecem em discovery até que proteção direta efêmera, posição independente, snapshots e undo se mostrem insuficientes em um ensaio real.

## Checkpoint 1 — fronteira transacional

Escopo:

- planejar pedidos geométricos num store isolado;
- simular clamp, mínimos, slots, auto-layout, contratos de apresentação e reflow;
- enumerar frames diretos e derivados;
- enumerar mudanças de autoridade;
- detectar conflitos estruturais novos ou agravados;
- aplicar o conjunto numa única emissão e entrada de histórico, ou não aplicar nada;
- preservar o schema `1.16.0`;
- adaptar movimento/resize no canvas, frame avançado do inspetor, alinhamento, distribuição, transformação e grade heterogênea da multisseleção.

Fora do checkpoint:

- locks persistentes;
- proteção direta na interface;
- normalização explícita à grade;
- espaçamento com criação de separadores;
- inserção, duplicação e alterações estruturais;
- solver genérico de constraints;
- reescrita do store.

## Contrato público

`planGeometryTransaction(requests, options)` não altera documento, histórico, seleção ou listeners. O resultado contém:

- `status`: `applied`, `adjusted` ou `blocked`;
- frames `requested` e `resolved`;
- `changes`, distinguindo alvos diretos de reflow derivado;
- `authorityChanges`;
- `reasons`;
- `conflicts`.

`applyGeometryTransaction(requests, options)` usa o mesmo plano. Um resultado bloqueado não emite mudança. Um resultado aplicável sincroniza somente o estado geométrico planejado e emite o comando final uma vez.

`updateComponentGeometry` é o adaptador para um único componente. `updateComponent` permanece compatível para chamadas autorais não migradas neste checkpoint.

## Gates

- planejamento puro;
- uma emissão e um undo por commit;
- lote inválido não altera nenhum alvo;
- autoridade só é liberada junto do frame aplicável;
- reflow de filhos e irmãos aparece no relatório;
- canvas e inspetor não liberam autoridade antecipadamente;
- comandos geométricos de multisseleção preservam o retorno público anterior;
- Authoring Kit e editor usam o mesmo store;
- 16 tipos, 45 capacidades e schema `1.16.0` preservados;
- referências técnica e promocional continuam válidas nos gates existentes.

## Próximos recortes

1. Migrar espaçamento/separadores para uma transação que inclua mudanças estruturais — iniciado no 05.23.
2. Migrar os demais caminhos manuais apenas quando houver risco comprovado de estado parcial.
3. Encerrar a V1 com regressões, documentação de limites e backlog ativo reduzido.
4. Iniciar a arquitetura V2 como extração incremental de comandos geométricos, conteúdo, histórico e seleção; não reescrever do zero.
