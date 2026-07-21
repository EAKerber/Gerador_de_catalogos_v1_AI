# Developer B — ciclo de consolidação 05.19

## Finalidade

Este ciclo sucede o fechamento operacional do 05.18 e continua exclusivamente em `agent/developer-b-05.18`.

Não adiciona capacidade de produto. Seu objetivo é reduzir sobreposições incrementais cuja utilidade já foi comprovada, incorporando o comportamento aos módulos canônicos sem alterar:

- `CatalogDocument 1.16.0`;
- os dezesseis tipos de componente;
- receitas, ícones ou navegação;
- contratos de canvas/PDF;
- histórico reversível;
- `development` ou `main`.

## Regras

1. Uma sobreposição por incremento.
2. Primeiro transferir a responsabilidade; remover o shim somente em incremento posterior.
3. Runtime principal antes do espelho do AuthoringKit.
4. Build idempotente obrigatório.
5. Auditoria consolidada após cada remoção física.

## Incrementos

### DB-05.19.1 — Overrides de tabela no store canônico

- incorporar ao `replaceTableRowsBulk` a marcação de `code`, `package` e `price`;
- preservar `bindingSync`, `bindingSyncDepth`, append, undo e redo;
- converter `table-binding-overrides-contract.js` em shim sem subclassificação;
- manter paridade com o AuthoringKit.

**Estado:** concluído no commit `7acc1b9295acd00fb771f51aa76646c2b2bb9c44`.

### DB-05.19.2 — Remoção do shim de overrides

- remover carregamento no editor e compilador;
- remover cópias e referências de build;
- manter a regressão comportamental apontando apenas para o store;
- executar auditoria consolidada.

**Estado:** concluído no commit `f0532b7ef4f8e2abfb95a39946ba90334ced1a42`; gate final aprovado no run `29844850207`.

### DB-05.19.3 — Contenção do `footer-item` nas superfícies canônicas

- transferir a geometria de título e subtítulo para `component-registry.js`;
- transferir o recorte defensivo de tela e impressão para `styles/components.css`;
- preservar o mínimo de 14 px quando tecnicamente possível e o inset inferior;
- reduzir `footer-item-containment-contract.js` a shim sem mutação;
- manter paridade com o AuthoringKit.

**Estado:** concluído no commit `724c9d7362d0bf1ca65a435be7c4c5a16e3eb9eb`.

### DB-05.19.4 — Remoção do shim de contenção do `footer-item`

- remover o arquivo do editor e do runtime do AuthoringKit;
- remover carregamento e instalação no bootstrap e no compilador;
- remover a referência do build Developer B;
- desacoplar regressões e estresse de domínio do global de compatibilidade;
- executar auditoria consolidada e estresse antes do push.

**Estado:** concluído no commit `fc6a47fc8305f90fd9400682ce7935c42d9db5fb`; auditoria estável final do ciclo em execução no run `29846723145`.

## Resultado estrutural

Após os quatro incrementos:

- `replaceTableRowsBulk` é a única implementação dos overrides tabulares;
- a geometria de título e subtítulo do `footer-item` pertence ao registro de componentes;
- o recorte visual do `footer-item` pertence ao CSS principal;
- editor e compilador não carregam contratos adicionais para esses comportamentos;
- o build Developer B não copia os dois shims removidos;
- o runtime do AuthoringKit usa as mesmas fontes canônicas do editor;
- regressões e estresse de domínio não dependem de globais de compatibilidade;
- schema, tipos, receitas e capacidades permanecem inalterados.

A auditoria estável do ciclo deve permanecer somente leitura e bloquear qualquer retorno dos arquivos ou globais removidos.
