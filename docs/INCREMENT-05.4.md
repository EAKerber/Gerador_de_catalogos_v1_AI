# Incremento 05.4 — Conteúdo semântico, apresentações e UI progressiva

## Resultado

O editor passa a distinguir conteúdo factual, intenção de apresentação e ajustes locais. O schema sobe para `CatalogDocument 1.14.0` e o pacote portátil inclui uma projeção `CatalogSource 1.0.0` que pode alimentar o futuro compilador sem obrigar agentes a editar diretamente a árvore visual.

## Contratos entregues

- `CatalogSource` extensível com valores comerciais legados, atributos, destaques, aplicações, variantes e papéis de assets;
- tabela por colunas declaradas (`key`, rótulo, função, alinhamento, peso e formato), com valores arbitrários por linha;
- vocabulário de apresentação com template, família, versão, modo, densidade, estado responsivo, preset, override e snapshot;
- quatro presets iniciais de card: padrão, destaque, técnico e variações;
- requisitos de asset por preset, com papel, cardinalidade, estados aceitos e fallback;
- mínimos técnico, recomendado e customizado separados no componente;
- coleção `colorLegends`, com chave estável, token, texto e fallback acessível;
- gate de rascunho tolerante a pendências e gate de publicação bloqueante.

## Interface

O inspetor mantém seletores estáveis para compatibilidade, mas apresenta três níveis visíveis:

1. **Intenção:** produto, apresentação, modo, densidade, assets e conteúdo semântico;
2. **Composição:** contêiner, slots, reflow, distribuição e ações estruturais;
3. **Exato:** tokens, frame, constraints e mínimos.

**Mostrar todas as propriedades** revela identificação e propriedades secundárias sem remover acesso profundo. No inventário, detalhes semânticos ficam recolhidos por padrão. Em tabelas, configuração de colunas e legenda cromática também usam divulgação progressiva.

## Compatibilidade e migração

- campos `specOne`, `specTwo`, `code`, `package`, `price` e `assetId` continuam como projeção compatível;
- tabelas antigas recebem as colunas Código, Embalagem e Preço;
- produtos antigos recebem listas semânticas vazias e `assetRoles.main` derivado de `assetId`;
- cards antigos recebem `product-standard`, modo e densidade padrão;
- componentes recebem mínimos técnico e recomendado derivados do registro;
- templates antigos são classificados e recebem família, versão, apresentação e requisitos;
- a coleção `colorLegends` é criada vazia, sem inferir significado a partir de cores existentes.

## Exportação

O menu separa:

- **Pacote de rascunho:** gera ZIP e registra pendências como avisos;
- **Pacote para publicação:** bloqueia papéis obrigatórios ausentes e assets sem `publish-ready` + `publishAllowed`.

O pacote inclui `source/catalog-source.json` além de documento, capacidades, relatório, kit e assets.

## Limites deliberados

- regras condicionais por faixa, múltiplas legendas concorrentes e fórmulas de tabela permanecem posteriores;
- o vínculo automático entre atributos semânticos e peças visuais será responsabilidade do compilador 05.5;
- o gate valida contratos de asset e aprovação, mas a validação editorial/visual completa entra no 05.5;
- paginação e balanceamento continuam no Incremento 06.

## Verificação

- testes de `CatalogSource`, migração, apresentações, mínimos e tabelas genéricas;
- testes de vínculo cromático por célula e fallback textual;
- testes de gates de rascunho/publicação;
- suíte legada de store, layout, binding, histórico, pacote e contratos estáticos;
- validação dos schemas e regeneração do `CatalogAuthoringKit 1.0.0`.
