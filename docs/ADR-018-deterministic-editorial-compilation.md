# ADR-018 — Compilação editorial determinística antes do refinamento manual

## Status

Aceita no Incremento 05.5.

## Contexto

A reconstrução humana da referência exigiu 319 ações e ainda gerou colisões que não eram reportadas. Para o fluxo agente → JSON → PDF, otimizar controles manuais não resolveria o bloqueio de materializar dados e intenção em geometria válida. A eficiência da construção manual continuou como problema independente e foi retomada no 05.6.

## Decisão

Adotar o fluxo `CatalogSource → CatalogGenerationPlan → CatalogCompiler → CatalogDocument → CatalogDocumentValidator` como caminho principal.

- fonte guarda fatos e relações semânticas;
- plano guarda decisões editoriais e políticas;
- compilador materializa IDs, componentes, bindings e frames;
- validador impede que JSON estruturalmente válido produza uma página visualmente inválida;
- editor aplica o documento em uma transação e permanece responsável por revisão e exceções.

A mesma fonte e o mesmo plano devem produzir a mesma árvore, exceto por bytes de assets externos que não pertencem ao documento. Datas implícitas usam um valor canônico, e IDs são derivados de posição semântica em vez de relógio ou aleatoriedade.

## Reparos permitidos

Reparo automático só é aceito quando:

- não altera fatos;
- não muda hierarquia ou ordem editorial;
- não escolhe conteúdo em nome do usuário;
- possui resultado único;
- é registrado no relatório.

No 05.5 isso se limita a clamp de arredondamento de até 2 px.

## Consequências

- o caminho automatizado do catálogo de referência usa três ações de interface, sem representar o custo da construção manual;
- compilação pode ser testada sem navegador;
- colisão e overflow passam a bloquear pacote;
- um plano explícito é auditável e transportável;
- capacidade maior que a estratégia de página é bloqueada, não espremida silenciosamente;
- paginação torna-se uma extensão do compilador no Incremento 06, sem reescrever o editor.
