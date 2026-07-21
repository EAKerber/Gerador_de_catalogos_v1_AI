# Developer B — ciclo de consolidação 05.19

## Finalidade

Ciclo executado exclusivamente em `agent/developer-b-05.18` para reduzir sobreposições incrementais já comprovadas. Não altera `CatalogDocument 1.16.0`, os 16 tipos, receitas, canvas/PDF, histórico, `development` ou `main`.

## Regras

1. Uma sobreposição por incremento.
2. Transferir responsabilidade antes de remover o shim.
3. Runtime principal antes do AuthoringKit.
4. Build idempotente obrigatório.
5. Auditoria consolidada após remoção física.

## Incrementos concluídos

### DB-05.19.1 — Overrides de tabela no store

Comportamento incorporado a `replaceTableRowsBulk`, preservando `bindingSync`, `bindingSyncDepth`, append, undo e redo.

**Commit:** `7acc1b9295acd00fb771f51aa76646c2b2bb9c44`.

### DB-05.19.2 — Remoção do shim de overrides

Arquivo, carregamentos e referências de build removidos; regressão passou a depender somente do store.

**Commit:** `f0532b7ef4f8e2abfb95a39946ba90334ced1a42`. Gate: run `29844850207`.

### DB-05.19.3 — Contenção canônica do `footer-item`

Geometria transferida para `component-registry.js`; recorte de tela e impressão transferido para `styles/components.css`; shim reduzido a no-op.

**Commit:** `724c9d7362d0bf1ca65a435be7c4c5a16e3eb9eb`.

### DB-05.19.4 — Remoção do shim do `footer-item`

Arquivo, carregamentos, instalação e referência de build removidos. Regressões e estresse foram desacoplados do global de compatibilidade.

**Commit:** `fc6a47fc8305f90fd9400682ce7935c42d9db5fb`.

### DB-05.19.5 — Contenção canônica da escala de ícone

A limitação do invólucro SVG de ícones do rodapé foi transferida para `styles/components.css`. O registro e o render continuam responsáveis por publicar `iconScale`; o contrato foi reduzido a no-op sem injeção de estilos.

**Commit:** `d6ea7c030591856546936dfe10946faf983fa81a`.

### DB-05.19.6 — Remoção do shim de escala de ícone

O arquivo foi removido do editor e do AuthoringKit. Bootstrap, compilador, builds e testes deixaram de depender de `CatalogIconScaleContract`; a capacidade permanece no registro, render e CSS canônicos.

**Commit:** `b24597e1004489caf8f4c8a4fb07b66aefe7eb6c`.

## Gate estável final

Aprovado no run `29873047487` com:

- suíte completa Node, build e Chromium;
- estresse de domínio;
- semente visual `5196999`;
- ausência dos três shims removidos;
- ausência dos globais de compatibilidade;
- build Developer B idempotente;
- paridade entre editor e AuthoringKit.

## Resultado estrutural

Após os seis incrementos:

- `replaceTableRowsBulk` é a única implementação dos overrides tabulares;
- a geometria e o recorte do `footer-item` pertencem às superfícies canônicas;
- a escala interna de `icon` e `specification` pertence ao registro, render e CSS principal;
- editor e compilador não carregam contratos adicionais para esses comportamentos;
- o build Developer B não copia os três shims removidos;
- regressões e estresse não dependem de globais de compatibilidade;
- schema, tipos, receitas e capacidades permanecem inalterados.

## Próxima etapa

O próximo trabalho não é outra consolidação automática. A branch deve passar por um benchmark de generalização baseado em uma peça promocional diferente da referência original, medindo criação, edição, undo/redo, exportação, reimportação e impressão sem criar novos tipos durante o teste.
