# Catálogo V1 — Editor A4 incremental

> **Estado atual:** a V1 foi congelada como protótipo técnico após o incremento
> funcional 05.60. O trabalho ativo é uma autópsia documental; não há correção
> funcional nem implementação V2 autorizada. Comece por
> [`docs/START-HERE.md`](docs/START-HERE.md), não pela sequência incremental
> abaixo.

Base experimental para um compilador editorial de catálogos orientado a dados, com editor visual hierárquico para revisão e refinamento. O projeto atual funciona diretamente no navegador, sem backend, e mantém o documento em JSON/pacote portátil para autoria por agente, snapshots locais e futura colaboração browser-only.

A direção canônica do produto, o fluxo esperado para agentes, a política de assets e a operação local-first estão documentados em `docs/PRODUCT-DEFINITION.md`, `docs/LLM-CATALOG-AUTHORING-FLOW.md`, `docs/ASSET-AUTHORING-POLICY.md` e `docs/ADR-024-browser-local-first-collaboration.md`. O editor atual ainda não implementa todo esse fluxo-alvo.

## Entrega atual

A pasta reúne as seguintes etapas evolutivas:

- **Incremento 00 — fundação arquitetônica:** documento JSON versionado, registro de componentes, tokens e separação das camadas.
- **Incremento 01 — editor base A4:** página vazia, drag and drop, seleção, inspetor, movimento, resize, grid, snap e exportação JSON.
- **Incremento 02 — containers e slots:** componentes aninhados, contexto de edição, breadcrumb, coordenadas locais e card de produto internamente editável.
- **Incremento 03 — layout e snap inteligente:** guias magnéticas, espaçamento igual, auto-layout, mínimos calculados e regras responsivas.
- **Incremento 03.1 — estabilização do editor:** workspace adaptável a 1366×768, painéis recolhíveis, ajuste automático da A4, duplicação simples, tokens vetoriais e coleções preparadas.
- **Incremento 04 — biblioteca de artes:** upload e drag and drop de SVG, PNG, JPG e WebP, armazenamento em IndexedDB, reuso por `assetId`, fit, ponto focal e recoloração opcional de SVG.
- **Incremento 04.1 — conteúdo repetível e composição:** tabela com linhas ligadas a coleção genérica, legendas de arte e duplicação direcional/distribuída.
- **Incremento 04.2 — hierarquia estrutural e navegação:** cabeçalho e rodapé compostos, painéis por abas, ênfase de subárvore e zoom lógico por `Ctrl/Cmd + roda`.
- **Incremento 04.2.1 — impressão/PDF da página atual:** diálogo nativo com projeção A4 limpa, sem grid, seleção ou controles do editor.
- **Incremento 04.3 — layout editorial e linhas:** Área de composição em linha, distribuição configurável, mínimos de slot e átomo separador.
- **Incremento 04.4 — ocupação múltipla de slots:** capacidade ponderada por `slot.span`, controle no inspetor e distribuição proporcional.
- **Incremento 04.5 — consistência recursiva e saída visual:** reflow Auto/Manual, mínimo vertical estabilizado e fidelidade física das linhas no PDF.
- **Incremento 04.6 — estruturas opcionais e PDF limpo:** colapso/restauração de tipos, separadores contextuais, rodapé atomizado e contêineres auxiliares invisíveis na impressão.
- **Incremento 05.0 — reuso editorial, galerias e numeração:** categoria Meus componentes, snapshots recursivos, galeria multiarte com legenda individual e sequência assistida de cards.
- **Incremento 05.1 — inventário e binding:** catálogo geral, subcatálogos, cards vinculados por `productId`, overrides locais e templates de apresentação separados do conteúdo.
- **Incremento 05.2 — segurança de edição e importação JSON:** histórico transacional, desfazer/refazer, estado sujo/salvo e análise com migração e confirmação antes do commit atômico.
- **Incremento 05.3 — pacote portátil e manifestos:** ZIP com documento e assets, integridade SHA-256, remapeamento atômico, capacidades declarativas e `CatalogAuthoringKit 1.0.0`.
- **Incremento 05.4 — conteúdo semântico e apresentações:** `CatalogSource`, tabelas por colunas, presets/modos/densidades, mínimos técnico e recomendado, legenda cromática vinculada, inspetor progressivo e gates distintos de rascunho/publicação.
- **Incremento 05.5 — plano, compilador e validação:** importação direta de `CatalogSource`, `CatalogGenerationPlan`, materialização determinística, grade compacta, gate geométrico e `CatalogAuthoringKit 1.1.0` autocontido.
- **Incremento 05.6 — eficiência manual:** colagem tabular de produtos e linhas, criação/vínculo de cards da seleção e operações compostas reversíveis.
- **Incremento 05.7 — refinamento manual em lote:** multisseleção de irmãos, alinhamento, distribuição, apresentação/tokens, duplicação e exclusão como ações reversíveis únicas.
- **Incremento 05.8 — estruturas prontas e inserção contextual:** receitas oficiais editáveis, botão `+` com posicionamento automático e foco direto na área principal.
- **Incremento 05.9 — ações contextuais e composição em lote:** `+` sensível à seleção, conversão de arte em galeria, espaçamento/separadores para irmãos, inspetor reorganizado e chrome estável em 1366×768.
- **Incremento 05.10 — variantes e legendas vinculadas:** variantes materializam opcionalmente galeria e linha comercial; legendas ganham painel, grupos e itens por chave estável.
- **Incremento 05.11 — saneamento visual e atlas funcional:** toolbar responsiva, cards da biblioteca sem sobreposição e inventário/guia de capacidades validado para pessoas e agentes.
- **Incremento 05.12 — auditoria manual e intenção contextual:** reconstrução integral da referência em Chromium real, log de 267 ações, matriz de 65% e evidências JSON/PNG/PDF que promovem as fricções mensuradas ao backlog.
- **Incremento 05.13 — auditoria subtrativa e governança:** 35 capacidades classificadas, frentes externas congeladas, redundâncias mapeadas e autoridade Auto/Manual testada antes de qualquer remoção.
- **Incremento 05.14 — confiabilidade estrutural:** autoridade local durável, reintegração explícita, geometria solicitada/resolvida, seleção entre contextos e preflight de PDF sem UI transitória.
- **Incremento 05.15 — comandos compostos e receitas focais:** inserção no contêiner alvo com override por `Shift`, variação semântica, quatro esquemas de tabela aplicáveis em lote e composição hero + grade + faixa em uma ação reversível.
- **Incremento 05.16 — continuidade e benchmark comparável:** abas e disclosures acompanham itens equivalentes; a reconstrução integral cai de 267 para 223 ações, tabelas de 82 para 56 e overflows de dois para zero.
- **Incremento 05.17 — geometria orientada por intenção:** seleção contextual atômica, geometria relacional/numérica, grade de caixas heterogêneas, diagnóstico da seleção e editores de coleção; benchmark final em 157 ações sem colisão ou overflow.
- **Incremento 05.18 — profundidade editorial:** texto ganha alinhamento, escala e overflow controlados; ícones ganham escala interna; modos de card passam a priorizar visualmente arte, especificações, galeria ou dados sem criar tipos paralelos.
- **Incremento 05.20 — linguagem promocional:** receitas editáveis para preço e oferta, tokens promocionais, novos ícones semânticos e gates conjuntos para as referências técnica e promocional.
- **Incremento 05.52 — fixture do ensaio real:** entrada, instruções, pacotes, PDFs e comparações inicial/revisada do caso de corrediças preservados com hashes, reimportação e atribuição de achados.
- **Incremento 05.21 — navegação contextual:** breadcrumb resiliente, painéis redimensionáveis e Camadas recolhíveis com foco e estados distintos, sempre por regras determinísticas e sem IA.
- **Incremento 05.22 — encerramento geométrico da V1:** pedidos de canvas, inspetor e multisseleção são planejados com reflow e autoridade numa cópia e aplicados em um único commit ou rejeitados sem mutação; locks persistentes permanecem em discovery.
- **Incremento 05.23 — transação estrutural:** espaçamento em lote e separadores são planejados com frames, autoridade e estrutura numa cópia e aplicados numa única emissão/undo, ou rejeitados sem mutação.
- **Incremento 05.24 — estado canônico da V1:** governança, manifesto, backlog e roadmap passam a concordar que a V1 single-page está estável; um gate Node impede que incrementos integrados voltem a aparecer como fila ativa.

