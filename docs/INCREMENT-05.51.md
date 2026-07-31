# Incremento 05.51 — ergonomia de `specification`

## Resultado

O átomo composto `specification` mantém **Automática** como densidade padrão:
cards compactos continuam fornecendo o fallback histórico, sem materializar
valores locais. A pessoa pode escolher **Compacta**, **Padrão** ou
**Confortável** para aplicar, respectivamente:

| Preset | Ícone | Gap | Padding horizontal |
| --- | ---: | ---: | ---: |
| Compacta | 80% | 3 px | 2 px |
| Padrão | 100% | 7 px | 4 px |
| Confortável | 120% | 10 px | 6 px |

Escala, gap e padding também podem ser alterados individualmente dentro desses
valores discretos. Nesse caso, o inspetor identifica a combinação como
**Personalizada**. O render usa variáveis internas controladas e não aceita CSS
arbitrário.

## Contratos preservados

- nenhuma opção altera o frame externo;
- seleção múltipla aplica o mesmo preset em uma ação composta;
- undo/redo restaura a combinação completa;
- exportação e importação preservam os valores;
- impressão usa os mesmos valores do editor;
- `CatalogDocument 1.16.0` permanece inalterado;
- Automática continua acompanhando a densidade editorial do card.

## Validação

- contrato Node de presets, ajustes discretos, lote, histórico, frames,
  round-trip e schema;
- contrato Chromium em 1366×768/100% para fallback compacto, precedência local,
  ajuste individual, lote, impressão e gate geométrico;
- Authoring Kit publica `specificationDensityControls` e os novos campos do
  componente.
