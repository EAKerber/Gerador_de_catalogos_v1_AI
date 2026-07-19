# Incremento 05.9 — Ações contextuais e composição em lote

## Objetivo

Reduzir navegação e repetição na construção manual sem criar formatos paralelos ao documento. O editor passa a oferecer a ação mais provável no `+`, permite espaçar irmãos e inserir separadores como uma única operação, e reorganiza o inspetor por tarefa.

## Entregas

- `+` em uma tabela adiciona uma linha com as colunas semânticas atuais;
- `+` em uma arte compatível converte-a em galeria, preserva ID, asset e legenda da imagem original e cria a primeira variação;
- `+` em uma arte já pertencente a uma galeria adiciona outra imagem legendável;
- seleções de dois ou mais irmãos recebem gap uniforme horizontal, vertical ou automático;
- quando o contexto já é um auto-layout compatível, o comando altera o gap do pai e preserva os filhos gerenciados;
- em composição livre, os itens selecionados são espaçados a partir do primeiro, com frames explícitos;
- separadores opcionais são átomos editáveis em overlay, criados somente quando o gap é maior que três vezes a espessura mínima;
- cinco presets oficiais de separador passam ao manifesto de capacidades;
- checkboxes binários relevantes passam a toggles;
- o inspetor usa **Conteúdo**, **Layout** e **Visual**; frame e restrições ficam em **Avançado**.
- toolbar e abas esquerdas preservam rótulos e hitboxes sem sobreposição em `1366×768`.

## Garantias

- cada comando composto gera uma única entrada de histórico;
- a conversão em galeria não duplica nem perde a arte original;
- seleção em lote continua limitada a irmãos no mesmo contexto;
- separadores gerados continuam componentes `separator` comuns;
- falhas de capacidade ou geometria não deixam estado parcial;
- o schema do documento permanece `CatalogDocument 1.15.0`; o manifesto do kit evolui para `CatalogAuthoringKit 1.3.0`.

## Fora do incremento

“Variação” não será simulada como linha visual de tabela. O vínculo entre variantes comerciais, imagens, legendas e células requer identidade semântica própria e foi especificado para o 05.10 em `ADR-023-semantic-variants-and-visual-legends.md`.

## Validação

- teste unitário de ações contextuais, conversão em galeria, espaçamento, separadores e desfazer;
- teste de interface real em `1366×768` cobrindo `+`, nova taxonomia do inspetor e operação em lote;
- asserções geométricas de visibilidade, não sobreposição da toolbar e ausência de truncamento nas abas esquerdas;
- suíte histórica completa para store, schema, kit, compilador, PDF e browser.