## Abrir

Abra `index.html` diretamente no Chrome ou Firefox.

Para testar como um projeto publicável:

```bash
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Como testar o Incremento 03

### Guias e snap

1. Arraste três componentes para a folha A4.
2. Mova um componente próximo às bordas e centros dos demais.
3. As guias azuis indicam alinhamento por borda ou centro.
4. As guias roxas indicam repetição de uma distância já existente.
5. Altere a tolerância na barra superior.
6. Segure `Alt` para ignorar grid, guias e magnetismo temporariamente.

### Auto-layout

1. Arraste **Área de composição** para a página.
2. Entre nela com duplo clique, `Enter` ou pelo inspetor.
3. Adicione textos, artes, cards ou outras áreas de composição.
4. Selecione a área e escolha `linha`, `coluna` ou `grade` no inspetor.
5. Configure gap, padding, colunas e breakpoint.
6. Arraste um filho manualmente para criar um override local.
7. Use **Reintegrar ao auto-layout** para restaurar o posicionamento automático.

### Card responsivo

1. Arraste um **Card de produto**.
2. Reduza sua largura abaixo de `320 px`.
3. O card passa para o layout compacto e aumenta o mínimo de altura.
4. Acima de `320 px`, ele retorna ao layout amplo.

### Estabilização 03.1

1. Abra o editor em uma janela de `1366×768`, com zoom do navegador em 100%.
2. Mantenha **Zoom → Ajustar**: a folha A4 inteira deve caber na área central.
3. Recolha e expanda os dois painéis pelas setas nas barras laterais.
4. Selecione um componente e use o botão **⧉** ou `Ctrl/Cmd+D`; a cópia deve manter o conteúdo e receber novos IDs.
5. Selecione um ícone, arte SVG futura, especificação ou rodapé e altere **Cor do vetor** sem alterar a cor de destaque.

### Biblioteca de artes 04

1. Entre em um card e clique no placeholder **Escolher arte**, ou use o inspetor da arte.
2. A janela mostra primeiro as artes já cadastradas no projeto.
3. Arraste SVG, PNG, JPG ou WebP para a área de upload, ou use **Escolher arquivos**.
4. O primeiro arquivo importado substitui o placeholder sem alterar frame, slot ou layout.
5. Reabra a biblioteca para reutilizar a mesma arte em outro componente.
6. Ajuste fit, foco horizontal/vertical e, para SVG, escolha **Token do componente**.
7. O JSON guarda apenas metadados, referência e `assetId`; os bytes ficam no IndexedDB.

### Conteúdo repetível e composição 04.1

1. Adicione um **Card de produto**, entre nele e selecione **Tabela de dados**.
2. No inspetor, adicione, edite, ordene ou remova linhas; a altura do card acompanha o conteúdo.
3. Selecione a arte do card e preencha **Legenda vinculada**, escolhendo faixa inferior ou sobreposição.
4. Selecione qualquer componente e abra **Duplicação e distribuição**.
5. Escolha direção, cálculo por espaçamento ou deslocamento, distância e quantidade de cópias.
6. A duplicação simples pelo botão do cabeçalho ou `Ctrl/Cmd+D` continua disponível.

### Hierarquia estrutural e navegação 04.2

1. Adicione um **Cabeçalho** ou **Rodapé** e use **Editar conteúdo interno**.
2. Edite logo, textos ou moléculas separadamente; o componente raiz continua movendo tudo como unidade.
3. No painel esquerdo, alterne entre **Componentes** e **Camadas**.
4. No inspetor, alterne entre **Estrutura**, **Conteúdo** e **Visual**.
5. Selecione um card para enfatizar suas peças no canvas e na árvore.
6. Sobre o workspace, use `Ctrl/Cmd + roda` para zoom intermediário sem alterar o zoom do navegador.

### Impressão / PDF 04.2.1

1. Clique em **Imprimir / PDF** na barra superior.
2. No diálogo nativo, selecione **Salvar como PDF**.
3. A página atual sai em A4 vertical sem grid, área segura, seleção ou controles do editor.

### Ocupação múltipla de slots 04.4

1. Entre em um card e selecione uma peça do slot **Especificações**.
2. Em **Estrutura**, altere **Espaços ocupados** de `1` para `2`.
3. A peça passa a consumir duas unidades e o restante do slot é redistribuído.
4. O inspetor impede que a soma ultrapasse a capacidade declarada pelo slot.

### Consistência recursiva e PDF 04.5

1. Adicione uma **Área de composição** com dois cards e aumente a tabela de um deles.
2. Reduza a altura da área: o resize para no mínimo real dos cards e mantém a tabela contida.
3. Em **Estrutura**, deixe **Reflow dos descendentes** em **Auto** e redimensione o pai; slots e irmãos afetados são reajustados recursivamente.
4. Troque para **Manual**, faça um override em um filho e redimensione o pai; o override é preservado.
5. Adicione um **Cabeçalho** e use **Imprimir / PDF**; as linhas vertical e horizontal são os mesmos átomos do canvas, com espessuras físicas estáveis.

### Estruturas opcionais e PDF limpo 04.6

1. Entre em um Cabeçalho, Card ou Item do rodapé e remova a última peça de um tipo; as peças restantes ocupam o espaço liberado.
2. Selecione o contêiner e, na aba **Estrutura**, use **Adicionar “nome do item”** para criar uma nova peça no slot ausente.
3. Em uma Área de composição em linha ou coluna, defina espaçamento maior que `3 ×` a espessura mínima da linha; use **Adicionar linha separadora** sem alterar o tamanho dos itens.
4. Entre em um Item do rodapé, selecione o átomo **Ícone** e altere **Cor do vetor**.
5. Gere o PDF: cards, cabeçalho e rodapé permanecem, mas a Área de composição e os contornos editoriais não aparecem.

### Meus componentes, galeria e numeração 05.0

1. Edite qualquer componente, selecione-o e, em **Estrutura**, use **Salvar em Meus componentes**.
2. O snapshot aparece em uma categoria própria no topo da biblioteca; arraste-o para criar uma instância com novos IDs.
3. Linhas de tabela são copiadas de forma independente e referências de assets existentes são preservadas.
4. Adicione **Galeria de imagens** livremente ou substitua a arte de um card por ela; entre na galeria para editar cada imagem e legenda.
5. Adicione ou duplique cards e observe a numeração incremental.
6. Ao repetir manualmente um número, escolha se os cards posteriores devem ser compactados; ao saltar acima da sequência, escolha se os próximos devem continuar do novo valor.

### Inventário e binding 05.1

1. Adicione e selecione um **Card de produto**.
2. Abra a aba **Produtos**, cadastre título, código, embalagem, preço e especificações e use **Vincular**.
3. Edite o produto no inventário; os campos sincronizados do card mudam sem substituir seus IDs.
4. No card, abra **Conteúdo → Vínculo de conteúdo** e ative um override local. Esse campo deixa de receber atualizações até o override ser desmarcado.
5. Salve outro card em **Meus componentes** e escolha-o em **Template de apresentação**; estrutura e tokens mudam, mas produto, número e conteúdo permanecem.
6. Selecione produtos no inventário e use **Subcatálogo da seleção** para criar um recorte sem duplicar entidades.

### Histórico e importação JSON 05.2

1. Altere um componente e use **Desfazer**/`Ctrl/Cmd+Z`; use **Refazer**, `Ctrl/Cmd+Shift+Z` ou `Ctrl+Y` para reaplicar.
2. Edite seleção, zoom ou painéis: essas preferências locais não entram no histórico do catálogo.
3. Clique em **Importar**, escolha ou solte um JSON e revise versão, contagens, avisos e erros antes de confirmar.
4. Teste um documento antigo: a migração ocorre apenas em memória e a versão resultante aparece no relatório.
5. Teste um JSON inválido ou de versão futura: o commit permanece bloqueado e o documento aberto não muda.
6. Após importar ou criar um novo documento, use **Desfazer** para recuperar o documento anterior durante a sessão.

### Pacote portátil e kit de autoria 05.3

1. Adicione uma arte ao projeto e abra **Exportar → Pacote de rascunho**.
2. O ZIP contém `catalog-project.json`, documento, assets, capacidades, relatório e a versão do kit usada.
3. Crie um novo documento, clique em **Importar** e escolha o ZIP; revise hashes, MIME, contagens, avisos e erros antes de confirmar.
4. Após o commit, os assets aparecem sem depender do navegador de origem e suas referências passam a apontar para novas chaves locais.
5. Use **Desfazer** para recuperar o projeto anterior; os bytes importados permanecem disponíveis para Refazer durante a sessão.
6. Abra **Exportar → Kit de autoria** para baixar guide, schemas, exemplos e o manifesto gerado dos componentes, tokens e ícones disponíveis.

### Conteúdo semântico e apresentações 05.4

1. Em **Produtos**, abra **Detalhes semânticos** e cadastre atributos, destaques e aplicações sem alterar fatos comerciais.
2. Selecione um card e use **Conteúdo** para escolher preset, modo e densidade; produto e apresentação permanecem contratos separados.
3. Entre no card, selecione a tabela e configure colunas por rótulo, função e alinhamento.
4. Crie uma **Legenda de cores** e vincule-a a uma célula; a célula guarda a chave, não a cor literal.
5. Em **Visual → Avançado**, compare mínimo técnico e mínimo calculado e, se necessário, personalize apenas o recomendado.
6. Exporte **Pacote de rascunho** para tolerar pendências ou **Pacote para publicação** para aplicar o gate bloqueante.

### Plano editorial e compilação 05.5

1. Clique em **Importar** e escolha `authoring-kit/examples/reference-catalog-source.json`.
2. Revise produtos, linhas, ações, colisões e overflow no preview.
3. Confirme **Gerar catálogo**: cabeçalho, hero, grade `3×2`, galerias, tabelas e rodapé são materializados em uma transação.
4. Use `Ctrl/Cmd+Z` para recuperar o documento anterior.
5. Para autoria externa, execute `authoring-kit/compiler/compile-catalog.js` com fonte e plano opcional.
6. A mesma fonte e plano devem gerar os mesmos IDs, frames e bindings; capacidade, colisão e clipping inválidos bloqueiam a saída.

### Eficiência da construção manual 05.6

1. Abra **Produtos → Entrada rápida** e cole uma tabela de Excel, Sheets, TSV ou CSV.
2. Confirme uma vez; todos os produtos válidos entram no inventário e permanecem selecionados.
3. Escolha 2, 3 ou 4 colunas e use **Criar cards da seleção**; a Área de composição, os cards e os vínculos são criados em uma transação.
4. Entre em um card, selecione sua tabela e use **Colar várias linhas** para substituir ou acrescentar dados.
5. Use `Ctrl/Cmd+Z`: cada uma dessas operações é desfeita integralmente, sem estados parciais.
6. A geração automatizada do 05.5 e a construção manual do 05.6 possuem métricas separadas.

### Refinamento manual em lote 05.7

1. Entre em uma Área de composição e pressione `Ctrl/Cmd+A` para selecionar seus filhos diretos.
2. Use `Shift`, `Ctrl` ou `Cmd` + clique no canvas ou em **Camadas** para adicionar/remover irmãos.
3. No inspetor do conjunto, alinhe ou distribua a seleção.
4. Para cards, escolha preset, modo ou densidade uma vez; somente os itens elegíveis são alterados.
5. Aplique cor de destaque/texto compartilhada, ou duplique/exclua todo o conjunto.
6. Use `Ctrl/Cmd+Z`: cada comando de lote é desfeito integralmente.

### Estruturas prontas e inserção contextual 05.8

1. Em **Componentes**, use `+` em **Página de catálogo**; cabeçalho, conteúdo e rodapé surgem em uma transação.
2. O editor entra automaticamente em **Conteúdo principal**, deixando a próxima ação no contexto mais provável.
3. Use `+` para inserir um componente, receita ou item de **Meus componentes** no primeiro slot compatível ou espaço livre.
4. Arraste o mesmo item quando precisar controlar o ponto exato.
5. Use as receitas **Faixa de aplicações**, **Legenda de embalagens** e **Dica editorial** como composições comuns totalmente editáveis.
6. `Ctrl/Cmd+Z` remove a receita inteira em uma única ação.

### Ações contextuais e composição em lote 05.9

1. Selecione uma **Tabela de dados** e use o `+` em **Ações para a seleção** para adicionar uma linha.
2. Selecione uma **Arte / logo** compatível e use o mesmo `+`; a arte original é preservada dentro de uma nova galeria, acompanhada da primeira variação.
3. Dentro da galeria, selecione uma arte e use `+` novamente para acrescentar outra imagem com legenda própria.
4. Selecione dois ou mais irmãos e, no inspetor, escolha eixo, gap e um separador opcional; aplique tudo em uma ação.
5. Edite depois qualquer linha gerada como um átomo separador comum.
6. Use as abas **Conteúdo**, **Layout** e **Visual**; frame, constraints e mínimos ficam sob **Avançado**.
7. `Ctrl/Cmd+Z` desfaz integralmente conversão, espaçamento ou separadores.

## Comportamentos disponíveis

- página A4 com grid hierárquico;
- componentes e filhos em coordenadas locais;
- slots com tipos, ordem, capacidade ponderada e ocupação por `span`;
- snap por grid, bordas, centros, margens e distâncias iguais;
- tolerância magnética configurável;
- guias visuais ativáveis;
- override global com `Alt` e independente por eixo;
- auto-layout livre, em linha, coluna ou grade;
- regras responsivas por largura;
- mínimo calculado a partir do conteúdo;
- mínimo estabilizado após o reflow completo dos descendentes;
- filhos gerenciados ou livres dentro do auto-layout;
- reflow recursivo Auto por padrão, com override Manual por contêiner;
- tipos internos opcionais com colapso, persistência e restauração explícita;
- separadores contextuais em overlay, sem consumir espaço do auto-layout;
- página ajustada automaticamente ao espaço real do workspace;
- painéis laterais recolhíveis com estado persistido;
- duplicação simples de componentes e subárvores;
- multisseleção contextual de irmãos com alinhamento, distribuição e propriedades em lote;
- receitas oficiais de página, aplicações, legenda e callout, materializadas como componentes comuns;
- inserção contextual por `+`, com primeiro slot compatível, primeiro espaço livre e drag and drop preservado;
- ações do `+` derivadas da seleção para linhas de tabela e galerias;
- espaçamento uniforme e separadores editáveis para seleções irmãs;
- biblioteca **Meus componentes** com snapshots recursivos e instâncias independentes;
- galerias multiarte formadas por imagens e legendas individuais;
- numeração assistida de cards com políticas confirmadas;
- inventário geral de produtos com criação e edição no painel esquerdo;
- entrada rápida de vários produtos por colagem tabular;
- criação, organização e vínculo de cards a partir da seleção do inventário;
- cards vinculados por `productId`, com atualização granular e overrides por campo;
- templates de card aplicáveis como apresentação sem assumir o conteúdo;
- seleção persistida em subcatálogos baseados em `productIds`;
- tokens independentes para cor de ícones/vetores;
- coleções genéricas de assets, produtos, subcatálogos, templates e linhas de tabela no documento;
- biblioteca de artes com lista do projeto, upload e drag and drop;
- arquivos SVG, PNG, JPG e WebP de até 25 MB em IndexedDB;
- reuso por `assetId`, fit, ponto focal e recoloração opcional de SVG;
- tabelas com múltiplas linhas ordenadas por `rowIds` de coleção;
- legendas vinculadas ao componente de arte;
- duplicação direcional com espaçamento ou deslocamento configurável;
- cabeçalho e rodapé como árvores de peças editáveis;
- itens de rodapé compostos por átomos independentes de ícone, título e complemento;
- navegação por abas nos painéis laterais;
- ênfase contextual da subárvore selecionada;
- zoom lógico por `Ctrl/Cmd + roda`, refletido no seletor;
- impressão da página atual por diálogo nativo, preparada para PDF A4;
- linhas de cabeçalho atômicas com cor exata e espessura física na impressão;
- Áreas de composição e estados de seleção ausentes no PDF;
- tokens fechados de cor, tipografia, borda, raio e iconografia;
- árvore de camadas aninhada;
- salvamento local, estado sujo/salvo e exportação JSON sem sessão efêmera;
- histórico transacional com até 100 ações e coalescência de edições consecutivas;
- importação JSON em duas etapas, com análise, migração, preview e commit confirmado;
- importação e exportação de `CatalogProjectPackage` com assets externos ao JSON;
- preflight de paths, criptografia, ZIP64, quantidades e limites antes da descompactação;
- verificação de MIME, tamanho e SHA-256 antes de qualquer persistência;
- proveniência e aprovação conservadora para assets, com política Assistida no manifesto;
- manifesto runtime de componentes, slots, templates, tokens, ícones e capacidades;
- `CatalogAuthoringKit 1.5.2` autocontido, com compilador, runtime, receitas, variantes vinculadas, legendas hierárquicas e atlas funcional;
- inventário gerado de 35 capacidades, guia curado com 15 fluxos por intenção e governança subtrativa completa;
- `CatalogSource 1.1.0` com atributos, destaques, aplicações, variantes, linhas comerciais identificadas, legendas agrupadas e papéis de assets;
- `CatalogGenerationPlan 1.0.0` com estratégia, ordem, papéis, modos, densidades e políticas;
- compilação automatizada direta de `CatalogSource` em três ações de interface;
- IDs, frames, linhas e bindings determinísticos;
- gate estrutural, referencial, editorial e geométrico;
- tabelas semânticas com colunas configuráveis e legenda por célula;
- substituição ou acréscimo de várias linhas por colagem na tabela selecionada;
- operações manuais compostas registradas como uma única ação reversível;
- apresentação explícita por preset, modo e densidade;
- mínimo técnico separado do recomendado/customizado;
- pacotes distintos de rascunho e publicação;
- migração automática para o schema `1.16.0`.

## Atalhos

- `Alt`: ignora todo o snap durante movimento ou resize;
- `Shift`: restringe o movimento a um eixo;
- `Enter`: entra no componente selecionado quando ele é um container;
- `Esc`: sobe um nível no contexto;
- `Ctrl+D` ou `Cmd+D`: duplica o componente selecionado;
- `Ctrl+Z` ou `Cmd+Z`: desfaz a última alteração de domínio;
- `Ctrl+Shift+Z`, `Cmd+Shift+Z` ou `Ctrl+Y`: refaz a alteração;
- `Delete` ou `Backspace`: remove a seleção fora de campos de formulário.

## Componentes

### Estruturas

- Área de composição
- Galeria de imagens
- Cabeçalho
- Card de produto
- Rodapé

### Elementos

- Arte / logo
- Ícone SVG
- Texto
- Linha separadora

### Peças internas

- Título com símbolo
- Especificação
- Tabela de dados

A logo continua sendo uma arte com `role: "logo"`.

## Organização

```text
index.html
styles/
  tokens.css
  base.css
  editor.css
  components.css
