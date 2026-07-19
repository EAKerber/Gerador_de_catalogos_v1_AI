# ADR-002 — Containers usam coordenadas locais e slots semânticos

## Status

Aceita no Incremento 02.

## Contexto

O editor precisa permitir que cards e outras estruturas sejam movidos como uma única unidade na página, mas também abertos para edição interna. Usar coordenadas globais para todos os descendentes tornaria movimento, duplicação, templates e responsividade mais frágeis.

## Decisão

1. Cada filho armazena seu `frame` relativo ao canto superior esquerdo do pai.
2. O contexto ativo é identificado por `editor.editingContextId`.
3. Containers declaram no registro:
   - tipos aceitos;
   - slots semânticos;
   - capacidade;
   - geometria local;
   - layout local opcional.
4. A instância filha pode guardar uma referência de slot:

```json
{
  "slot": {
    "name": "specifications",
    "order": 1,
    "managed": true
  }
}
```

5. `managed: false` preserva o vínculo sem sobrescrever uma posição manual.
6. O HTML não é persistido; a árvore JSON continua sendo a fonte de verdade.

## Consequências positivas

- mover um card não exige atualizar todos os filhos;
- templates podem ser duplicados como subárvores;
- um slot pode impor compatibilidade e capacidade;
- o motor futuro de auto-layout pode operar localmente;
- a mesma arquitetura pode ser aplicada a cabeçalhos, rodapés e grupos.

## Consequências negativas

- hit testing e clamp precisam conhecer o pai;
- seleção e exclusão passam a ser recursivas;
- migrações precisam hidratar componentes antigos;
- resize do container precisa considerar filhos gerenciados.

## Alternativas rejeitadas

### Coordenadas globais para todos os elementos

Simplificaria o primeiro renderer, mas tornaria grupos, duplicação e templates muito mais complexos.

### HTML aninhado como estado principal

Seria rápido para prototipar, porém acoplaria persistência à implementação visual e dificultaria API, validação e migração.

### Slots apenas visuais

Não atenderia substituição, compatibilidade, reordenação e vínculo semântico exigidos pelo editor.
