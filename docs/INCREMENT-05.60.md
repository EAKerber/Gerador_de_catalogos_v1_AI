# Incremento 05.60 — Authoring Kit 1.7.2 dirigido por evidência

## Motivação

O ensaio causal 05.59B demonstrou que, no caso controlado, o enquadramento do
editor alcança 1,86× de ganho de ocupação e fica somente 0,68% abaixo do
recorte externo. Expandir o canvas neutro melhora a continuidade do fundo, mas
não a ocupação factual. Este incremento converte essa evidência em orientação
autoral verificável sem promover a referência a template, golden image, fonte
factual ou norma universal.

## Contrato editorial 1.7.2

O fluxo factual passa a seguir esta ordem:

1. ajustar `fit`, foco, zoom e deslocamento na instância;
2. comparar ocupação, corte e fidelidade no viewport real em tela e impressão;
3. recortar margens neutras externas somente se ainda necessário;
4. expandir fundo neutro apenas quando o objetivo for continuidade de fundo;
5. registrar origem, asset-fonte, método, fidelidade, papel e aprovação de cada
   derivado específico por uso.

Metas de ocupação são contextuais. O kit não declara um percentual mínimo
universal e não autoriza deformação, invenção de detalhes ou mudança factual.

## Autoridade do resultado e integridade factual

O resultado autoritativo é o `CatalogDocument` importado e revisado no editor.
Prévia paralela pode servir como diagnóstico, nunca como substituto do
documento, da página ou do PDF gerado pelo editor. A entrega exige auditoria do
documento materializado, inclusive defaults injetados, e novo round-trip após
correções.

Defaults e exemplos comerciais agora usam marcadores inválidos por construção,
como `[PRODUTO]`, `[CÓDIGO]`, `[EMBALAGEM]` e `[R$ 00,00]`. O
`CatalogDocumentValidator 1.2.0` preserva esses marcadores como avisos durante o
rascunho e os bloqueia em publicação nos produtos, cards e tabelas, assim como
já ocorria com o footer. A resolução continua sendo:

1. perguntar pelo fato ausente;
2. manter estado pendente enquanto não houver resposta;
3. omitir apenas por decisão explícita.

## Compatibilidade

- `CatalogAuthoringKit 1.7.2`;
- complemento visual `1.0.1`;
- editor e artefatos governados identificados como incremento `05.60`;
- `CatalogDocument 1.16.0`, `CatalogSource 1.1.0`,
  `CatalogGenerationPlan 1.1.0` e `CatalogProjectPackage 1.0.0` preservados;
- 51 capacidades, 16 componentes e 19 fluxos curados preservados;
- runtime da aplicação e runtime distribuído continuam equivalentes.

## Critérios de verificação

- os valores medidos do 05.59B são protegidos por contrato Node;
- o documento didático materializado não contém defaults comerciais
  plausíveis;
- publicação de exemplos pendentes falha com códigos explícitos para produto,
  tabela e footer;
- manifesto, guia textual, guia visual, runtime e bundle embutido permanecem
  sincronizados e idempotentes;
- Node/schema/build e os quatro shards Chromium devem passar na CI oficial.

## Próximo gate

O próximo recorte é o ensaio de aceitação em início frio com um agente novo e
uma terceira referência inédita. Ele deve usar somente o kit 1.7.2, fatos e
assets disponibilizados, importar o pacote no editor, gerar PDF pelo editor e
executar uma rodada de feedback e reimportação. As duas referências conhecidas
permanecem apenas como evidência de desenvolvimento.
