# Incremento 04.2.1 - Impressão e PDF A4 da página atual

## Objetivo

Disponibilizar uma saída confiável da visualização atual sem duplicar o documento JSON em um segundo formato de renderização. A ação usa o diálogo nativo de impressão do navegador, onde o usuário escolhe **Salvar como PDF**.

## Entrega

- botão **Imprimir / PDF** na barra superior;
- preparação transitória da página atual para impressão e nome sugerido `catalogo-a4`;
- folha A4 vertical em `210 mm x 297 mm`, margem zero e sem a escala do workspace;
- interface do editor, grid, área segura, seleção, handles, guias e gatilhos de edição ocultos na impressão;
- ciclo `beforeprint`/`afterprint` que restaura o estado visual e o título ao sair do diálogo;
- teste de navegador para o acionamento e a preparação da folha.

## Limites deliberados

Esta etapa não cria download silencioso nem rasteriza a página. O navegador controla a escolha da impressora e do destino PDF, preservando textos, SVGs e vetores quando suportados pelo próprio navegador.

O schema permanece em `1.6.0`: a impressão é uma projeção efêmera do mesmo JSON que já é a fonte de verdade. Exportação direta, múltiplas páginas, sangria configurável e pacote portátil seguem no Incremento 06.

## Uso

1. Monte a página no editor.
2. Clique em **Imprimir / PDF**.
3. No diálogo do navegador, selecione **Salvar como PDF**.
4. Confirme A4, escala de 100% e margens padrão/nenhuma, conforme o navegador.