app/
  tokens.js
  catalog-source.js
  manual-entry.js
  catalog-generation-plan.js
  catalog-compiler.js
  catalog-validator.js
  presentation-registry.js
  icon-library.js
  layout-engine.js
  component-registry.js
  section-recipes.js
  collection-registry.js
  document-store.js
  document-importer.js
  project-package.js
  authoring-kit-files.js
  asset-storage.js
  asset-library.js
  product-catalog.js
  renderer.js
  inspector.js
  interactions.js
  workspace-layout.js
  main.js
authoring-kit/
  GUIDE.md
  manifest.json
  capabilities.json
  feature-inventory.json
  feature-guide.json
  feature-governance.json
  compiler/
    compile-catalog.js
  runtime/
  schemas/
  examples/
vendor/
  fflate.js
  fflate.LICENSE
docs/
  PRODUCT-DEFINITION.md
  LLM-CATALOG-AUTHORING-FLOW.md
  ASSET-AUTHORING-POLICY.md
  ARCHITECTURE.md
  ROADMAP.md
  BACKLOG.md
  DISCOVERY-05.11-OPERATIONS-AND-PLATFORMS.md
  DEVELOPMENT-HANDOFF-05.11.md
  DEVELOPMENT-HANDOFF-05.12.md
  DEVELOPMENT-HANDOFF-05.13.md
  FEATURE-CATALOG.md
  INCREMENT-01.md
  INCREMENT-02.md
  INCREMENT-03.md
  INCREMENT-03.1.md
  INCREMENT-04.md
  INCREMENT-04.1.md
  INCREMENT-04.2.md
  INCREMENT-04.2.1.md
  INCREMENT-04.3.md
  INCREMENT-04.4.md
  INCREMENT-04.5.md
  INCREMENT-04.6.md
  INCREMENT-05.0.md
  INCREMENT-05.1.md
  INCREMENT-05.2.md
  INCREMENT-05.2-PLAN.md
  INCREMENT-05.3.md
  INCREMENT-05.4.md
  INCREMENT-05.5.md
  INCREMENT-05.6.md
  INCREMENT-05.7.md
  INCREMENT-05.8.md
  INCREMENT-05.9.md
  INCREMENT-05.10.md
  INCREMENT-05.11.md
  INCREMENT-05.12.md
  INCREMENT-05.13.md
  REFERENCE-RECONSTRUCTION-USABILITY-AUDIT-05.12.md
  SUBTRACTIVE-FEATURE-AUDIT-05.13.md
  evidence/05.12/
    reference-manual.document.json
    reference-manual.metrics.json
    reference-manual.editor.png
    reference-manual.canvas.png
    reference-manual.pdf
  PDF-VISUAL-COVERAGE.md
  REFERENCE-IMAGE-COVERAGE.md
  ADR-001-json-source-of-truth.md
  ADR-002-local-coordinate-containers.md
  ADR-003-layout-and-smart-snap.md
  ADR-004-adaptive-workspace-and-data-contracts.md
  ADR-005-asset-storage-and-references.md
  ADR-006-repeatable-content-and-composition.md
  ADR-007-structural-hierarchy-and-navigation.md
  ADR-008-native-print-projection.md
  ADR-009-weighted-slot-capacity.md
  ADR-025-governanca-subtrativa-e-autoridade-de-layout.md
  ADR-010-recursive-reflow-and-physical-print-lines.md
  ADR-011-optional-structures-and-editor-only-containers.md
  ADR-020-contextual-multi-selection.md
  ADR-021-official-section-recipes.md
  ADR-012-reusable-subtrees-and-number-sequences.md
  ADR-013-product-binding-and-presentation-templates.md
  ADR-014-agent-authored-portable-catalogs.md
  ADR-015-risk-based-asset-generation.md
  ADR-016-portable-package-integrity.md
  ADR-017-semantic-source-presentations-and-gates.md
  ADR-018-deterministic-editorial-compilation.md
  ADR-019-compound-manual-operations.md
  ADR-022-contextual-actions-and-batch-composition.md
  ADR-023-semantic-variants-and-visual-legends.md
  ADR-024-browser-local-first-collaboration.md
