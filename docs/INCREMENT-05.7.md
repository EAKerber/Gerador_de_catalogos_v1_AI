# Incremento 05.7 — Refinamento manual em lote

## Objetivo

Reduzir ações repetitivas depois que os componentes já existem na página. O 05.7 não substitui a edição detalhada: acrescenta uma camada contextual para expressar uma mesma intenção sobre vários irmãos.

## Seleção contextual

- clique simples seleciona um componente;
- `Shift`, `Ctrl` ou `Cmd` + clique no canvas ou em Camadas adiciona/remove um irmão;
- `Ctrl/Cmd+A`, fora de campos de texto, seleciona todos os filhos diretos do contexto aberto;
- clicar no fundo limpa a seleção;
- clicar no conteúdo profundo de um contêiner seleciona a peça diretamente editável no contexto atual;
- tentar combinar componentes de pais diferentes reinicia a seleção no novo contexto.

O ID primário anterior foi preservado. O array `selectedComponentIds` é efêmero, opcional no schema de sessão, normalizado na migração e excluído do JSON autoral junto com o restante de `editor`.

## Inspetor do conjunto

Quando há mais de um item selecionado, o painel direito troca detalhes individuais por comandos de maior alavancagem:

- alinhar por esquerda, centro, direita, topo, meio ou base;
- distribuir horizontal ou verticalmente a partir de três itens;
- aplicar preset, modo ou densidade a todos os cards elegíveis;
- aplicar cor de destaque ou texto aos tipos que declaram esses tokens;
- duplicar ou excluir todo o conjunto.

Comandos geométricos convertem peças governadas por slot/auto-layout em overrides manuais, pois a intenção explícita do usuário deve prevalecer. O componente pode ser reintegrado posteriormente pelos controles já existentes.

## Histórico

Cada comando usa `runCompoundChange`. Alinhar sete componentes, por exemplo, não cria sete estados intermediários: produz uma entrada **Alinhar seleção**. Duplicação e exclusão seguem a mesma regra, e um único `Ctrl/Cmd+Z` restaura o conjunto anterior.

## Medição observável

Depois dos sete cards do ensaio manual existirem, aplicar uma densidade a todos exigia pelo menos 14 ações individuais — selecionar e alterar cada card. No teste de navegador do 05.7, o mesmo refinamento usa duas ações:

1. `Ctrl+A` dentro da Área de composição;
2. escolher a densidade uma vez.

Redução desse subfluxo: 85,7%. A contagem integral de 319 ações ainda não foi repetida; portanto, o problema geral não é declarado como encerrado.

## Verificação

- seleção aditiva real no canvas e em Camadas;
- seleção de todos os irmãos pelo teclado;
- restrição a um mesmo pai;
- alinhamento e distribuição geométrica;
- apresentação e tokens apenas nos tipos elegíveis;
- duplicação e exclusão em lote;
- uma entrada de histórico por comando e restauração integral;
- sete cards refinados em duas ações na interface a 1366×768;
- compatibilidade com seleção individual e documentos anteriores.

## Limites

- não há caixa de seleção por arraste;
- não há movimento ou resize de grupo pelo canvas;
- seleção cruzando pais não é permitida;
- propriedades de conteúdo diferentes não são mescladas;
- templates completos de seção e foco contextual preditivo permanecem no backlog.
