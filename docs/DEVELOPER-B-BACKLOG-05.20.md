# Developer B — backlog 05.20

## Origem e objetivo

Este ciclo deriva do benchmark promocional DB-05.20.1 e da auditoria de categoria DB-05.20.9.

A referência não precisa ser reproduzida pixel a pixel. O sistema deve, porém, preservar sua intenção editorial: uma promoção de varejo não pode ser automaticamente traduzida para um catálogo neutro com um card e uma tabela.

A branch continua isolada, sem autorização de merge.

## Princípios reguladores

1. Preservar os 16 tipos enquanto tokens e receitas forem suficientes.
2. Fotografia, personagem, megafone, desenho técnico e shapes irregulares podem ser assets.
3. Código, medida, preço, repetição, distribuição e hierarquia comercial devem permanecer nativos e editáveis.
4. Quatro linhas de tabela não equivalem a quatro ofertas comerciais.
5. Preferir tokens semânticos e receitas editáveis a componentes específicos de uma referência.
6. Medir ações e fidelidade de categoria, além de estabilidade técnica.
7. Exportação, reimportação, impressão, histórico, paridade do AuthoringKit e build idempotente permanecem gates.
8. Falha de teste é evidência; falha de infraestrutura deve ser distinguida antes de alterar produto.

## Incrementos anteriores

### DB-05.20.1 — Benchmark inicial

**Estado:** concluído.

- 180 ações;
- 59 componentes;
- zero colisões e overflows;
- quatro registros comerciais em uma única tabela;
- exportação, reimportação e PDF aprovados.

A auditoria posterior corrigiu a interpretação: havia quatro registros, mas somente uma unidade visual de oferta.

### DB-05.20.2 — Hit testing

**Estado:** concluído como correção de harness.

A seleção de arte para edição usa Camadas; clicar no placeholder permanece reservado à biblioteca de assets.

### DB-05.20.3 — Relatório de referências

**Estado:** concluído.

O validador separa referências `missing`, `invalid` e `optional`. Cards locais e placeholders não são mais erros obrigatórios.

### DB-05.20.4 — Coalescência de histórico

**Estado:** condicionado.

Reabrir somente com nova reprodução de agrupamento entre tarefas visualmente distintas.

### DB-05.20.5 — Aplicação conjunta de frame

**Estado:** concluído.

- geometria: 44 → 11 ações;
- total: 219 → 180 ações;
- comando conjunto sempre visível;
- undo/redo e AuthoringKit aprovados.

### DB-05.20.6 — Macroarranjo promocional

**Estado:** condicionado.

Só poderá ser retomado após evidência de macroestrutura repetida em pelo menos duas referências diferentes.

### DB-05.20.7 — Legibilidade de benefícios e callout

**Estado:** substituído por DB-05.20.15.

O teste vermelho existente registra um limite real de rótulo longo, mas não bloqueou os incrementos P0.

### DB-05.20.8 — Assets reais

**Estado:** substituído por DB-05.20.16.

Assets entram somente depois da correção estrutural e cromática nativa.

### DB-05.20.9 — Auditoria de fidelidade inicial

**Estado:** concluído.

Baseline:

- cromático: 0/100;
- estrutural: 50/100;
- consolidado: 25/100;
- vermelho: 0,92%;
- amarelo: 0,003%;
- escuro: 0,48%;
- branco: 92,54%;
- ofertas independentes: 1/4;
- preços visuais: 1/4.

Achados: `OFFER_UNITS_COLLAPSED`, `PRICE_HIERARCHY_TABULAR`, `PROMOTIONAL_RED_DEFICIT`, `PROMOTIONAL_YELLOW_ABSENT`, `DARK_CONTRAST_DEFICIT`, `SATURATION_DEFICIT` e `EDITORIAL_WHITESPACE_EXCESS`.

## Sequência de remediação

### DB-05.20.10 — Contrato e prontidão

**Estado:** concluído.

Baseline do run `29936136554`:

- 13 tokens ausentes;
- duas receitas ausentes;
- oito papéis obrigatórios ausentes;
- 23 déficits totais;
- zero regressões técnicas.

Arquivos normativos:

- `tests/fixtures/promotional-remediation-contract-05.20.10.json`;
- `tests/promotional-remediation-readiness-05.20.10.test.js`;
- `tests/browser-promotional-remediation-acceptance-05.20.10.test.js`;
- `docs/evidence/05.20/developer-b/DB-05.20.10-PROMOTIONAL-REMEDIATION-PLAN.md`.

### DB-05.20.11 — Vocabulário semântico promocional

**Estado:** concluído.

**Run principal:** `29966017960`.

Entregas:

- `promo.primary`, `promo.secondary`, `promo.dark`;
- `promo.on-primary`, `promo.on-secondary`, `promo.on-dark`;
- `surface.promo-primary`, `surface.promo-secondary`, `surface.promo-dark`;
- `type.promo-title`, `type.promo-price`, `type.promo-qualifier`, `type.promo-meta`;
- opções disponíveis no inspetor;
- tela e impressão equivalentes;
- app e AuthoringKit em paridade;
- build idempotente.

