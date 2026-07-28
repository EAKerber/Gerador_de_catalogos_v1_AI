# Incremento 05.35 — rótulos contextuais do editor

## Recorte

Eliminar a sobreposição de rótulos exclusivos do editor em estruturas aninhadas,
sem alterar conteúdo, geometria persistida ou projeção de impressão.

## Comportamento

- a seleção primária revela apenas o próprio rótulo;
- descendentes continuam destacados pelo contorno contextual;
- o rótulo de um filho direto aparece sob `hover` ou foco interno;
- netos não são revelados junto com o filho;
- o rótulo contextual usa uma forma compacta dentro dos limites do componente;
- impressão e PDF continuam sem qualquer rótulo editorial.

## Gates

- contrato CSS impede novamente o seletor recursivo;
- Chromium em `1366×768` cobre rodapé composto, revelação local, ausência de
  interseção entre rótulos e projeção de impressão;
- suíte Node integral e build idempotente;
- schema `1.16.0`, tipos e capacidades preservados.
