# Incremento 04.2 — Hierarquia estrutural e navegação

## Objetivo

Reduzir o caráter monolítico dos componentes editoriais e tornar a interface legível em notebook sem depender de scroll contínuo ou do zoom do navegador.

## Entregue

- cabeçalho convertido em contêiner com slots `logo`, `kicker` e `title`;
- rodapé convertido em contêiner com slot coletivo `items`, capacidade oito e layout em linha;
- molécula `footer-item` com ícone, título, complemento e tokens próprios;
- migração das props antigas para filhos editáveis sem perda de texto ou contato;
- abas **Componentes/Camadas** no painel esquerdo;
- abas **Estrutura/Conteúdo/Visual** no inspetor;
- aba inicial contextual: contêineres abrem em Estrutura, peças abrem em Conteúdo;
- ênfase da subárvore pertencente ao contêiner selecionado no canvas e nas camadas;
- `Ctrl/Cmd + roda` sobre o workspace controla apenas o zoom lógico da A4;
- seletor de zoom preservado, incluindo opção dinâmica para escalas intermediárias;
- contraste explícito de `select/option`;
- schema 1.6.0, migração, testes unitários e smoke test em Chromium a 1366×768.

## Migração estrutural

Cabeçalhos e rodapés antigos continuam reconhecidos pelas props legadas. Quando não possuem filhos:

1. o registro cria os descritores padrão;
2. os textos existentes alimentam os novos átomos/moléculas;
3. o store atribui IDs, slots e coordenadas locais;
4. o layout de slots é recalculado;
5. as props antigas permanecem no documento para compatibilidade, mas a edição passa aos filhos.

## Navegação

O painel esquerdo deixa Biblioteca e Camadas em superfícies exclusivas. O inspetor agrupa geometria e slots em Estrutura, campos e vínculos em Conteúdo, e tokens em Visual. Cada painel possui sua própria área de rolagem.

## Zoom

O evento de roda só é interceptado com `Ctrl` ou `Cmd` dentro do workspace. A escala é limitada, arredondada e persistida como `editor.zoom` em modo `manual`; `devicePixelRatio` e frames lógicos não mudam.

## Fora do escopo

- reflow automático global de todos os slots;
- Área de composição em `row` por padrão;
- sequência assistida de números dos cards;
- seleção múltipla, histórico e bindings de produto.

Esses itens foram posicionados no 04.3 e 05 conforme `BACKLOG.md`.