schemas/
  catalog-document.schema.json
  catalog-project-package.schema.json
  catalog-capabilities.schema.json
  catalog-source.schema.json
  catalog-generation-plan.schema.json
sample-document.json
tests/
  store-smoke.test.js
  layout-engine.test.js
  workspace-layout.test.js
  asset-storage.test.js
  repeatable-content.test.js
  structural-hierarchy.test.js
  reusable-components.test.js
  product-binding.test.js
  history-import.test.js
  project-package.test.js
  manual-efficiency.test.js
  manual-batch.test.js
  section-recipes.test.js
  contextual-actions-spacing.test.js
  browser-assets.test.js
  browser-repeatable.test.js
  browser-hierarchy.test.js
  browser-product-catalog.test.js
  browser-history-import.test.js
  browser-project-package.test.js
  browser-section-recipes.test.js
  browser-contextual-actions-spacing.test.js
  ui-contract.test.js
  reference-coverage.test.js
  validate-schema.py
```

## Validação local

```bash
node tests/store-smoke.test.js
node tests/layout-engine.test.js
node tests/workspace-layout.test.js
node tests/asset-storage.test.js
node tests/repeatable-content.test.js
node tests/structural-hierarchy.test.js
node tests/reusable-components.test.js
node tests/product-binding.test.js
node tests/history-import.test.js
node tests/project-package.test.js
node tests/semantic-presentation.test.js
node tests/publication-gates.test.js
node tests/catalog-compiler.test.js
node tests/manual-efficiency.test.js
node tests/manual-batch.test.js
node tests/collection-bulk-editing.test.js
node tests/section-recipes.test.js
node tests/contextual-actions-spacing.test.js
node tests/ui-contract.test.js
node tests/reference-coverage.test.js
node tests/reference-manual-audit-contract.test.js
node tests/reference-manual-audit-05.17-contract.test.js
node tests/library-depth-05.18.test.js
node tests/subtractive-layout-authority.test.js
node tests/layout-authority-geometry.test.js
node tests/contextual-insertion-target.test.js
node tests/compound-table-variant.test.js
node tests/focal-recipe-layout.test.js
node tests/legend-token-contrast.test.js
node tests/feature-governance.test.js
python tests/validate-schema.py
```

Os smoke tests reais `tests/browser-assets.test.js`, `tests/browser-repeatable.test.js`, `tests/browser-hierarchy.test.js`, `tests/browser-print.test.js`, `tests/browser-slot-span.test.js`, `tests/browser-reflow.test.js`, `tests/browser-print-fidelity.test.js`, `tests/browser-composition-dynamics.test.js`, `tests/browser-print-structure.test.js`, `tests/browser-reusable-components.test.js`, `tests/browser-product-catalog.test.js`, `tests/browser-history-import.test.js`, `tests/browser-project-package.test.js`, `tests/browser-catalog-compiler.test.js`, `tests/browser-manual-efficiency.test.js`, `tests/browser-manual-batch.test.js`, `tests/browser-section-recipes.test.js`, `tests/browser-contextual-actions-spacing.test.js`, `tests/browser-chrome-responsive.test.js` e `tests/browser-reference-manual-audit.test.js` usam Playwright e requerem um Chromium disponível em `CATALOG_CHROMIUM_EXECUTABLE`. `CATALOG_BASE_URL` pode apontar para servidor local ou para o `file://` absoluto do `index.html`.

