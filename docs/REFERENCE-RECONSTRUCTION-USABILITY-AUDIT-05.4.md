# Auditoria de reconstrução da referência — Editor 05.4

Data: 2026-07-15  
Alvo: catálogo de referência “Fixação e acessórios” fornecido pelo usuário  
Viewport: `1366×768`, zoom do navegador em 100% e zoom lógico do editor em **Ajustar**  
Escopo: teste de uso e diagnóstico; nenhuma funcionalidade do produto foi implementada durante o ensaio.

## Resumo executivo

Foi possível reconstruir a hierarquia geral da página — cabeçalho, card principal, seis cards secundários, tabelas, galeria, legenda aproximada, dica e rodapé — utilizando apenas controles visíveis do editor. O documento resultante contém 7 produtos, 7 cards, 16 linhas de tabela e 11 componentes raiz.

A reconstrução, porém, não cabe de forma editorialmente válida na página. O mínimo técnico atual do `product-card` impede uma grade real de três colunas no A4 e o aumento de linhas das tabelas expande os cards sobre a linha seguinte e sobre o rodapé. O PDF reproduz essa geometria inválida, enquanto o relatório de publicação retorna zero avisos.

Indicadores principais:

| Indicador | Resultado |
| --- | ---: |
| Ações reais de interface | 319 |
| Cliques | 184 |
| Preenchimentos de campos | 122 |
| Arrastes | 9 |
| Seleções | 3 |
| Downloads | 1 |
| Produtos cadastrados | 7 |
| Cards de produto | 7 |
| Linhas comerciais | 16 |
| Componentes raiz | 11 |
| Falhas de interação | 0 |
| Erros de página/console | 0 |
| Avisos de publicação encontrados | 0 |
| Índice de cobertura estrutural da referência | 56% |

O índice de 56% não é uma medida de similaridade visual. Ele usa 17 capacidades observáveis da referência, com peso `1` para representação suficiente, `0,5` para representação parcial e `0` para ausência. Imagens e ícones novos foram excluídos da avaliação, conforme o escopo pedido.

## Método

O ensaio foi executado em Chromium real, como uma sequência equivalente ao caminho de um usuário:

1. cadastrar os sete produtos no inventário;
2. arrastar cabeçalho e card principal da biblioteca;
3. editar o conteúdo interno do cabeçalho;
4. vincular o primeiro produto ao card;
5. duplicar o card em série e vincular os demais produtos;
6. informar posição e tamanho pela interface de geometria exata;
7. converter os cards 04 e 07 para galeria;
8. adicionar e preencher as linhas variáveis das tabelas;
9. criar uma legenda cromática e vinculá-la a uma célula;
10. adicionar rodapé, legenda e dica editorial aproximadas;
11. recolher os painéis, capturar o canvas, exportar JSON e gerar PDF.

Todas as alterações do documento ocorreram por clique, preenchimento, seleção ou drag and drop nos controles do editor. O estado interno foi lido somente depois das ações para coletar frames, tipos, colisões e diagnósticos; não foi usado para criar ou alterar componentes. Diálogos esperados foram confirmados automaticamente.

O tempo automatizado de 32 segundos não representa tempo humano e não deve orientar estimativas. Quantidade de ações, alternância de contexto, repetição e resultado visual são os indicadores úteis de esforço.

## Resultado obtido

### Estrutura reproduzida

- página A4 e exportação em PDF;
- cabeçalho com placeholder de logo, kicker, título e separadores;
- card principal com arte, quatro especificações e tabela;
- seis cards numerados em duas linhas visuais de três colunas;
- cards 04 e 07 com galeria de três imagens e legenda individual;
- tabelas com uma a cinco linhas;
- uma célula ligada à legenda semântica `CX 250`;
- rodapé composto por seis itens com ícones e textos;
- legenda de embalagens e dica editorial aproximadas por átomos de texto.

### Validação técnica dos artefatos

