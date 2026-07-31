# Matriz de cobertura da imagem de referência

## Finalidade

Esta matriz rastreia a tradução da composição visual de referência para contratos editáveis. Ela mede cobertura estrutural e não afirma comparação pixel a pixel. As imagens fornecidas estão versionadas em [`docs/reference/catalogo-base.jpeg`](reference/catalogo-base.jpeg) e [`docs/reference/promocional-base.jpeg`](reference/promocional-base.jpeg) exclusivamente como evidência visual e material pedagógico; elas não são persistidas no documento JSON nem distribuídas como assets do catálogo editado.

## Legenda

- **Coberto:** existe componente renderizado e editável no editor atual.
- **Preparado:** o contrato JSON já reserva a referência necessária, mas a interface final pertence a outro incremento.
- **Adiado:** responsabilidade explicitamente mantida no roadmap.
- **Descoberta:** comportamento identificado, mas o contrato ainda depende de definições funcionais.

## Matriz

| Região ou comportamento observado | Componente/contrato | Cobertura visual | Edição | Estado | Evidência atual |
| --- | --- | --- | --- | --- | --- |
| Imagem-base do catálogo | `docs/reference/catalogo-base.jpeg` | referência integral 1024×1536 | somente documentação | Coberto | referência fornecida em 14/07/2026; não é golden baseline |
| Imagem promocional | `docs/reference/promocional-base.jpeg` | referência integral 1024×1536 | somente documentação | Benchmark | pós-V1, não bloqueante e não golden image |
| Decomposição tutorial | `authoring-kit-visual/case-studies/*` | mapa direto/composição/aproximação/fora da V1 | índice visual | Coberto | complemento 05.55 distribuído apenas no kit autônomo |
| Formato e proporção da folha | página A4 lógica 794×1123 | integral | grid, margem e escala | Coberto | página ajustada automaticamente à área disponível |
| Faixa superior e identidade | `catalog-header` composto | integral | logo, sobretítulo, título, slots, separadores e tokens | Coberto | cinco peças editáveis, incluindo linhas horizontal e vertical atômicas |
| Espaço de logo/arte | `art` com `role: "logo"` | imagem real ou placeholder | biblioteca, função, ajuste, ponto focal e token vetorial | Coberto | upload/reuso por `assetId`; bytes locais em IndexedDB |
| Bloco principal de produto | `product-card` | integral | subárvore, slots e breakpoint | Coberto | modos amplo e compacto preservados |
| Imagem/render do produto | `art` com `role: "product"` | imagem real ou placeholder | fit, referência, texto alternativo e legenda | Coberto | SVG, PNG, JPG e WebP reutilizáveis sem base64 no documento |
| Numeração e título | `title-symbol` | integral | número, título e tokens | Coberto | slot de título do card |
| Ícones técnicos | `icon` | integral | símbolo, legenda e token vetorial | Coberto | `vectorColor` separado de `accentColor` |
| Lista de atributos | `specification` | integral | ícone, texto, ordem e token vetorial | Coberto | slot com capacidade quatro |
| Código, embalagem e preço | `data-table` + coleção `tableRows` | múltiplas linhas e colunas | colunas, valores, função, alinhamento, inclusão, ordem e remoção | Coberto | `rowIds` ordenados; colunas semânticas declaradas e altura derivada do conteúdo |
| Rodapé, contato e benefícios | `catalog-footer` + `footer-item` | integral | incluir, editar, ordenar e remover moléculas e seus átomos | Coberto | cada item contém ícone, título e complemento independentes |
| Repetição de cards e blocos | duplicação de subárvore | integral | simples, direção, distância e quantidade | Coberto | novos IDs, espaçamento ou deslocamento configurável |
| Recorte e ponto focal reais | coleção `assets` + `art.fit` | integral | `contain`, `cover`, original e foco X/Y | Coberto | `object-fit`, `object-position` e máscara SVG seguem o componente |
| Legenda ligada a uma imagem individual | `art.caption` + `captionPosition` | faixa ou sobreposição | texto e posição | Coberto | vínculo preservado ao mover, salvar e duplicar a arte |
| Várias imagens com legenda individual, como nos itens 04 e 07 | `art-gallery` + átomos `art` | múltiplas variações no mesmo card | incluir, legendar, ordenar e remover cada imagem | Coberto | galeria em auto-layout; cada filho preserva `caption`, `assetId`, fit, foco e tokens próprios |
| Componentes editados reutilizáveis | coleção `templates` + snapshot recursivo | subárvore integral | salvar, inserir e remover em **Meus componentes** | Coberto | inserções renovam IDs, linhas de tabela e numeração, preservando referências de assets |
| Legenda de cores vinculada às células da tabela | `colorLegends` + `tableRows.metadata.legendKeys` | legenda e preenchimentos coerentes | criar/remover legenda e vincular cada célula | Coberto | chave estável aponta para token; texto e `aria-label` preservam o significado sem depender da cor |
| Tabelas com múltiplas linhas | coleção genérica + `data-table` | integral | incluir, editar, ordenar e remover | Coberto | entregue no Incremento 04.1 |
| Comparação visual pixel a pixel | suíte visual futura | não automatizada | n/a | Adiado | requer imagem-fonte versionada e baseline autorizada |
| Hierarquia dos painéis | abas laterais | integral | Componentes/Produtos/Camadas e Conteúdo/Layout/Visual + Avançado | Coberto | divulgação progressiva por tarefa preserva profundidade técnica |
| Zoom fluido do workspace | `editor.zoom` | integral | seletor e `Ctrl/Cmd + roda` | Coberto | escala lógica intermediária sem zoom do navegador |
| Fidelidade das linhas no PDF | `separator` horizontal/vertical | integral | orientação, terminação e token vetorial | Coberto | mesmos átomos no canvas e na impressão, com espessuras físicas |
| Estruturas auxiliares no PDF | `layout-container` | somente editor | layout e restauração na aba Estrutura | Coberto | envelope invisível na impressão; componentes internos permanecem |

## Regra de continuidade

Uma região só passa de **Preparado** para **Coberto** quando o fluxo completo estiver disponível: seleção da referência, persistência por ID, renderização, edição e teste. Uma região em **Descoberta** precisa primeiro ganhar um contrato funcional verificável. No Incremento 05.0, galerias e componentes salvos reutilizam o mesmo contrato recursivo; os envelopes auxiliares ficam fora do PDF e o binário de referência permanece fora do JSON por decisão arquitetônica.
