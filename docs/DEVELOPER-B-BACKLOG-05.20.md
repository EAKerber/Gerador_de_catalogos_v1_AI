# Developer B — backlog 05.20

## Origem

Este backlog deriva do benchmark promocional DB-05.20.1 e da auditoria de categoria DB-05.20.9.

Não autoriza merge nem altera decisões base do projeto. O ciclo deve reduzir esforço e, após a nova auditoria, impedir que uma intenção promocional de varejo seja traduzida para uma gramática editorial/tabular de categoria diferente.

## Princípios reguladores

1. Corrigir problemas observados antes de ampliar a biblioteca.
2. Preservar os 16 tipos enquanto receitas e tokens puderem expressar o comportamento.
3. Tratar fotografia, personagem, megafone, desenho técnico e shapes irregulares como assets quando não exigirem comportamento próprio.
4. Manter código, medida, preço, repetição, distribuição e hierarquia editáveis nativamente.
5. Medir redução de ações e fidelidade de categoria, não apenas existência de controles.
6. Manter exportação, reimportação, impressão, histórico e build idempotente como gates bloqueantes.
7. Distinguir defeito de produto de erro ou ambiguidade do harness antes de alterar runtime.
8. Preferir tokens semânticos e receitas editáveis a componentes específicos de uma referência.
9. Quatro linhas de tabela não equivalem a quatro ofertas comerciais.
10. Assets reais não podem ser usados para mascarar ausência de estrutura comercial ou vocabulário cromático.

## Estado dos incrementos anteriores

### DB-05.20.1 — Benchmark de generalização promocional

**Estado:** concluído e consolidado.

Resultado final:

- 180 ações;
- 59 componentes;
- quatro linhas comerciais;
- 11 aplicações conjuntas de frame;
- zero aberturas de **Avançado** para geometria;
- zero colisões;
- zero overflows;
- zero referências obrigatórias ausentes;
- exportação/reimportação equivalentes;
- PDF A4 gerado.

A interpretação “quatro ofertas” foi posteriormente corrigida pela auditoria DB-05.20.9: havia quatro registros tabulares, mas somente uma unidade visual de oferta.

### DB-05.20.2 — Hit testing e seleção de peças internas

**Estado:** concluído como correção de harness, sem mudança de runtime.

A seleção de `art` para editar propriedades passa pela árvore de Camadas; o clique no placeholder permanece reservado à escolha/substituição de asset.

### DB-05.20.3 — Diagnóstico da referência ausente

**Estado:** concluído.

O validador separa referências `missing`, `invalid` e `optional`. Cards locais e placeholders de arte não são mais tratados como IDs obrigatórios ausentes.

### DB-05.20.4 — Fronteiras da coalescência de histórico

**Estado:** condicionado.

Reabrir somente se uma nova execução reproduzir agrupamento entre tarefas visualmente distintas.

### DB-05.20.5 — Aplicação conjunta de frame

**Estado:** concluído.

Resultados:

- geometria: 44 → 11 ações;
- total: 219 → 180 ações;
- comando conjunto sempre visível;
- undo/redo exatos;
- app e AuthoringKit em paridade.

### DB-05.20.6 — Arranjo promocional de alto nível

**Estado:** substituído pela sequência DB-05.20.11–14.

Uma macroestrutura não deve ser criada antes de existirem unidade de oferta e bloco de preço reutilizáveis. Eventual receita de página será reconsiderada somente depois do benchmark V2 e de outra referência não relacionada.

### DB-05.20.7 — Legibilidade de benefícios e callout

**Estado:** suspenso.

**Prioridade:** P1, após DB-05.20.14.

A tentativa de melhorar wrap e callout não resolve os déficits P0 confirmados. O teste dedicado permanece útil, mas nenhuma alteração visual deste incremento deve preceder estrutura de oferta, preço e superfícies promocionais.

Quando retomado, deve validar:

- ícone, título e descrição curta quando houver espaço;
- compactação em até duas linhas;
- callout amplo e compacto distintos;
- tela e impressão;
- ausência de regressão no benchmark V2.

### DB-05.20.8 — Benchmark com assets reais

**Estado:** adiado.

**Prioridade:** P2, depois do benchmark V2.

Assets reais só entram depois de estrutura comercial 100/100 e primeiro marco cromático. A execução deverá separar claramente melhoria causada por asset de melhoria causada por capacidades nativas.

### DB-05.20.9 — Auditoria de fidelidade promocional

**Estado:** concluído.

Resultado:

- cromático: 0/100;
- estrutural: 50/100;
- consolidado: 25/100;
- vermelho: 0,92%;
- amarelo: 0,003%;
- escuro: 0,48%;
- branco: 92,54%;
- ofertas independentes: 1/4;
- contêineres visuais de preço: 1/4.

Achados reguladores:

- `OFFER_UNITS_COLLAPSED`;
- `PRICE_HIERARCHY_TABULAR`;
- `PROMOTIONAL_RED_DEFICIT`;
- `PROMOTIONAL_YELLOW_ABSENT`;
- `DARK_CONTRAST_DEFICIT`;
- `SATURATION_DEFICIT`;
- `EDITORIAL_WHITESPACE_EXCESS`.

## Nova sequência prioritária

### DB-05.20.10 — Contrato e prontidão da remediação promocional

**Estado:** ativo.

**Prioridade:** P0 regulatória.

Entregas:

- contrato legível por máquina;
- definições normativas de unidade de oferta, bloco de preço e superfícies;
- teste Node de prontidão;
- teste Chromium de aceitação futura;
- workflow somente leitura;
- baseline explícito de capacidades ausentes.

