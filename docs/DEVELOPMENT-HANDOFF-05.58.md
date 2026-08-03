# Handover de desenvolvimento — estado pós-05.57

> **SUPERADO COMO PONTO DE RETOMADA.** Este handoff preserva o estado observado
> em 1º de agosto de 2026, antes do ensaio que encerrou a evolução funcional da
> V1. Para qualquer trabalho novo, comece por `docs/START-HERE.md` e
> `docs/project/STATUS.md`. Não execute o “próximo gate” deste documento como
> fila ativa.

**Data de corte:** 1º de agosto de 2026  
**Repositório:** `EAKerber/Gerador_de_catalogos_v1_AI`  
**Branch operacional:** `development`  
**Base funcional auditada:** `df908dba87c618a59a155c467732f3b8e26347e1`  
**Último incremento funcional integrado:** `05.57 — integridade factual e footer declarativo`  
**Branch estável:** `main@050589347e55613182a00ed1e22f6efd2f1a2540`

Este documento substitui o handover 05.41 como entrada de retomada. O 05.41
permanece histórico e não deve ser usado isoladamente como checkpoint
operacional.

## 1. Instrução de retomada

Continue a partir do `development` remoto mais recente. O SHA acima identifica
a base funcional auditada imediatamente anterior ao incremento documental
05.58; o único delta esperado do 05.58 é documentação.

Antes de agir:

1. leia `AGENTS.md` e `docs/GITHUB-OPERATIONS.md`;
2. confirme o head remoto de `development`;
3. confirme que a árvore não divergiu deste handover;
4. derive uma branch curta `agent/*`;
5. preserve `main` salvo autorização explícita de promoção.

A V1 single-page está tecnicamente estável em `main`, mas sua aceitação prática
foi reaberta em `development` após o primeiro ensaio real do Authoring Kit.
Isso não autoriza expansão funcional indiscriminada.

## 2. Estado remoto verificado

| Item | Estado no corte |
| --- | --- |
| `development` | `df908dba87c618a59a155c467732f3b8e26347e1` |
| `main` | `050589347e55613182a00ed1e22f6efd2f1a2540` |
| Relação | `development` 11 commits à frente e zero atrás |
| Última PR funcional | #43, integrada por squash |
| CI da PR #43 | Catalog Integration #147, run `30723805650`, sucesso |
| Gate Node/schema/build | aprovado; 112 contratos Node reportados |
| Gate Chromium | quatro de quatro shards aprovados |
| PRs abertas antes do 05.58 | nenhuma |
| Branches antes do 05.58 | `main`, `development`, `agent/integridade-footer-05.57` |

Não havia implementação ou CI pendente no corte. A branch
`agent/integridade-footer-05.57` é residual da PR #43 e deve ser tratada pela
rotina de higiene, separadamente deste handover.

## 3. Contratos preservados

- `CatalogDocument 1.16.0`;
- `CatalogSource 1.1.0`;
- `CatalogGenerationPlan 1.1.0`;
- `CatalogProjectPackage 1.0.0`;
- `CatalogAuthoringKit 1.7.1`;
- 16 tipos canônicos de componente;
- 50 capacidades inventariadas;
- nove receitas oficiais;
- 35 ícones declarados;
- editor browser-only, local-first e single-page;
- JSON e pacote portátil como fontes autorais;
- ausência de backend central ou banco remoto.

O fluxo autoral permanece:

`CatalogSource → CatalogGenerationPlan, quando necessário → compilador →
validação estrutural e gate visual → CatalogProjectPackage importável`.

Fatos comerciais ausentes nunca podem ser inventados.

## 4. Evolução depois da promoção da V1 para `main`

### 05.47 — revisão prática reaberta

O primeiro ensaio real confirmou que aprovação técnica não era suficiente para
aceitação prática. `main@0505893` permaneceu baseline estável e
`development` voltou a receber correções orientadas pela evidência.

### 05.48–05.53 — ergonomia e editabilidade

Foram entregues:

- hierarquia correta do inspetor em 1366×768 e zoom do navegador em 100%;
- CSS consistente dos controles;
- separação entre modo editorial e arranjo horizontal/empilhado do card;
- saneamento e diagnóstico do runner Chromium;
- densidade editável do átomo `specification`;
- fixture reexecutável do ensaio real;
- rótulo, ordem e visibilidade editáveis para cabeçalhos de tabela.

### 05.54–05.55 — Authoring Kit e guia visual

O kit foi revisado para agentes em início frio e ganhou um complemento visual
pesquisável. A referência técnica e a peça promocional passaram a material
pedagógico com proveniência, não a templates ou golden images.

### 05.56 — integridade textual renderizada

O gate visual passou a distinguir validade geométrica de truncamento,
reticências, colisões texto–texto, colisões texto–objeto e fonte abaixo de
6 pt. Rascunhos preservam achados; publicação bloqueia falhas visuais
relevantes.

### 05.57 — integridade factual e footer declarativo

O compilador deixou de materializar fatos comerciais ausentes, passou a
validar caixa das chaves de colunas, evitou galerias sem assets distintos e
passou a registrar gates não executados como `notRun`.

O footer agora usa receitas estruturais e papéis semânticos:

- aceita de um a oito itens;
- recomenda de dois a cinco;
- pede decisão quando faltam dados;
- usa placeholders didáticos inválidos e pendentes;
- só fica vazio por escolha explícita;
- nunca trata conteúdo de exemplo como fato.

## 5. Estado correto da V1

As duas afirmações abaixo são simultaneamente verdadeiras:

1. a V1 single-page possui uma baseline técnica estável em `main`;
2. a V1 está em revisão prática em `development`.

