# Instruções preservadas do ensaio

Data do caso: 30–31 de julho de 2026.

Este registro contém somente as mensagens do usuário necessárias para
reexecutar o caso. Respostas intermediárias do agente não foram reconstruídas:
os resultados materiais correspondentes estão preservados nos diretórios
`initial/` e `revised/`.

## Solicitação inicial

> procure as referencias das corrediças na internet, e as represente evitando
> sair muito das imagens reais.

Entradas anexadas:

- `input/authoring-kit.zip`;
- `input/prices-unit.png` — orçamento para uma unidade;
- `input/prices-15-units.png` — orçamento para quinze unidades.

## Primeira revisão

> eis o documento como saiu, também não representou o valor para unidades
> únicas, além da caixa com 15 unidades, que anexei junto. 15+ é falso, só
> retire o +. Gostei das imagens mas creio que precisam de um fundo expandido,
> o espaçamento das especificações é estranho, creio que podem ser colocadas
> abaixo da imagem.
>
> quero o pacote zip, para o rodapé faça o primeiro item ocupar dois espaços,
> os demais itens ocupam 1 e tem escala tipografica em 80%
>
> veja se é valido usar legendas

Saídas apresentadas para revisão: `initial/catalog-project-package.zip`,
`initial/catalog.pdf`, `initial/catalog-preview.png` e
`initial/authorial-target.png`.

## Segunda revisão

> ok, a coluna unidade é inutilizada pela legenda das colunas após, remova.
> quando digo que a primeiro item do roda pé ocupa duas posições não quero
> dizer colocar a informação de dois itens, digo a opção usando o authoring
> kit, ainda quero que gere o arquivo zip como o kit instrui para gerar

Saídas após a correção: `revised/catalog-project-package.zip`,
`revised/catalog.pdf`, `revised/catalog-preview.png` e
`revised/authorial-target.png`.

## Dados factuais e referências

Os dois orçamentos originais estão preservados em `input/`. Os pacotes
preservam a fonte normalizada, preços, códigos e as URLs oficiais consultadas
para as três imagens de produto em
`source/catalog-source.json` e `catalog-project.json`. O manifesto de cada
pacote registra bytes, SHA-256, proveniência, fidelidade e estado de aprovação.
