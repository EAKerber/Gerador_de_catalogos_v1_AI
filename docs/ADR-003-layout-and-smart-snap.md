# ADR-003 — Motor de layout e snap separado da interface

## Estado

Aceita no Incremento 03.

## Contexto

Guias, breakpoints, mínimos de conteúdo e auto-layout seriam difíceis de manter se fossem implementados diretamente nos eventos do mouse ou em regras CSS isoladas. O mesmo cálculo será necessário no futuro para API, exportação, validação e templates.

## Decisão

Criar `app/layout-engine.js` como módulo determinístico, sem dependência direta do DOM.

O motor recebe frames e configurações e retorna:

- frame ajustado;
- guias semânticas;
- modo de layout efetivo;
- mínimo calculado;
- novos frames dos filhos gerenciados.

O módulo de interações apenas converte ponteiro em coordenadas locais, solicita o cálculo e desenha as guias. O store continua responsável por persistir os resultados.

## Consequências

### Positivas

- os cálculos podem ser testados em Node sem navegador;
- a exportação futura pode reutilizar as mesmas regras;
- o JSON guarda intenção (`layout`) e participação (`layoutItem`), não CSS gerado;
- componentes podem ter regras responsivas próprias;
- overrides manuais não destroem a configuração do contêiner.

### Custos

- a normalização do schema ganhou novos campos;
- mínimos recursivos exigem cuidado com containers aninhados;
- o protótipo ainda recalcula a árvore completa após alterações.

## Alternativas rejeitadas

- **CSS Flexbox/Grid como fonte de verdade:** simples para visualização, mas insuficiente para coordenadas persistidas, exportação e overrides explícitos.
- **Snap implementado somente no DOM:** acoplaria o comportamento ao zoom, bordas e estrutura HTML.
- **Um único grid global:** não atende ícones, cards e containers com escalas distintas.
