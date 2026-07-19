# Auditoria subtrativa de recursos — Incremento 05.13

## Objetivo

Identificar capacidades que devem continuar ativas, ser apenas mantidas, passar por consolidação ou permanecer congeladas antes de acrescentar novos comandos. A auditoria não remove contratos nem altera documentos neste incremento.

## Resultado executivo

O inventário contém 35 capacidades declaradas:

| Estado | Quantidade | Leitura |
| --- | ---: | --- |
| Ativas | 20 | Evoluem dentro de usabilidade, fidelidade e confiabilidade |
| Manutenção | 5 | Compatibilidade e correção sem expansão |
| Em auditoria | 5 | Resultado útil, mas acesso ou sobreposição precisa mudar |
| Congeladas | 4 | Somente guardrails contra dívida/regressão |
| Pausada | 1 | Multipágina depende da estabilização do núcleo |

Além das capacidades, seis grupos de interação foram promovidos à auditoria: autoridade de layout, duplicação, posicionamento, mínimos, apresentação semântica e separadores.

## Critério de decisão

Ausência no catálogo de referência não implica remoção. Cada mecanismo é avaliado por:

- intenção exclusiva;
- frequência ou plausibilidade fora da referência;
- previsibilidade;
- reversibilidade;
- custo cognitivo e arquitetônico;
- sobreposição com outro caminho;
- valor para o fluxo data-first e para refinamento;
- custo de compatibilidade e migração.

## Matriz por intenção

| Intenção | Mecanismos atuais | Diagnóstico | Direção preliminar |
| --- | --- | --- | --- |
| Inserir | drag, `+`, biblioteca, receita, duplicação, Meus componentes | Caminhos têm significados diferentes, mas competem visualmente | `+` e receitas primários; drag como posicionamento explícito; salvos/repetição contextuais |
| Repetir | duplicação simples, série direcional, duplicação de seleção, cards em lote | Escopos distintos em superfícies fragmentadas | Um comando canônico de repetir com opções progressivas |
| Posicionar | frame, drag, slot, auto-layout, receita, ação contextual | Precedência não é visível; reflow altera valores | Mostrar solicitado, resolvido e motivo; separar gerenciado de independente |
| Reintegrar | Reajustar ao slot, Reintegrar ao auto-layout, Auto e Aplicar auto-layout | Mesma intenção exposta por mecanismo interno | Ação única **Reintegrar ao layout**, com ramo interno por contexto |
| Manter validade | reflow Auto/Manual e mínimo recursivo | Manual preserva override desligando garantias; Auto destrói override | Recursão interna, override local durável e diagnóstico de restrição |
| Ajustar tamanho | técnico, recomendado, personalizado e mínimo recursivo | Recomendado pode ser inalcançável | Técnico derivado; recomendado orientativo; aviso antes do commit |
| Apresentar card | template, modo, preset, densidade, responsivo e override | Modelo semântico é válido; exposição se mistura | Preservar contratos, reorganizar por tarefa e esconder dimensões irrelevantes |
| Separar itens | átomo, limiar 3× e separador em lote | Limiar é específico e pouco descobrível | Preservar átomo; oferecer separadores dentro da ação de espaçamento |
| Representar variação | variante, linha comercial, galeria e legenda | Entidade e projeções podem parecer duplicadas | Variante continua fonte; linha/galeria são projeções vinculadas |
| Representar legenda | caption, legenda semântica, grupo, item e painel | Domínios diferentes usam vocabulário próximo | Distinguir legenda de arte e legenda de domínio; simplificar materialização visual |

## Evidência de autoridade de layout

O teste comportamental demonstrou:

1. um filho de slot é destacado com `slot.managed = false`;
2. redimensionar o ancestral em Auto executa reflow recursivo e restaura `managed = true`;
3. marcar o contêiner interno como Manual preserva o override;
4. **Reajustar ao slot** também restaura `managed = true`;
5. filhos de auto-layout repetem o mesmo padrão por `layoutItem.managed` e **Reintegrar ao auto-layout**.

Conclusão: Auto/Manual controla simultaneamente duas dimensões:

- propagação da validade estrutural;
- persistência de exceções locais.

Essas dimensões devem ser separadas. O usuário não deveria desativar reflow recursivo para preservar uma única exceção.

## Candidatos de alta confiança

### Consolidar

- **Reajustar ao slot** e **Reintegrar ao auto-layout** sob a intenção **Reintegrar ao layout**;
- duplicações em uma superfície progressiva;
- separadores em lote como opção da ação de espaçamento;
- aplicação de esquema de tabela como comando de grupo;
- receitas e compilador sobre a mesma camada de comandos.

### Rebaixar para avançado

- `slot.span` manual;
- posição livre quando o pai oferece layout gerenciado;
- recomendado personalizado quando abaixo do mínimo calculado;
- tolerância de snap e controles técnicos raros;
- arraste como alternativa de posição explícita, não entrada primária.

### Tornar interno após substituição

- recursão como toggle de usuário;
- número fixo de passes de reflow como comportamento observável;
- decisão de qual método de reintegração usar para slot ou auto-layout.

## Capacidades sob auditoria

| Capacidade | Motivo | Pergunta de saída |
| --- | --- | --- |
| `linkedVariantRepresentations` | Variante, linha e galeria podem parecer entidades concorrentes | A UI deixa claro que linha/galeria projetam a mesma variante? |
| `hierarchicalVisualLegends` | 39 ações e navegação repetitiva | Grupo/painel entregam valor além de uma lista agrupável? |
| `optionalLegendMaterialization` | Materialização altera foco e disclosure | Pode permanecer na mesma tarefa e ser aplicada em lote? |
| `batchPresentation` | Mistura modo, preset, densidade e estilo | Qual dimensão está sendo alterada e quais overrides serão preservados? |
| `batchSeparators` | Sobreposição com espaçamento e átomo de linha | Pode ser uma opção de espaçamento sem capacidade paralela? |

## Não remover com base no ensaio único

- inventário e binding de produtos;
- componentes salvos;
- subcatálogos;
- tokens;
- modos/densidades e apresentações semânticas;
- galerias e variantes existentes;
- pacote portátil;
- histórico e importação segura.

Esses recursos atendem ao fluxo data-first, a outros formatos de catálogo ou à recuperação, mesmo quando pouco usados na referência.

## Vieses controlados

- **acumulação:** adicionar não é a única forma de progresso;
- **custo afundado:** código e testes existentes não provam valor futuro;
- **teste:** testes migram para intenção, não preservam complexidade acidental;
- **referência única:** ausência de uso não basta para remover;
- **usuário avançado imaginário:** escape hatch não justifica toda combinação técnica;
- **opcionalidade:** toggles podem transferir ao usuário responsabilidade do sistema;
- **novidade contextual:** o sucesso do `+` não autoriza multiplicar atalhos ambíguos;
- **métrica:** uma ação ampla só é ganho se reduzir correção e preservar compreensão.

## Próxima execução

O próximo incremento de runtime deve começar pela autoridade de layout:

1. definir gerenciado/independente/reintegrar;
2. tornar overrides locais duráveis;
3. retornar geometria solicitada, resolvida e motivo;
4. preservar leitura do schema 1.16.0;
5. migrar a UI antes de depreciar `reflow.mode`;
6. repetir os casos aninhados e a reconstrução de referência.
