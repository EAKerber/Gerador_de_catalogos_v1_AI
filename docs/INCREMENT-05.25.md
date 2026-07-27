# Incremento 05.25 — consolidação do posicionamento inicial

## Direção

Reduzir fragmentação interna depois do encerramento da V1 single-page, sem
alterar interface, schema, geometria observável ou regras editoriais.

## Problema confirmado

O posicionamento provável de cabeçalho e rodapé já possuía um registro
declarativo, mas era aplicado por substituição tardia de
`DocumentStore.prototype`. O comportamento dependia da ordem de instalação de
um contrato carregado depois do store canônico.

## Contrato

- o registro de posicionamento calcula a sugestão provável;
- o store canônico consulta o registro durante `insertComponent`;
- tipos sem sugestão continuam usando a busca genérica;
- contextos internos nunca recebem uma sugestão de página;
- o módulo de compatibilidade preserva a API pública e o estilo de legibilidade
  do rodapé, mas não substitui métodos do store;
- nenhuma posição vira constraint persistente.

## Gates

- cabeçalho no topo e rodapé na base segura;
- colisão desloca a sugestão para dentro da página;
- uma única entrada de histórico por inserção;
- instalação repetida não altera métodos do protótipo;
- regressão Node, build e Chromium multirreferência.

## Fora do incremento

- novos hints de posicionamento;
- mudanças de interface;
- remoção de outros contratos incrementais;
- schema, tipos, capacidades ou Authoring Kit.
