# ADR-019 — Operações compostas para repetição manual previsível

## Status

Aceita no Incremento 05.6.

## Contexto

O editor oferecia profundidade suficiente, mas tratava cada produto, vínculo e célula como uma sequência isolada. No ensaio de reconstrução, cliques e preenchimentos representaram 306 das 319 ações. A compilação automatizada do 05.5 não alterou esse custo quando o usuário decidiu construir manualmente.

## Decisão

Preservar as operações unitárias e acrescentar operações compostas para repetições cujo resultado é inequívoco:

- várias linhas de produto podem ser coladas e confirmadas juntas;
- uma seleção explícita de produtos pode criar e vincular vários cards;
- várias linhas da tabela selecionada podem ser substituídas ou acrescentadas juntas.

Cada comando composto:

- depende de uma confirmação explícita;
- produz componentes e entidades comuns do mesmo schema;
- não cria um modo paralelo de documento;
- termina em uma única entrada de histórico;
- restaura o snapshot anterior inteiro se uma etapa falhar;
- deixa todos os itens disponíveis para edição individual.

## Consequências

- eficiência manual deixa de depender de automação integral do catálogo;
- o usuário conserva controle sobre seleção, colunas e momento da aplicação;
- operações frequentes deixam de exigir alternância repetida entre painéis;
- testes de ação passam a distinguir geração automatizada de construção manual;
- seleção múltipla genérica, propriedades em lote e templates de seção podem reutilizar a mesma fronteira transacional.
