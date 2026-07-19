# Incremento 05.6 — Eficiência da construção manual

## Correção de escopo

O Incremento 05.5 reduziu o fluxo automatizado de `CatalogSource` para página pronta. Ele não resolveu, por si só, o excesso de ações observado durante uma construção feita pelo usuário dentro do editor.

O 05.6 separa formalmente as duas métricas:

- **geração automatizada:** importar uma fonte e materializar o catálogo;
- **construção manual assistida:** o usuário escolhe dados, componentes e operações, enquanto o editor agrupa repetições previsíveis.

Nenhum resultado automatizado será usado novamente como evidência de redução do esforço manual.

## Operações manuais compostas

### Entrada rápida de produtos

Na aba **Produtos**, o usuário pode colar uma tabela vinda de Excel, Sheets, TSV ou CSV. Cabeçalhos em português e inglês são reconhecidos para título, código, embalagem, preço, duas especificações, atributos, destaques, aplicações e asset.

A confirmação cria todos os produtos como uma única transação. Linhas sem título são ignoradas e relatadas; a edição individual continua disponível depois.

### Cards da seleção

Produtos selecionados podem ser transformados em cards por uma única ação. O editor:

- cria ou reutiliza uma Área de composição;
- aplica grade de 2, 3 ou 4 colunas;
- cria um card para cada produto;
- vincula os `productId`;
- aplica densidade compacta;
- preserva linhas e colunas comerciais existentes no produto;
- abre o contexto da nova composição para refinamento imediato.

A operação inteira ocupa uma entrada no histórico e um único `Ctrl/Cmd+Z` remove a composição sem remover os produtos.

### Colagem de linhas de tabela

Ao selecionar uma tabela, **Colar várias linhas** aceita os mesmos formatos tabulares. O usuário escolhe substituir as linhas atuais ou acrescentar ao final. Cabeçalhos podem ser omitidos quando a ordem das colunas visíveis já corresponde aos dados.

Até 12 linhas são aplicadas em uma transação. Reflow, mínimo do card e geometria do contêiner são recalculados antes do resultado final.

## Medição observável

O ensaio anterior registrou 42 preenchimentos e 7 confirmações apenas para cadastrar sete produtos, além de 7 vínculos individuais: pelo menos 56 ações antes mesmo de contar a criação e organização dos cards.

No teste de navegador do 05.6, o mesmo subfluxo — cadastrar sete produtos, criar sete cards, vinculá-los e organizá-los — usa cinco ações:

1. abrir **Produtos**;
2. abrir **Entrada rápida**;
3. colar a tabela;
4. confirmar os produtos;
5. criar os cards da seleção.

Redução conservadora desse subfluxo: de pelo menos 56 para 5 ações, ou 91,1%. Isso não é apresentado como redução das 319 ações totais; cabeçalho, rodapé, galerias, estilos e refinamentos ainda precisam de nova medição.

Para uma tabela já selecionada, cinco linhas que antes exigiam quatro inserções e quinze preenchimentos podem ser substituídas em três ações: abrir, colar e aplicar.

## Consistência adicional

- modo compacto forçado agora também usa grade para as especificações, mesmo quando o card é largo;
- mudar a apresentação recalcula imediatamente slots e o contêiner pai;
- cadastro de produtos, criação de cards e colagem tabular são transações atômicas com rollback em falha;
- as grades testadas nascem com zero colisões e zero overflow.

## Limites

- não há seleção múltipla genérica de componentes no canvas;
- não há edição de estilos ou geometria em lote;
- galerias ainda exigem conversão por card;
- o fluxo completo de reconstrução da referência ainda precisa ser repetido para obter uma nova contagem total comparável às 319 ações;
- templates de seção e comandos contextuais persistentes continuam candidatos de alta alavancagem.

## Verificação

- parser determinístico de TSV, CSV e dados copiados de planilha;
- cadastro de produtos em uma única entrada de histórico;
- cards vinculados e organizados em uma única entrada de histórico;
- colagem de tabela em uma única entrada de histórico;
- desfazer e refazer sem estados parciais;
- sete produtos e sete cards em cinco ações reais de interface;
- crescimento para cinco linhas com reflow válido;
- zero colisões e zero overflow;
- suíte legada de domínio e navegador preservada.
