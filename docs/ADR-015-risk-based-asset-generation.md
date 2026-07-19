# ADR-015 — Geração de assets orientada por função e risco

## Status

Aceita. Proveniência, aprovação e política Assistida foram materializadas no Incremento 05.3; gates de exportação e interface de aprovação permanecem para 05.4.

## Contexto

O agente precisa decidir autonomamente o que fazer quando imagens não são fornecidas. Uma permissão global para gerar assets mistura elementos decorativos de baixo risco com fotos e desenhos que podem representar fatos sobre produtos reais.

## Decisão

1. O modo **Assistido** é o default.
2. Função, proveniência, fidelidade e estado de aprovação são propriedades explícitas do asset.
3. Assets fornecidos e oficiais têm preferência sobre geração.
4. Derivações são permitidas quando preservam características confirmadas do produto.
5. Decoração, fundos, swatches e iconografia genérica podem ser gerados autonomamente.
6. Imagens factuais de produto geradas do zero são `draft-only` até aprovação explícita.
7. Desenho técnico somente é fornecido ou gerado deterministicamente a partir de dados confirmados.
8. Templates declaram requisitos de asset e fallbacks sem imagem.
9. Exportação de rascunho e exportação para publicação usam gates diferentes.
10. O agente pergunta apenas quando um asset factual indispensável não possui fallback seguro.

## Consequências

- o agente preserva autonomia para criar composição e decoração;
- ausência de imagem não interrompe automaticamente a geração;
- o usuário distingue catálogo visualmente completo de catálogo pronto para publicação;
- templates precisam declarar roles e requisitos de asset;
- o pacote e o relatório precisam carregar proveniência e aprovação;
- o editor precisa apresentar pendências e bloquear publicação quando necessário;
- a política pode ser tornada mais estrita ou criativa por catálogo sem alterar o default.

## Alternativas rejeitadas

### Proibir toda geração

Seguro, mas impede automação útil de decoração, fundos, swatches e iconografia.

### Permitir toda geração

Não diferencia criatividade editorial de fidelidade comercial e técnica.

### Perguntar sempre que faltar imagem

Produz interrupções desnecessárias quando existe fallback de template ou o asset é opcional.

## Referências

- `ASSET-AUTHORING-POLICY.md`
- `PRODUCT-DEFINITION.md`
- `LLM-CATALOG-AUTHORING-FLOW.md`
- `ADR-005-asset-storage-and-references.md`
- `ADR-014-agent-authored-portable-catalogs.md`
