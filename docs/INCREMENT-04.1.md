# Incremento 04.1 — Conteúdo repetível e composição

## Objetivo

Completar os contratos de conteúdo que ficaram preparados após a biblioteca de artes: linhas tabulares reutilizáveis, legendas ligadas a imagens e geração previsível de cópias, sem misturar essas regras com o armazenamento binário.

## Entregue

- coleção genérica `tableRows` com `itemType: "table-row"`;
- tabelas ligadas por `collectionId` e sequência ordenada de `rowIds`;
- inclusão, edição, reordenação e remoção de linhas pelo inspetor;
- altura mínima de tabela e card recalculada pela quantidade de linhas;
- migração de `code`, `package` e `price` antigos para a primeira linha;
- legendas de arte em faixa inferior ou sobreposição;
- duplicação simples preservada;
- duplicação para esquerda, direita, acima ou abaixo;
- cálculo por espaçamento externo ou deslocamento direto;
- uma a vinte cópias por comando;
- cópias de tabelas com novos IDs de linha, independentes do original;
- schema 1.5.0, migração, testes e documentação.

## Fluxo tabular

1. O componente `data-table` ordena referências em `props.rowIds`.
2. O store resolve cada referência na coleção indicada por `collectionId`.
3. O renderer recebe o store como contexto e projeta cabeçalho e linhas.
4. Ao mudar a quantidade, o store recalcula o mínimo da tabela e os slots do card.
5. Ao duplicar uma subárvore, as linhas são clonadas na coleção com novos IDs.

Tabelas antigas são normalizadas automaticamente: os três campos legados formam a primeira linha, sem perder o conteúdo original.

## Duplicação

- `gap`: passo = tamanho do componente no eixo + distância;
- `offset`: passo = distância;
- o sinal do passo vem da direção;
- a posição final continua limitada ao contêiner pelo mesmo `clampFrame` das interações existentes.

## Fora do escopo

- bindings de produto e atualização coletiva de preço;
- fórmulas, colunas arbitrárias e tipos de célula;
- cabeçalho e rodapé compostos;
- seleção múltipla;
- agrupamento, desfazer/refazer e distribuição por seleção;
- reorganização dos painéis por abas;
- zoom do workspace por roda do mouse.

Esses pontos permanecem no roadmap e em `BACKLOG.md`.
