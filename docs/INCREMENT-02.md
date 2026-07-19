# Incremento 02 — Containers, slots e edição interna

## Objetivo

Validar a hipótese central do editor: um componente pode ser tratado como uma unidade na página e, ao mesmo tempo, como um pequeno canvas contendo peças menores em coordenadas locais.

## Escopo entregue

### Contexto de edição

- `editor.editingContextId` identifica o container aberto;
- breadcrumb mostra a página e o caminho interno;
- `Enter`, duplo clique e botões do inspetor/camadas entram no container;
- `Esc` e o breadcrumb sobem um nível;
- componentes fora do contexto ativo ficam visualmente atenuados;
- o container continua selecionável como unidade.

### Árvore recursiva

- busca, seleção, atualização e exclusão percorrem `children` recursivamente;
- cada filho armazena `frame` relativo ao pai;
- o renderer projeta a árvore em camadas absolutas aninhadas;
- a lista de camadas apresenta a hierarquia e os slots.

### Card internamente editável

O `product-card` passa a ser um container com quatro slots:

| Slot | Capacidade | Tipos principais |
|---|---:|---|
| `title` | 1 | `title-symbol`, `text` |
| `art` | 1 | `art` |
| `specifications` | 4 | `specification`, `text`, `icon` |
| `table` | 1 | `data-table`, `text` |

Ao criar um card, são gerados automaticamente:

- título com número;
- placeholder de arte;
- duas especificações;
- tabela de código, embalagem e preço.

### Inserção e substituição

- a biblioteca é filtrada pelos tipos aceitos no contexto;
- o slot sob o cursor é detectado pela geometria declarada no registro;
- slots ocupados com capacidade 1 pedem confirmação antes da substituição;
- soltar fora de um slot cria uma peça livre dentro do container.

### Reordenação e ajuste

- peças do mesmo slot podem ser movidas antes ou depois;
- slots em coluna recalculam a distribuição dos filhos gerenciados;
- mover ou redimensionar manualmente uma peça preserva o vínculo sem forçar o layout;
- **Reajustar ao slot** devolve a peça ao posicionamento gerenciado;
- o seletor de slot permite mover a peça ou torná-la livre.

### Migração

Documentos anteriores são normalizados para `schemaVersion: 1.1.0`. Cards antigos sem filhos recebem automaticamente a estrutura interna baseada nas propriedades existentes.

## Decisões de escopo

- somente o card de produto foi convertido em container completo nesta etapa;
- cabeçalho e rodapé continuam como módulos monolíticos, embora o mecanismo seja reutilizável;
- os slots usam geometria declarativa calculada pelo registro;
- o layout automático é local aos slots e não substitui o futuro motor de auto-layout;
- a renderização ainda é integral a cada mudança.

## Critérios de aceite

- [x] entrar e sair de um componente;
- [x] breadcrumb de contexto;
- [x] filhos em coordenadas locais;
- [x] slots de título, arte, especificações e tabela;
- [x] inserir filhos;
- [x] substituir conteúdo de slot;
- [x] reordenar filhos;
- [x] selecionar o card como unidade;
- [x] salvar e exportar a árvore aninhada;
- [x] migrar documentos do incremento anterior.

## Próximo incremento

O Incremento 03 deve adicionar guias por borda e centro, tolerância magnética, espaçamentos iguais, override por eixo, auto-layout e tamanho mínimo calculado pelo conteúdo.
