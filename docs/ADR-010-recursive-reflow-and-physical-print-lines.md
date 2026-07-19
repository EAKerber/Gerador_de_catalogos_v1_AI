# ADR-010 - Reflow recursivo e linhas físicas de impressão

## Contexto

O mínimo de um contêiner era medido antes de seus filhos receberem a largura final. Em uma Área de composição em linha, um card podia mudar para o modo compacto depois da medição e exigir mais altura, permitindo que a borda do pai atravessasse sua tabela. O cabeçalho também misturava separadores editáveis com um pseudo-elemento e bordas genéricas, o que produzia linhas inconsistentes no PDF.

## Decisão

Contêineres persistem `reflow.mode`:

- `auto`, padrão: estabiliza a árvore em até quatro passagens, reaplica slots e auto-layout e mede mínimos após a geometria final dos descendentes;
- `manual`: preserva overrides internos e interrompe a propagação naquele contêiner.

O resize consulta uma cópia da subárvore, simula o reflow e usa o mínimo estabilizado antes de aceitar o frame.

As linhas horizontal e vertical do cabeçalho passam a ser componentes `separator`. Na impressão, espessura, marcador e bordas tabulares usam milímetros, com `print-color-adjust: exact`.

## Consequências

- o JSON continua sendo a fonte de verdade;
- Auto restaura slots de filhos e irmãos afetados sem ciclos;
- Manual mantém edição livre deliberada;
- cards compactos e tabelas repetíveis participam do mínimo vertical do pai;
- canvas e PDF compartilham os mesmos átomos, cores e terminações de linha.