- o JSON exportado é válido contra `schemas/catalog-document.schema.json`, sem erros, e declara `schemaVersion: 1.14.0`;
- o PDF possui uma página A4 de `594,96 × 841,92 pt`, não é criptografado e foi renderizado novamente para inspeção visual;
- o PDF não contém chrome do editor nem grid;
- o PDF preserva, contudo, as colisões e os cortes da composição, sobretudo na metade inferior.

## Matriz de cobertura da referência

| Capacidade observada na referência | Cobertura | Evidência no ensaio | Limitação principal |
| --- | --- | --- | --- |
| Página A4 e PDF | Suficiente | Documento e PDF de uma página | A exportação não protege contra composição inválida |
| Cabeçalho com logo, título e linhas | Parcial | Estrutura e separadores reproduzidos | Layout interno é pouco flexível e não comporta toda a zona direita |
| Aplicações e desenho técnico no cabeçalho | Ausente | Não materializados | Não há modo/preset do cabeçalho para esse arranjo |
| Card principal em destaque | Suficiente | Hero com arte, specs e tabela | Ajustes internos ainda exigem navegação extensa |
| Grade de seis cards em `3×2` | Parcial | Hierarquia visual criada | Só cabe por sobreposição: mínimo de largura excede a coluna disponível |
| Numeração e títulos por produto | Suficiente | Cards 01–07 vinculados | Cópias surgiram em ordem inversa na árvore |
| Arte simples por card | Parcial | Placeholder e slot funcionam | Proporção e posição variam pouco entre os modos atuais |
| Galeria com legenda por imagem | Parcial | Cards 04 e 07 convertidos | Conversão exige entrar, excluir arte, voltar à biblioteca e inserir galeria |
| Especificações com ícone | Suficiente | Hero com quatro; demais com duas | Textos longos truncam em cards compactos |
| Tabelas com número variável de linhas | Parcial | De uma a cinco linhas | Cada linha aumenta o card e rompe o empacotamento da página |
| Esquemas de colunas distintos | Parcial | Colunas são editáveis | Produzir vários esquemas é repetitivo e pouco orientado por preset |
| Célula e legenda cromática vinculadas | Parcial | Uma célula recebeu `CX 250` | A legenda semântica não possui apresentação visual global reutilizável |
| Modos e superfícies distintas de card | Parcial | Hero, compacto e galeria usados | Não cobrem a variedade editorial da referência |
| Faixa de aplicações sob cada card | Ausente | Não reproduzida | Falta composição/preset semântico específico |
| Legenda global de embalagens | Parcial | Aproximada como uma linha de texto | Não há chips coloridos ligados às entradas semânticas |
| Card de dica/callout | Parcial | Aproximado como texto | Falta molécula com ícone, título, corpo e superfície |
| Rodapé com contatos e serviços | Parcial | Estrutura composta presente | Textos ficam pequenos/truncados e a região sofre sobreposição do card 07 |

Pontuação: `9,5 / 17 = 55,9%`, arredondada para 56%.

## Onde a composição deixa de caber

### Largura

Para reproduzir as três colunas foi solicitado `234 px` por card. O editor aplicou o mínimo técnico de `270 px`, 36 px ou 15,4% acima do solicitado. Três cards passam a exigir 810 px antes mesmo dos espaços, contra 794 px totais da página e aproximadamente 746 px de área editorial útil.

Os cards foram posicionados em `x = 0`, `262` e `524`. Como cada um mede 270 px, pares vizinhos se sobrepõem em 8 px lógicos, cerca de 4,4 px na visualização ajustada. O efeito é visível tanto no canvas quanto no PDF.

### Altura

Foi solicitado `220 px` aos cards compactos. O mínimo inicial aplicado foi `278 px`, 26,4% maior. Ao adicionar linhas, os tamanhos finais passaram a:

| Card | Linhas | Altura final |
| --- | ---: | ---: |
| 02 | 2 | 306 px |
| 03 | 2 | 306 px |
| 04 | 3 | 334 px |
| 05 | 1 | 278 px |
| 06 | 2 | 306 px |
| 07 | 5 | 390 px |