Arquivos centrais:

- `tests/fixtures/promotional-remediation-contract-05.20.10.json`;
- `tests/promotional-remediation-readiness-05.20.10.test.js`;
- `tests/browser-promotional-remediation-acceptance-05.20.10.test.js`;
- `docs/evidence/05.20/developer-b/DB-05.20.10-PROMOTIONAL-REMEDIATION-PLAN.md`.

O modo padrão dos testes é informativo. A variável `CATALOG_PROMOTIONAL_REMEDIATION_ENFORCE=1` torna déficits bloqueantes após a implementação.

### DB-05.20.11 — Vocabulário semântico promocional

**Estado:** pendente.

**Prioridade:** P0.

Adicionar sem hardcode de referência:

- `promo.primary`, `promo.secondary`, `promo.dark`;
- tokens de contraste `promo.on-*`;
- `surface.promo-primary`, `surface.promo-secondary`, `surface.promo-dark`;
- `type.promo-title`, `type.promo-price`, `type.promo-qualifier`, `type.promo-meta`.

Critérios:

- guideline pode trocar valores sem alterar receitas;
- tokens aparecem no inspetor atual;
- app e AuthoringKit em paridade;
- impressão preserva cor;
- build idempotente;
- teste de prontidão deixa de reportar tokens ausentes.

### DB-05.20.12 — Receita `commerce-price-block`

**Estado:** pendente.

**Prioridade:** P0.

Composição inicial com tipos existentes.

Papéis obrigatórios:

- `price-block`;
- `currency`;
- `amount`.

Papéis opcionais:

- `old-price`;
- `qualifier`;
- `unit`.

Critérios:

- preço atual ≥ 2× metadado;
- preço atual ≥ 1,5× medida;
- opcionais removíveis sem colapso;
- inserção em uma transação;
- tela e impressão equivalentes;
- nenhuma promoção para novo tipo.

### DB-05.20.13 — Receita `commerce-offer-unit`

**Estado:** pendente.

**Prioridade:** P0.

Papéis obrigatórios:

- `offer-unit`;
- `media`;
- `code`;
- `measure`;
- `price-block`.

Critérios:

- quatro instâncias independentes;
- quatro contêineres de preço;
- duplicação, exclusão e reordenação independentes;
- IDs únicos;
- nenhuma dependência de `data-table` para representar quatro ofertas;
- zero colisões, overflow e referências obrigatórias ausentes;
- undo/redo e exportação/reimportação exatos.

### DB-05.20.14 — Benchmark promocional V2

**Estado:** pendente.

**Prioridade:** P0 — gate das remediações.

Executar novamente a referência com as novas capacidades.

Metas do primeiro marco:

- estrutura comercial: 100/100;
- cromático: ≥ 50/100;
- consolidado: ≥ 75/100;
- quatro ofertas independentes;
- quatro preços visuais;
- apresentação `independent-repeated-offers`;
- até 190 ações;
- zero regressões técnicas.

Aumentar o cromático sem corrigir estrutura, ou corrigir estrutura mantendo 0/100 cromático, não encerra o marco.

### DB-05.20.15 — Callout e faixa de benefícios

**Estado:** pendente.

**Prioridade:** P1.

Consolida a retomada do DB-05.20.7:

- callout com shape/asset opcional e texto nativo;
- benefício com ícone, título e descrição;
- estados amplo e compacto;
- sem novo tipo na primeira tentativa;
- deve manter as metas do benchmark V2.

### DB-05.20.16 — Benchmark com assets reais

**Estado:** pendente.

**Prioridade:** P2.

Executar somente após DB-05.20.14:

- logo;
- produto;
- desenho técnico;
- personagem/megafone/faixas como asset composto opcional.

Medir crop, foco, persistência, PDF e contribuição real dos assets para a fidelidade.

### DB-05.20.17 — Receita macro promocional

**Estado:** condicionado.

**Prioridade:** P3.

Só pode ser proposta se:

- unidade de oferta e preço estiverem estáveis;
- duas ou mais referências diferentes repetirem a macroestrutura;
- a receita reduzir ações sem ocultar a composição;
- cada unidade continuar independente.

## Ordem regulada

1. DB-05.20.10 — executar e registrar baseline de prontidão.
2. DB-05.20.11 — tokens e superfícies semânticas.
3. DB-05.20.12 — bloco de preço.
4. DB-05.20.13 — unidade de oferta.
5. DB-05.20.14 — benchmark promocional V2.
6. DB-05.20.15 — callout e benefícios.
7. DB-05.20.16 — assets reais.
8. Reabrir DB-05.20.4 apenas com reprodução nova.
9. Avaliar DB-05.20.17 somente com evidência multirreferência.

## Gates do ciclo

Nenhum incremento pode ser considerado concluído se introduzir:

- erro de página ou console;
- divergência modelo × DOM;
- perda em exportação/reimportação;
- undo/redo não reversível;
- colisão ou overflow inesperado;
- referência obrigatória ausente;
- mudança de schema;
- promoção acidental de receita para tipo;
- dependência no compilador sem espelho no AuthoringKit;
- build não idempotente;
- redução de conteúdo comercial para uma imagem única;
- quatro registros tabulares apresentados como quatro ofertas;
- tokens de cor codificados para uma referência em vez de papéis semânticos.

## Gate editorial adicional

A partir do DB-05.20.14, o gate técnico verde não é suficiente. Também são obrigatórios:

- estrutura comercial 100/100;
- cromático ≥ 50/100 no primeiro marco;
- consolidado ≥ 75/100;
- documentação do delta de ações e de categoria.
