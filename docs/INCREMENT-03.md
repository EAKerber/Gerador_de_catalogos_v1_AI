# Incremento 03 — Layout e snap inteligente

## Objetivo

Adicionar inteligência de composição sem retirar o controle manual. O editor continua baseado em coordenadas locais e JSON, mas agora consegue sugerir alinhamentos, preservar distâncias recorrentes, calcular limites de conteúdo e organizar filhos automaticamente.

## Entregue

### Snap inteligente

- alinhamento magnético por borda esquerda, direita, superior e inferior;
- alinhamento por centro horizontal e vertical;
- alvos na borda do contêiner, centro, margem segura e componentes irmãos;
- tolerância configurável em `3`, `6`, `10` ou `14 px`;
- guias visuais azuis para alinhamento;
- guias roxas para repetição de distância;
- detecção de espaçamento antes ou depois de pares de componentes;
- suporte em movimento e no canto de redimensionamento;
- override global com `Alt`;
- override independente por `snapX`, `snapY`, `freeX` e `freeY`.

### Área de composição

Novo componente estrutural **Área de composição**:

- funciona como canvas interno vazio;
- aceita estruturas, elementos, peças internas e outras áreas de composição;
- modos `livre`, `linha`, `coluna` e `grade`;
- configuração de padding, gap, colunas e alinhamento;
- filhos podem participar do auto-layout ou manter posição manual;
- arrastar um filho gerenciado cria override somente naquele item;
- comando para reintegrar o item à sequência automática.

### Regras responsivas

- uma área de composição pode trocar de modo quando sua largura cruza um breakpoint;
- breakpoint e modo compacto são salvos no documento;
- o card de produto possui regra interna própria:
  - a partir de `320 px`: arte à esquerda e especificações em coluna;
  - abaixo de `320 px`: arte em largura total e especificações em grade de duas colunas.

### Tamanho mínimo calculado

O limite de resize combina:

- mínimo declarado pelo tipo;
- mínimo dos filhos;
- padding e gaps;
- número de colunas;
- modo efetivo, incluindo o modo responsivo;
- extensões de filhos em posição livre.

O inspetor mostra o mínimo calculado para o componente selecionado.

## Modelo JSON 1.2.0

Campos do editor:

```json
{
  "smartSnapEnabled": true,
  "equalSpacingEnabled": true,
  "showGuides": true,
  "snapTolerance": 6
}
```

Configuração de contêiner:

```json
{
  "layout": {
    "mode": "grid",
    "padding": 12,
    "gap": 12,
    "columns": 2,
    "align": "stretch",
    "responsive": {
      "enabled": true,
      "breakpoint": 300,
      "mode": "column"
    }
  }
}
```

Configuração de filho:

```json
{
  "layoutItem": {
    "managed": true,
    "grow": 1,
    "span": 1
  }
}
```

## Como validar visualmente

1. Arraste três componentes para a página.
2. Mova um deles próximo às bordas e aos centros dos outros.
3. Observe as guias azuis e o encaixe magnético.
4. Posicione dois elementos com uma distância conhecida e aproxime o terceiro antes ou depois do par.
5. Observe a guia roxa com o valor do espaçamento.
6. Arraste uma **Área de composição** para a página e entre nela.
7. Adicione textos, artes ou cards.
8. No inspetor, altere o layout para linha, coluna e grade.
9. Redimensione a área abaixo do breakpoint para observar a mudança responsiva.
10. Arraste manualmente um filho do auto-layout e use **Reintegrar ao auto-layout**.

## Limites desta etapa

- o equal spacing atual trabalha com extensão lógica antes ou depois de pares de irmãos; distribuição coletiva por seleção múltipla fica para uma etapa posterior;
- apenas o canto inferior direito participa do resize;
- baseline tipográfica dedicada ainda não foi implementada;
- não existe seleção múltipla, comandos de distribuir ou histórico de desfazer;
- a renderização continua integral por simplicidade do protótipo.