A segunda linha começa em `y = 724`; portanto, o card 04 da primeira linha termina em `y = 770` e invade a segunda linha. O card 07 termina em `y = 1114`, enquanto o rodapé começa em `y = 1024`. Essa colisão de 90 px lógicos aparece no PDF.

### Falha de diagnóstico

Apesar das colisões entre cards, texto, dica e rodapé, `getPublicationReport("draft")` retornou uma lista vazia. A ausência de avisos é mais crítica que a mera limitação de tamanho: o usuário consegue exportar um documento que parece estruturalmente aceito, mas é visualmente inválido.

## Recursos mais utilizados versus dificuldade

Escala de dificuldade: `1` direta; `3` exige contexto e repetição; `5` é propensa a erro ou não chega ao resultado pretendido.

| Recurso | Uso no ensaio | Dificuldade | Valor produzido | Fricção observada |
| --- | --- | ---: | --- | --- |
| Inventário de produtos | 7 cadastros, 42 campos de conteúdo e 7 confirmações | 3 | Muito alto | Bom contrato, mas entrada manual repetitiva para catálogo real |
| Vincular produto ao card | 7 vínculos | 2 | Muito alto | Requer alternar entre Camadas/Produtos e reencontrar o item |
| Duplicação em série | 6 cópias em uma ação | 2 | Muito alto | Ordem das cópias ficou invertida na árvore |
| Camadas e seleção | Usado antes da maioria dos ajustes | 4 | Alto | Árvore longa, rótulos truncados e custo de reencontrar o componente |
| Geometria exata | 11 componentes raiz ajustados | 4 | Alto | Muitos campos e alternâncias; valores abaixo do mínimo são corrigidos sem prever o empacotamento total |
| Edição interna de componente | Cabeçalho, hero, galerias e tabelas | 4 | Alto | Entrar/sair de contexto e trocar abas domina o fluxo |
| Tabela genérica | 9 linhas extras e 27 células preenchidas | 4 | Alto | Funciona, mas crescimento vertical não reordena irmãos nem a página |
| Galeria | 2 conversões | 4 | Médio/alto | Exige decompor manualmente o card para substituir a arte |
| Legenda cromática semântica | 1 entrada e 1 vínculo | 4 | Médio | Conceito poderoso, pouca descoberta e nenhuma saída global pronta |
| Drag and drop da biblioteca | 9 arrastes | 2 | Alto | Inserção é simples; posicionamento fino migra imediatamente para o inspector |
| Recolher painéis e Ajustar | Usado para revisar a página | 1 | Alto | Resolve o espaço do viewport, não a validade editorial da página |
| Exportação JSON/PDF | 2 artefatos | 1 | Muito alto | Exporta mesmo quando há colisões severas sem aviso |

## O que não pôde ser representado de forma satisfatória

1. Uma grade de três colunas sem sobreposição usando o `product-card` atual.
2. A área direita do cabeçalho com lista de aplicações e desenho técnico como apresentação integrada.
3. Faixas semânticas de aplicação diferentes sob cada card.
4. Uma legenda global de embalagens com chips coloridos vinculados às mesmas chaves usadas nas células.
5. Um callout de dica composto e reutilizável com ícone, título e corpo.
6. Tabelas de até cinco linhas dentro de cards compactos sem aumento destrutivo da altura.
7. Reflow ou repaginação automática dos irmãos após crescimento de conteúdo.
8. Validação de colisão/overflow antes da publicação.

## Problemas confirmados antes deste ensaio

Os oito problemas da auditoria de responsividade foram formalizados em `docs/BACKLOG.md`, na seção **Problemas confirmados pela auditoria de responsividade 05.4 — 2026-07-15**:

- colisões na toolbar em 1366×768;
- overflow interno do rodapé no mínimo técnico;
- colapso incompleto do card após remover tipos internos;
- tamanho recomendável personalizado inalcançável;
- salto de mínimo vertical no breakpoint compacto;
- rótulos editoriais sobrepostos;
- abas do painel esquerdo sem largura suficiente;
- perda de legibilidade de dados obrigatórios no mínimo técnico.

