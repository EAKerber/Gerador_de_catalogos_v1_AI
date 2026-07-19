# Incremento 05.2 — Segurança de edição e fundação de importação

## Status

Executado. O resultado entregue está documentado em `INCREMENT-05.2.md`; este arquivo permanece como registro do plano que orientou a implementação.

## 1. Objetivo

Tornar operações destrutivas reversíveis e criar a primeira fronteira segura de entrada para documentos externos. O 05.2 não implementa ainda o pacote ZIP completo nem o compilador editorial; prepara as garantias necessárias para ambos.

## 2. Escopo

### Histórico transacional

- `undo` e `redo` no store;
- uma entrada por ação semântica;
- drag e resize registrados no final da interação;
- digitação agrupada por campo e intervalo curto;
- propagação de produto, aplicação de template e mutações recursivas como transações únicas;
- seleção, zoom, aba ativa, guias e recolhimento de painel fora do histórico;
- nova mutação após undo limpa a pilha de redo;
- limite inicial de 100 transações;
- estado sujo/salvo explícito.

### Interface de histórico

- botões Desfazer e Refazer na toolbar;
- estados desabilitados e tooltips;
- `Ctrl/Cmd+Z` para desfazer;
- `Ctrl/Cmd+Shift+Z` e `Ctrl+Y` para refazer;
- `Ctrl+R` permanece reservado ao navegador.

### Documento novo e recuperação

- renomear **Nova página** para **Novo documento**;
- confirmar descarte apenas quando houver alterações não salvas;
- manter snapshot recuperável durante substituição/importação;
- diferenciar documento novo de futura ação **Adicionar página**.

### Importação JSON inicial

- seletor de arquivo `.json` e drag and drop explícito;
- limite de tamanho documentado;
- parse e validação em memória;
- migração em cópia, sem alterar o documento aberto;
- resumo de versão, páginas, componentes, produtos, templates e assets referenciados;
- lista de erros e avisos antes da confirmação;
- substituição atômica após confirmação;
- restauração por undo ou snapshot de recuperação;
- JSON com referências locais ausentes entra com avisos e placeholders, quando estruturalmente válido.

### Estado de sessão

- tornar `editor` opcional na entrada importada ou normalizá-lo fora do contrato autoral mínimo;
- resetar seleção e contexto após importação;
- preservar preferências locais de zoom e painéis quando apropriado;
- documentar a fronteira entre `CatalogDocument` e estado efêmero.

## 3. Fora de escopo

- ZIP com assets;
- hashes e manifesto portátil;
- geração ou aprovação de assets;
- `CatalogSource` e `CatalogGenerationPlan`;
- compilador editorial;
- múltiplas páginas na interface;
- legenda cromática;
- modelo extensível de variantes.

Esses itens permanecem nos incrementos 05.3–06.

## 4. Arquitetura proposta

- `HistoryManager` ou módulo equivalente, desacoplado do renderer;
- API de transação no `CatalogDocumentStore`;
- `DocumentImporter` para parse, validação, migração e relatório;
- resultado de importação sem efeitos colaterais até `commit`;
- snapshots por JSON no primeiro ciclo, pois assets continuam referenciados;
- eventos de store identificam mutações de domínio e mutações efêmeras.

O histórico não deve ser persistido dentro do `CatalogDocument` exportado.

## 5. Critérios de aceite

1. Duplicar, mover, redimensionar, editar, excluir e desfazer restaura documento e IDs esperados.
2. Refazer reaplica a mesma ação; nova edição após undo invalida redo.
3. Atualização de produto e todos os cards vinculados desfazem em uma única ação.
4. Importar JSON inválido não modifica o documento aberto.
5. Importar documento antigo executa migração somente na cópia e mostra a versão resultante.
6. Confirmar importação substitui o documento atomicamente e permite recuperação.
7. Seleção, zoom e troca de aba não criam entradas no histórico.
8. A toolbar permanece utilizável em 1366×768 e começa a consolidar controles secundários.
9. Schema, migração, testes e documentação são atualizados na mesma entrega.

## 6. Testes mínimos

- unidade do histórico: push, undo, redo, branch e limite;
- transações compostas e propagação vinculada;
- coalescência de campos;
- importação válida, antiga, inválida, grande e com referências ausentes;
- falha de migração sem mutação do estado atual;
- atalhos sem interferência em inputs e no reload do navegador;
- smoke de toolbar e diálogo de importação em 1366×768;
- regressão dos testes 05.1 existentes.

## 7. Decisões a tomar durante a implementação

- janela exata de coalescência de digitação, começando entre 500 e 800 ms;
- limite inicial do JSON importável;
- apresentação visual do relatório de importação;
- versão do schema necessária para tornar estado efêmero opcional;
- armazenamento do snapshot de recuperação entre recarregamentos.

Essas escolhas são locais ao incremento e não alteram a definição canônica do produto.
