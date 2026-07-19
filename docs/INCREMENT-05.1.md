# Incremento 05.1 — Inventário e binding de conteúdo

## Objetivo

Separar entidade de produto, apresentação do card e alterações locais sem criar um segundo modelo de página. O JSON continua como fonte de verdade e a árvore existente permanece estável durante atualizações de conteúdo.

## Entregas

- aba **Produtos** no nível superior do painel esquerdo;
- cadastro e edição de título, código, embalagem, preço, duas especificações e arte principal;
- coleção `products` normalizada e coleção `subcatalogs` baseada em `productIds`;
- seleção de produtos e criação de subcatálogos sem duplicar entidades;
- `product-card.binding` com `productId`, `templateId` e overrides por campo;
- atualização granular dos cards vinculados, preservando IDs e linhas de tabela;
- ativação automática de override ao editar conteúdo sincronizado dentro do card;
- retorno imediato ao valor do inventário ao desativar um override;
- templates de card classificados como `product-presentation`;
- aplicação de apresentação preservando ID, frame, slot, número, conteúdo e vínculo;
- migração compatível para o schema `1.11.0`.

## Contrato de produto

```json
{
  "id": "product-1176",
  "label": "PARAFUSO OVAL PHS",
  "metadata": {
    "values": {
      "title": "PARAFUSO OVAL PHS",
      "specOne": "Cabeça oval",
      "specTwo": "Aço cromado",
      "code": "1176",
      "package": "CX 1000 UNID.",
      "price": "R$ 35,90",
      "assetId": null
    }
  },
  "reference": null
}
```

O card guarda somente a decisão de vínculo e as exceções locais:

```json
{
  "binding": {
    "productId": "product-1176",
    "templateId": "template-card-tecnico",
    "overrides": {
      "title": false,
      "specOne": false,
      "specTwo": false,
      "code": false,
      "package": false,
      "price": true,
      "assetId": false
    }
  }
}
```

## Atualização sem reconstrução

`updateProduct` modifica a entidade e percorre somente os cards ligados ao mesmo `productId`. Para cada campo sem override, o store atualiza a prop do átomo ou os valores da primeira linha da tabela já vinculada. Não substitui o card, seus filhos ou o `rowId`; por isso seleção, hierarquia e referências externas permanecem válidas.

Trocar o template é uma operação estrutural explícita. Nesse caso a subárvore visual é materializada a partir do snapshot, mas a raiz conserva o mesmo ID e frame. Antes da troca, o conteúdo atual é capturado; depois, conteúdo, número e binding são reaplicados.

## Subcatálogos

Um subcatálogo é um recorte, não uma cópia:

```json
{
  "id": "subcatalog-fixacao",
  "label": "Fixação principal",
  "metadata": { "productIds": ["product-1176", "product-1037"] },
  "reference": null
}
```

IDs inexistentes são descartados na normalização. Excluir um subcatálogo preserva o catálogo geral. Excluir um produto em uso exige detach explícito; o card mantém a última apresentação como conteúdo local.

## Migração

- cria a coleção `subcatalogs` quando ausente;
- normaliza itens legados de `products` com todos os campos;
- acrescenta `binding` vazio aos cards sem vínculo;
- acrescenta overrides `false` ausentes;
- classifica templates existentes como `snapshot` ou `product-presentation` conforme o tipo raiz;
- remove referências inválidas de produto, template e subcatálogo;
- sincroniza cards válidos depois de hidratar suas linhas de tabela.

## Validação

- testes de store para CRUD, vínculo, update granular, override, template e detach;
- validação de schema e documento de exemplo em `1.11.0`;
- teste real de navegador em `1366×768` para cadastro, vínculo, edição de preço, override, apresentação e subcatálogo;
- regressão completa dos incrementos anteriores.

## Fora do escopo

- legenda cromática vinculada a tabelas continua em Descoberta;
- documento multipágina, exportação XLSX, backend e compartilhamento permanecem nos incrementos seguintes.