## Candidatos de priorização descobertos neste ensaio

Estes itens ainda não foram promovidos ao backlog ativo. A intenção é permitir priorização conjunta em uma etapa posterior.

### Bloqueadores do fluxo agente → JSON → PDF

1. **Gate geométrico de publicação** — detectar componentes fora da página, interseções entre irmãos não autorizadas, clipping de descendentes e regiões encobertas. Overlap intencional deve ser uma exceção explícita.
2. **Compilador editorial com empacotamento** — calcular grade, densidade, quebra de página e variantes antes de materializar frames; não depender de correção manual depois da importação.
3. **Preset oficial de card compacto** — suportar três colunas reais em A4 com mínimos e densidade coerentes, mantendo dados comerciais legíveis.
4. **Tabela editorial densa** — variar tipografia, padding e altura de linha dentro de limites seguros, com altura estimável antes da composição.
5. **Reflow/repaginação por crescimento de dados** — adicionar linhas deve mover irmãos, balancear páginas ou propor alternativa, nunca apenas sobrepor.

### Redução de esforço manual

6. **Importação tabular/bulk de produtos** — colar CSV/planilha ou importar `CatalogSource`, com preview e validação, em vez de preencher produto por produto.
7. **Foco contextual persistente** — reduzir trocas entre Componentes, Produtos, Camadas e abas do inspector; ao editar tabela ou galeria, manter ações relevantes visíveis.
8. **Ordenação editorial após duplicação** — preservar a ordem visual e numérica na árvore, especialmente em duplicação em série.
9. **Templates de página e seções** — oferecer “hero + grade 3×2 + legenda + rodapé” e outras estruturas oficiais como ponto inicial adaptável.
10. **Edição em lote** — vincular produtos, aplicar modo/densidade e distribuir cards selecionados em uma operação.

### Cobertura semântica da referência

11. **Apresentação de aplicações** — lista de aplicações com ícone/rótulo e faixa compacta reutilizável em cabeçalho ou card.
12. **Legenda visual vinculada** — renderer de chips para `colorLegends`, compartilhando as mesmas chaves das células.
13. **Callout/dica como molécula** — ícone, título, corpo, superfície e presets de densidade.
14. **Cabeçalho multimodal** — slots/modos para identidade, título, aplicações e desenho técnico sem montagem manual livre.
15. **Modos editoriais por produto** — hero, galeria de variantes, especificação lateral, tabela densa e aplicações, escolhidos pelo compilador conforme os dados disponíveis.

## Direção recomendada

O próximo ganho relevante não vem de acrescentar mais controles exatos ao card atual. A profundidade manual já é suficiente para exceções; o gargalo é transformar dados e intenção em uma composição válida antes de expor o ajuste fino.

A ordem recomendada é:

1. tornar colisão, clipping e overflow erros observáveis;
2. entregar o compilador editorial com um pequeno conjunto de templates e presets oficiais;
3. criar um card compacto e uma tabela densa capazes de reproduzir a matriz da referência;
4. automatizar reflow/repaginação quando o conteúdo muda;
5. só então ampliar moléculas semânticas específicas, começando por aplicações, legenda visual e callout.

Essa sequência também atende ao objetivo final do produto: uma LLM deve escolher capacidades e gerar um pacote importável que já abra como layout pronto. Sem diagnóstico geométrico e empacotamento determinístico, o JSON pode ser válido no schema e ainda produzir um PDF editorialmente inválido, exatamente como demonstrado neste ensaio.

## Artefatos de evidência

- `reference-reconstruction-editor.png` — editor completo em 1366×768;
- `reference-reconstruction-canvas.png` — página com painéis recolhidos;
- `reference-reconstruction.pdf` — PDF A4 gerado e renderizado para conferência;
- `reference-reconstruction.document.json` — documento 1.14.0 exportado pela interface.

