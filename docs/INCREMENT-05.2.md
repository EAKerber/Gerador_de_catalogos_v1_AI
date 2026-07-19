# Incremento 05.2 — Segurança de edição e importação JSON

## Objetivo

Tornar mutações de domínio reversíveis e criar uma fronteira segura para entrada de documentos externos, sem antecipar o pacote ZIP de assets nem o compilador editorial.

## Entregue

- histórico transacional de até 100 ações;
- `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z` e `Ctrl+Y` fora de campos de formulário;
- botões Desfazer e Refazer com estado e descrição da próxima ação;
- coalescência de 700 ms para edições consecutivas do mesmo conteúdo;
- seleção, zoom, guias e preferências de painel fora do histórico;
- atualização de produto e propagação para cards vinculados como uma ação única;
- estado sujo/salvo derivado do snapshot do documento;
- **Novo documento** no lugar do rótulo ambíguo **Nova página**;
- recuperação de documento novo ou importado por Desfazer na sessão atual;
- importador JSON com escolha de arquivo e drag and drop;
- limite inicial de 10 MB;
- parse, análise e migração em memória antes do commit;
- relatório com versão, páginas, componentes, produtos, templates, assets, linhas, erros e avisos;
- bloqueio de schema futuro, tipo desconhecido, ID duplicado e frame inválido;
- avisos para página ativa ausente, referências de asset/linha ausentes e assets dependentes de IndexedDB;
- commit atômico somente após confirmação;
- sessão `editor` opcional no schema autoral;
- exportação JSON sem seleção, zoom ou preferências efêmeras;
- migração para o schema `1.12.0`.

## Contrato de histórico

O histórico guarda snapshots do domínio sem `editor` e `updatedAt`. Ao restaurar:

- preferências locais de zoom, grid e painéis permanecem;
- seleção e contexto são preservados apenas se ainda existirem;
- o documento recebe novo `updatedAt`;
- o estado sujo é comparado ao último snapshot salvo;
- uma nova mutação após undo elimina a pilha de redo.

Assets binários não entram nos snapshots. Desfazer o registro de um asset remove sua referência do documento, mas a limpeza de blobs órfãos do IndexedDB permanece para uma rotina posterior.

## Contrato de importação

O importador usa duas etapas:

1. **Análise sem efeito colateral:** lê, verifica estrutura conhecida, migra uma cópia e produz um relatório.
2. **Commit explícito:** substitui o documento somente quando não existem erros e o usuário confirma.

Documentos sem `editor` recebem defaults locais. Documentos antigos são migrados em memória. Documentos com versão superior à suportada são bloqueados para evitar downgrade destrutivo.

JSON isolado não transporta bytes de IndexedDB. A importação mantém metadados e referências, apresenta aviso e usa placeholders quando os arquivos não estão disponíveis. O pacote portátil com assets pertence ao 05.3.

## Interface

- toolbar atualizada para **Incremento 05.2**;
- grupo compacto de histórico;
- indicador de alteração não salva no botão Salvar e no título da aba;
- diálogo responsivo de importação;
- resumo e severidade de problemas antes da confirmação;
- texto explícito de que o documento anterior pode ser recuperado com Desfazer.

## Arquivos principais

- `app/document-store.js` — histórico, análise, commit, sessão opcional e exportação autoral;
- `app/document-importer.js` — fluxo de arquivo, relatório e confirmação;
- `app/interactions.js` — atalhos;
- `app/main.js` — controles, estado sujo e composição dos módulos;
- `index.html` e `styles/editor.css` — toolbar e diálogo;
- `schemas/catalog-document.schema.json` — schema `1.12.0`.

## Testes

- `tests/history-import.test.js` cobre histórico, coalescência, dirty state, propagação vinculada, documento sem sessão, análise, schema futuro e recuperação da importação;
- `tests/browser-history-import.test.js` cobre toolbar, atalhos, relatório, bloqueio e commit no navegador;
- `tests/ui-contract.test.js` cobre os contratos estáticos do 05.2;
- testes existentes foram migrados para `1.12.0` e permanecem como regressão.

## Fora de escopo

- ZIP portátil e importação de bytes de assets;
- proveniência e aprovação de assets no schema funcional;
- manifesto de componentes e templates;
- `CatalogSource` e `CatalogGenerationPlan`;
- compilador editorial;
- multipágina e PDF multipágina.

