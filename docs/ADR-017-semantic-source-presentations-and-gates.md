# ADR-017 — Fonte semântica, apresentações e gates de publicação

## Status

Aceita no Incremento 05.4.

## Contexto

O documento visual já suportava produtos vinculados e snapshots, mas os fatos ainda dependiam de campos fixos e a apresentação não tinha vocabulário suficiente para orientar um agente. A mesma exportação também servia para revisão e publicação, embora esses destinos tenham tolerâncias diferentes.

## Decisão

1. `CatalogSource` é a projeção semântica de entrada/saída do inventário; `CatalogDocument` permanece a fonte de verdade materializada do editor.
2. Campos legados continuam como projeção de compatibilidade até o compilador consumir atributos e papéis diretamente.
3. Tabelas declaram colunas; linhas mantêm somente valores e chaves de legenda.
4. Apresentação é um contrato explícito separado do binding de produto e do snapshot reutilizável.
5. Mínimo técnico é a única proteção rígida do tipo/conteúdo; recomendado e customizado orientam autoria.
6. Cor semântica referencia uma chave de domínio e sempre carrega um rótulo textual de fallback.
7. Rascunho registra pendências; publicação transforma requisitos de asset e aprovação em erros bloqueantes.

## Consequências

- o 05.5 pode compilar uma fonte semântica sem conhecer detalhes transitórios da interface;
- presets e templates podem evoluir com versão e requisitos auditáveis;
- a edição manual segue permissiva sem permitir corte abaixo do mínimo técnico;
- agentes conseguem escolher fallback antes de perguntar ao usuário;
- pacotes deixam explícito se foram gerados para revisão ou publicação.

## Alternativas rejeitadas

- substituir imediatamente todos os campos legados: quebraria bindings e documentos existentes;
- guardar cor diretamente na célula: perderia vínculo e atualização centralizada;
- usar o tamanho recomendado como mínimo rígido: confundiria preferência editorial com integridade estrutural;
- um único gate configurável apenas no relatório: permitiria distribuir como publicação um projeto ainda não aprovado.
