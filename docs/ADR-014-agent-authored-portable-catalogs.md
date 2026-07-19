# ADR-014 — Catálogos portáteis gerados por agente

## Status

Aceita. Formato portátil, manifesto e primeiro kit implementados no Incremento 05.3; modelo semântico e compilador permanecem pendentes.

## Contexto

O editor evoluiu de composição manual para conteúdo vinculado, templates e componentes recursivos. O objetivo final é permitir que um chat, projeto ou agente receba um kit de autoria uma única vez e, em cada criação, precise apenas dos dados de produto, assets disponíveis e considerações opcionais.

Pedir ao agente que calcule diretamente toda a árvore final é possível, mas concentra nele detalhes de IDs, slots, frames, mínimos, tokens e migração. Além disso, o JSON atual referencia assets locais em IndexedDB e ainda não possui importador na interface.

## Decisão

1. O produto é data-first: dados e intenção editorial são a entrada principal; a árvore recursiva é uma saída materializada.
2. O `CatalogAuthoringKit` é versionado, autocontido e reutilizável em várias criações.
3. O fluxo separa `CatalogSource`, `CatalogGenerationPlan`, `CatalogDocument` e `CatalogProjectPackage`.
4. O agente decide preferências ausentes, pergunta apenas por bloqueios factuais ou técnicos e nunca inventa dados comerciais ou especificações.
5. O agente entrega um pacote com documento, assets, manifestos e relatório.
6. O caminho preferencial usa compilador e validador determinísticos fornecidos pelo kit.
7. Geração direta do `CatalogDocument` é permitida como escape hatch, mas passa pelo mesmo validador.
8. Assets portáteis são arquivos do pacote; base64 não entra no documento.
9. O importador valida, migra, importa assets e remapeia referências antes de substituir o documento atual.
10. Estado transitório do editor deve migrar para uma sessão local ou seção opcional, não ser requisito do contrato autoral.
11. O registro de componentes deve expor um manifesto declarativo legível por interface, compilador, validador e agente.

## Consequências

- o kit precisa conter mais que um guide: schemas, manifestos, exemplos e ferramentas fazem parte do contrato;
- o formato portátil passa a ser requisito anterior à automação completa;
- produtos, variantes e tabelas precisarão de um modelo semântico mais extensível;
- templates oficiais precisam de IDs, requisitos, fallbacks e versões estáveis;
- a interface manual passa a priorizar intenção e problemas antes de propriedades exatas;
- importação de conteúdo externo exige limites de arquivo, verificação de caminho, MIME e hashes;
- o agente consegue trabalhar com poucos dados sem transformar ausência de preferência em nova pergunta;
- o relatório torna suposições e fallbacks auditáveis.

## Alternativas rejeitadas como caminho principal

### Somente prompt em prosa

Documentação sem contratos executáveis tende a divergir do registro real e não garante integridade estrutural.

### LLM posicionando todos os frames diretamente

Permanece útil como escape hatch, mas é frágil para paginação, mudanças de schema e reparos de layout.

### Assets embutidos em base64

Aumenta o documento, prejudica diffs e mistura conteúdo declarativo com armazenamento binário.

### Perguntar toda preferência ausente

Contraria o objetivo de criação assistida; defaults e heurísticas editoriais devem absorver decisões não factuais.

## Referências

- `PRODUCT-DEFINITION.md`
- `LLM-CATALOG-AUTHORING-FLOW.md`
- `ADR-001-json-source-of-truth.md`
- `ADR-005-asset-storage-and-references.md`
- `ADR-013-product-binding-and-presentation-templates.md`
- `ADR-015-risk-based-asset-generation.md`