Não reclassifique a V1 como instável apenas porque o ensaio revelou fricções.
Também não considere a revisão encerrada apenas porque Node, schema, build e
Chromium estão verdes. O gate restante é autoral e operacional.

## 6. Política para as duas referências conhecidas

### Referência técnica

A primeira imagem — catálogo técnico de fixação e acessórios — é evidência
técnica conhecida, aderente ao escopo atual, e material pedagógico do guia
visual.

Ela não é:

- template obrigatório;
- golden image pixel a pixel;
- fonte universal de dados comerciais;
- licença para copiar fatos, contatos ou preços.

### Referência promocional

A segunda imagem — promoção de pés para móveis — é benchmark pós-V1
não bloqueante. Ela testa linguagem promocional, hierarquia, repetição de
preços, personagem e desenho técnico, mas não altera os critérios normativos da
V1.

### Regra comum

Ambas são evidências externas já conhecidas pelo projeto. Não servem para o
ensaio cego final. Toda referência didática com dados deve usar placeholders
inválidos por construção.

## 7. Próximo gate recomendado

O próximo gate P0 é um ensaio com agente em início frio usando uma terceira
referência realmente inédita.

Entrada mínima:

- a terceira referência;
- fatos comerciais disponíveis;
- assets disponíveis;
- instruções editoriais indispensáveis, se houver.

Procedimento:

1. entregar somente o Authoring Kit atual ao novo agente;
2. produzir `CatalogSource` e plano quando necessário;
3. compilar, validar e gerar pacote importável;
4. importar no editor sem reparos manuais ocultos;
5. executar gates estrutural, factual, geométrico e textual renderizado;
6. revisar visualmente o PDF e a editabilidade no editor;
7. registrar correções solicitadas, ações manuais e causa por camada;
8. reimportar o pacote revisado e confirmar integridade.

Critérios essenciais:

- nenhum fato inventado;
- nenhum gate não executado apresentado como aprovado;
- nenhum truncamento ou colisão na publicação;
- imagens fiéis, com edição factual rastreável;
- componentes e tabelas editáveis após importação;
- pacote reimportável e reproduzível.

As duas referências conhecidas não podem ser reutilizadas como referência cega.
Não iniciar expansão funcional ampla antes desse ensaio, salvo regressão P0
comprovada.

## 8. Hipóteses posteriores, não escopo ativo

Somente a evidência do próximo ensaio deve decidir se entram em implementação:

- controles de zoom, deslocamento e recorte por instância de imagem;
- revisão editorial do Authoring Kit 1.7.2;
- troca estrutural assistida entre apresentações;
- automações adicionais de enquadramento factual;
- nova taxonomia normativa de referências visuais.

Esses itens não fazem parte do 05.58.

## 9. Protocolo Git e autorizações

O usuário já autorizou:

- trabalho contínuo em `development`;
- criação de branches `agent/*`;
- commits e publicação;
- PRs para `development`;
- integração por squash após todos os gates obrigatórios;
- incrementos pequenos de confiabilidade, correção e consolidação;
- poda mínima de refs `agent/*` elegíveis após readback.

Permanece necessária autorização explícita para:

- integrar em `main`;
- ampliar materialmente o escopo;
- retomar frentes pausadas ou congeladas;
- executar mudança arquitetural maior;
- apagar ou reescrever histórico fora da higiene formalizada;
- promover novas evidências a baseline normativa.

Sequência normal:

1. comprovar `development` remoto;
2. criar branch curta;
3. limitar o diff ao recorte;
4. publicar PR draft para `development`;
5. executar Node/schema/build e quatro shards Chromium;
6. integrar por squash somente com gates verdes;
7. fazer readback do novo head;
8. podar a branch temporária quando elegível;
9. manter `main` intocada.

## 10. Higiene pendente

Antes do 05.58 existia uma única branch residual:

- `agent/integridade-footer-05.57`.

Ela é candidata à poda porque a PR #43 foi integrada e não há PR aberta.
Ainda assim, a exclusão deve seguir o algoritmo de
`docs/GITHUB-OPERATIONS.md`: apresentar o alvo, confirmar os cinco critérios,
remover somente a ref literal e fazer readback.

A branch do 05.58 também é temporária e deve entrar na mesma rotina após sua PR
ser integrada ou encerrada de modo elegível.

## 11. Frentes que permanecem fora do escopo

Não reabrir sem decisão explícita:

- documento multipágina e balanceamento;
- colaboração WebRTC;
- hospedagem e publicação;
- plataforma online;
- touch/mobile completo;
- expansão multimídia;
- novos pipelines de assets;
- locks geométricos persistentes;
- contextualização por IA;
- reescrita integral da aplicação;
- novos tipos sem intenção exclusiva comprovada.

Permanecem em discovery:

- reparenting em Camadas;
- movimentação entre slots;
- drag-and-drop da árvore;
- empilhamento promocional persistente;
- constraints persistentes;
- regras condicionais avançadas para legendas.

## 12. Instrução curta para o próximo agente

> Leia este handover, `AGENTS.md` e `docs/GITHUB-OPERATIONS.md`. Confirme o
> `development` remoto; a base funcional auditada é
> `df908dba87c618a59a155c467732f3b8e26347e1`. A V1 é tecnicamente estável em
> `main@0505893` e está em revisão prática em `development`. Preserve
> `CatalogDocument 1.16.0`, 16 tipos, 50 capacidades, nove receitas e o
> Authoring Kit 1.7.1. O próximo gate é um ensaio com agente em início frio e
> terceira referência inédita. As duas referências conhecidas são evidência e
> material pedagógico, não templates, golden images ou fontes factuais. Use
> branch `agent/*`, PR para `development`, CI integral e squash; não toque
> `main` sem autorização explícita.