Antes de atribuir `SIGSEGV` ao editor, valide o executável com `file`, tamanho e `chromium --version`. Um ELF truncado pode conservar permissão de execução e ainda falhar antes de o Playwright abrir a página. Em sandboxes sem diretório pessoal gravável, defina `HOME` e `XDG_CACHE_HOME` para uma pasta temporária gravável, principalmente para o cache do Fontconfig.

Os testes cobrem também variantes vinculadas a galerias/linhas, legendas hierárquicas, migração conservadora e schema `1.16.0`, além dos contratos estruturais, editoriais, geométricos, de pacote e de impressão anteriores.

## Limites intencionais

Os Incrementos 05.6–05.17 reduziram a reconstrução integral de **319 para 157 ações**. Mapas de caixas e edição de coleções em lote retiraram 66 ações desde 05.16, e a composição termina sem colisão nem overflow. O 05.13 congela expansão multimídia, plataforma online, touch/mobile completo e workflow de publicação, além de pausar multipágina. O foco ativo é usabilidade, fidelidade e confiabilidade. Nenhuma opção foi removida: reajustes, duplicações, mínimos, apresentação, separadores e geometria exata entram em consolidação compatível. Um backend central de projetos não é objetivo do produto. JSON isolado não transporta bytes; para projetos com imagens, use o pacote ZIP. Evidências e decisões estão em `docs/REFERENCE-RECONSTRUCTION-USABILITY-AUDIT-05.17.md`, `docs/SUBTRACTIVE-FEATURE-AUDIT-05.13.md` e `docs/BACKLOG.md`.
