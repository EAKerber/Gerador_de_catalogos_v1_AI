# Incremento 04.6 - Estruturas opcionais e PDF limpo

## Entrega

- tipos internos opcionais liberam sua reserva geométrica quando o último item é removido;
- a aba **Estrutura** lista ações **Adicionar “nome do item”** para slots ausentes;
- `structureInitialized` distingue uma estrutura ainda não migrada de uma remoção intencional persistida;
- Áreas de composição em linha ou coluna aceitam separadores contextuais quando `gap > 3 × minThickness`;
- separadores contextuais usam `layoutItem.overlay`, permanecem entre pares adjacentes e não alteram a distribuição;
- `footer-item` passa a ser um contêiner com slots de ícone, título e complemento;
- a cor vetorial é editada no átomo `icon` e chega ao SVG do rodapé;
- a migração transfere ícone, título, complemento e tokens dos itens legados;
- a Área de composição e todos os outlines editoriais ficam ausentes no PDF, mantendo os componentes internos visíveis;
- schema atualizado para `1.9.0`.

## Validação

Testes de domínio e navegador cobrem remoção, reload, restauração, limiar do separador, geometria de overlay, recoloração do ícone e migração. A prova A4 foi renderizada com Poppler e confirmou cards e rodapé sem o envelope da Área de composição ou contornos de seleção.
