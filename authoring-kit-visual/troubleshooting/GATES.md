# Erros, reparos e gates

Use `issues[]` como lista de trabalho. `summary.actionsRequired = 3` e
`workflow.editorImportActions = 3` descrevem o fluxo normal da interface; não
são três pendências.

| Sinal | Interpretação | Reparo |
| --- | --- | --- |
| `COMPONENT_COLLISION` | frames irmãos se sobrepõem | ajustar frame, gap ou distribuição e recompilar |
| `PAGE_OVERFLOW` | componente ultrapassa a página | reduzir/reorganizar respeitando mínimos |
| `CHILD_OVERFLOW` | filho excede o contêiner | reajustar pai/filho ou arranjo |
| `REFERENCED_ASSET_MISSING` | ID existe no documento, bytes/registro não | fornecer asset e recalcular manifesto |
| `ASSET_NOT_PUBLISH_READY` | asset ainda não aprovado | revisar proveniência e aprovação; não promover automaticamente |
| clipping de texto | conteúdo não cabe na política atual | revisar escala, overflow, frame ou texto factual |

O gate de publicação exige zero erros. Avisos de rascunho continuam visíveis e
devem ser explicados no relatório. O PDF final não mostra grid, seleção, guias
ou painéis do editor.