O inventário passou a 29 cores, 15 superfícies e 14 tipografias. Os 13 déficits semânticos foram eliminados sem adicionar receita.

### DB-05.20.12 — Receita `commerce-price-block`

**Estado:** concluído.

**Run principal:** `29966562233`.

A composição usa somente `layout-container` e `text`.

Papéis obrigatórios:

- `price-block`;
- `currency`;
- `amount`.

Papéis opcionais:

- `old-price`;
- `qualifier`;
- `unit`.

Resultados:

- preço atual domina metadado em pelo menos 2×;
- preço atual domina qualificador em pelo menos 1,5×;
- opcionais removíveis sem colapso;
- inserção em uma transação;
- tela, impressão, histórico e build aprovados;
- nenhuma tabela e nenhum novo tipo.

### DB-05.20.13 — Receita `commerce-offer-unit`

**Estado:** concluído.

**Run principal:** `29967582380`.

Papéis:

- `offer-unit`;
- `media`;
- `code`;
- `measure`;
- `price-block`;
- `currency`;
- `amount`.

Resultados:

- prontidão bloqueante: zero déficits;
- quatro unidades e quatro preços independentes;
- nenhuma dependência de `data-table`;
- IDs únicos;
- duplicação, exclusão, edição e reordenação independentes;
- undo/redo, exportação/reconstrução e impressão aprovados;
- zero colisões, overflow e referências obrigatórias ausentes;
- build idempotente.

### DB-05.20.14 — Benchmark promocional V2

**Estado:** concluído.

**Run:** `29968221161`.

Resultados técnicos:

- status: `pass-with-findings`;
- 189 ações;
- 96 componentes;
- quatro ofertas independentes;
- quatro blocos de preço no benchmark;
- zero linhas tabulares;
- zero colisões e overflows;
- zero referências obrigatórias ausentes;
- três undos e três redos exatos;
- exportação/reimportação e PDF aprovados;
- schema `1.16.0`.

Resultado editorial:

- estrutura comercial: **100/100**;
- cromático: **87,5/100**;
- consolidado: **93,8/100**;
- vermelho: 12,00%;
- amarelo: 8,91%;
- escuro: 8,94%;
- saturado: 21,74%;
- branco: 61,49%;
- apresentação: `independent-repeated-offers`;
- fonte dos registros: `independent-offer-units`.

O único piso cromático não alcançado foi a maior massa escura contínua: 1,41% contra 2,2%. Não houve finding estrutural ou cromático emitido pelo relatório final.

Findings técnicos residuais:

- cinco placeholders de asset;
- um fallback de arraste para posicionar o rodapé.

O marco P0 foi atingido sem novo tipo.

## Próximos incrementos

### DB-05.20.15 — Callout e faixa de benefícios

**Estado:** ativo.

**Prioridade:** P1.

Objetivo: retomar a legibilidade suspensa sem reduzir as metas do V2.

Callout:

- shape ou asset opcional separado do texto;
- título e corpo nativos;
- estados amplo e compacto distintos;
- possibilidade de reforçar uma massa escura contínua;
- sem novo tipo na primeira tentativa.

Benefícios:

- ícone, título e descrição curta quando houver espaço;
- modo compacto com até duas linhas;
- escala vetorial 80/100/120 preservada;
- tela e impressão equivalentes.

Critérios bloqueantes:

- benchmark V2 ≤ 190 ações;
- estrutura 100/100;
- cromático ≥ 50/100;
- consolidado ≥ 75/100;
- zero regressões técnicas.

### DB-05.20.16 — Benchmark com assets reais

**Estado:** pendente.

**Prioridade:** P2.

Executar com logo, produto, desenho técnico e asset composto opcional para personagem/faixas/megafone. Medir contribuição dos assets separadamente do repertório nativo.

### DB-05.20.17 — Receita macro promocional

**Estado:** condicionado.

**Prioridade:** P3.

Só pode ser proposta se uma segunda referência não relacionada repetir a macroestrutura e se a receita reduzir ações sem ocultar a independência das ofertas.

## Ordem regulada atual

1. DB-05.20.15 — callout e benefícios.
2. Reexecutar o benchmark V2 e preservar os gates editoriais.
3. DB-05.20.16 — assets reais.
4. Reabrir DB-05.20.4 somente com nova reprodução.
5. Avaliar DB-05.20.17 somente com evidência multirreferência.

## Gates permanentes

Nenhum incremento pode ser considerado concluído se introduzir:

- erro de página ou console;
- divergência modelo × DOM;
- perda em exportação/reimportação;
- undo/redo não reversível;
- colisão ou overflow inesperado;
- referência obrigatória ausente;
- mudança de schema;
- promoção acidental de receita para tipo;
- dependência sem espelho no AuthoringKit;
- build não idempotente;
- redução de conteúdo comercial a uma imagem única;
- retorno a quatro registros tabulares tratados como quatro ofertas;
- token específico de uma referência em vez de papel semântico.

A partir do DB-05.20.14, um gate técnico verde não basta. São também obrigatórios:

- estrutura comercial 100/100;
- cromático ≥ 50/100;
- consolidado ≥ 75/100;
- documentação do delta de ações e de categoria.
