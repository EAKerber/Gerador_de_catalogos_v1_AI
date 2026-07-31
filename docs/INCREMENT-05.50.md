# Incremento 05.50 — saneamento do gate Chromium

## Problemas confirmados

O fluxo local e os shards da CI acumulavam quatro fragilidades operacionais:

- três testes navegavam diretamente para `127.0.0.1:8080`, ignorando
  `CATALOG_BASE_URL`;
- o runner não registrava o caminho e a versão efetiva do Chromium;
- timeout, sinal nativo, queda do navegador e asserção funcional apareciam no
  mesmo resumo;
- a distribuição alfabética equilibrava quantidade, mas podia concentrar
  auditorias longas num único shard.

Essas condições produziram falsos `connection refused`, repetições manuais e
diagnósticos ambíguos. Elas não indicavam uma regressão do catálogo.

## Decisão

- todos os testes de navegador devem respeitar `CATALOG_BASE_URL`;
- o runner registra executável e versão do Chromium antes da suíte;
- falhas são classificadas como funcionais, timeout de infraestrutura, sinal
  de infraestrutura ou queda explícita do navegador;
- somente as três classes infraestruturais recebem uma repetição isolada por
  padrão; `CATALOG_INFRA_RETRY_LIMIT=0` a desativa;
- asserções funcionais nunca são repetidas automaticamente;
- os quatro shards usam pesos pequenos, explícitos e versionados para testes
  historicamente longos, com atribuição gulosa determinística;
- `--list-shards` torna o plano e seus pesos auditáveis sem iniciar servidor ou
  navegador.

## Contratos

O gate Node proíbe novos `page.goto(...)` com `localhost:8080` ou
`127.0.0.1:8080`, valida as quatro classes de falha e prova que o plano de
shards inclui cada teste Chromium uma única vez com diferença máxima de um
ponto entre os custos.

O recorte não altera runtime, schema, Authoring Kit ou comportamento visual do
produto.
