# Falhas conhecidas da V1

## Escopo

Este registro descreve falhas preservadas, sem corrigi-las. “Falha” inclui
contrato incoerente, ausência de observabilidade, detecção sem decisão e
resultado que cabe estruturalmente mas não atende ao objetivo editorial.

As disposições abaixo são preliminares. A classificação definitiva pertence a
`CAPABILITY-DISPOSITION.md`.

## Resumo

| ID | Estado | Falha | Camadas principais | Confiança |
| --- | --- | --- | --- | --- |
| KF-001 | `reproduced` | validade geométrica não implica integridade textual | validator, DOM, PDF | alta |
| KF-002 | `observed` + `inferred` | diagnóstico textual não fecha o ciclo de correção | auditor, layout, autoria | alta no mecanismo; média na causalidade total |
| KF-003 | `observed` | plano 1.1.0 é incompatível com o plano embutido exigido pelo schema | schemas, compiler, package | alta |
| KF-004 | `reproduced` + `observed` | capacidade de enquadramento não se torna decisão autoral confiável | editor, kit, agente | alta no caso controlado; média na generalização |
| KF-005 | `observed` | preview diagnóstico pode divergir do resultado autoritativo | autoria, renderer, PDF | média até ingestão |
| KF-006 | `observed` | proveniência de derivados pode ser declarada sem cadeia reproduzível | assets, package, autoria | média até ingestão |
| KF-007 | `observed` | distribuição do guia visual é ambígua para o agente receptor | build, manifest, kit | alta |
| KF-008 | `reproduced` | operação manual continua cara apesar de ganhos em lote | interface, store, layout | alta |
| KF-009 | `observed` | “zero colisões” tem semântica estreita e pode orientar decisão errada | relatórios, agente, usuário | alta |
| KF-010 | `inferred` | granularidade e escritores múltiplos amplificam custo de correção | store, components, layout, renderer | média |

## KF-001 — geometria válida não implica texto íntegro

- **Estado:** `reproduced`
- **Pergunta:** um documento com zero colisão e overflow de frames pode conter
  texto truncado no resultado renderizado?
- **Evidência:** `docs/INCREMENT-05.56.md`, fixture
  `tests/fixtures/text-integrity-blind-test-05.56.json` e teste Chromium
  `tests/browser-text-integrity-05.56.test.js`.
- **Resultado:** dez truncamentos visíveis coexistiam com relatório estrutural
  sem overflow tipográfico, pois `CatalogDocumentValidator` mede frames JSON.
- **Camadas afetadas:** compiler, validator, renderer, CSS e PDF.
- **Impacto:** agente ou usuário pode interpretar “zero overflow” como texto
  completo quando a afirmação cobre somente envelopes geométricos.
- **Explicação causal atual:** o validador estrutural não possui glifos, fonte
  efetiva, `scrollWidth`, `scrollHeight` ou ranges DOM. O auditor 05.56 mede
  esses dados apenas após renderização.
- **Como refutar:** produzir um contrato único no qual todo relatório que
  declara validade visual inclua e identifique uma auditoria DOM disponível.
- **Implicação preliminar:** reconstruir a definição de qualidade; preservar a
  fixture e as primitivas de medição.

## KF-002 — o auditor detecta, mas não governa o reflow

- **Estado:** mecanismo `observed`; efeito sistêmico `inferred`
- **Pergunta:** o resultado do auditor textual altera automaticamente a decisão
  de layout e é confirmado em nova renderização?
- **Evidência:** `app/visual-text-integrity.js`, `app/project-package.js`,
  `app/print-export.js`, `app/layout-engine.js` e `app/document-store.js`.
- **Resultado:** a auditoria agrega issues e pode bloquear publicação. Não há
  controlador no caminho crítico que selecione uma política de redução, altere
  o documento, renderize novamente e prove a correção.
- **Camadas afetadas:** auditor, store, layout, renderer e fluxo do agente.
- **Impacto:** detecção pode não gerar mudança de decisão; a correção continua
  manual ou externa.
- **Alternativas:** isso pode ser uma escolha legítima de segurança na V1, não
  um bug isolado. O problema é a ausência de outro ator autoritativo que feche o
  ciclo.
- **Como refutar:** demonstrar um fluxo existente e reexecutável de
  `materializar → auditar → decidir → rematerializar → auditar` sobre caso
  heterogêneo, sem intervenção geométrica direta.
- **Implicação preliminar:** reconstruir a orquestração; não presumir que o
  código atual do auditor ou layout seja a unidade correta de reuso.

## KF-003 — divergência do contrato de plano embutido

- **Estado:** `observed`
- **Pergunta:** o mesmo plano possui uma versão aceita em todos os contratos?
- **Evidência:** `schemas/catalog-generation-plan.schema.json` exige `1.1.0`;
  `app/catalog-generation-plan.js` produz `1.1.0`; `app/catalog-compiler.js`
  embute esse plano; `schemas/catalog-document.schema.json` exige `1.0.0` em
  `generation.plan.planVersion`.
- **Resultado:** o contrato externo e o plano gerado divergem do schema do
  documento que os incorpora.
- **Camadas afetadas:** schema, compiler, exemplos e package.
- **Impacto:** agentes ou validadores precisam normalizar uma incoerência que
  deveria ser resolvida por uma única autoridade de versão.
- **Como refutar:** não se aplica à presença do defeito; apenas uma nova versão
  de contrato poderia removê-lo. Durante a autópsia, o runtime permanece
  intacto.
- **Implicação preliminar:** reconstruir/normalizar contratos; preservar casos
  de compatibilidade como fixture.

## KF-004 — enquadramento existe, mas não é aplicado com confiabilidade

- **Estado:** capacidade `reproduced`; falha de início frio `observed`
- **Pergunta:** disponibilizar controle e instrução em prosa é suficiente para
  obter ocupação adequada no documento final?
- **Evidência:** `docs/evidence/05.59B/art-framing-causal/` demonstra 1,86× de
  ganho no editor. O ensaio cego posterior observou as oito artes nos defaults.
- **Resultado:** capacidade e política existiam, mas não viraram overrides no
  documento do agente limpo.
- **Camadas afetadas:** kit, plano/padrões pós-compilação, editor e agente.
- **Impacto:** produtos visualmente pequenos, uso ineficiente do slot e edição
  manual posterior.
- **Fatores de confusão:** os artefatos finais ainda não foram ingeridos; não é
  possível generalizar frequência ou atribuir toda a causa ao kit.
- **Como refutar:** repetir com artefatos preservados e mostrar overrides
  explícitos, métricas antes/depois e round-trip do editor sem prompt corretivo.
- **Implicação preliminar:** reconstruir o contrato executável de intenção de
  imagem; preservar controles e experimento causal.

## KF-005 — duas verdades visuais

- **Estado:** `observed`
- **Pergunta:** a prévia apresentada ao usuário representa os mesmos bytes,
  layout e renderer do PDF autoritativo?
- **Evidência:** no ensaio cego, a prévia paralela parecia melhor e não mostrava
  os truncamentos encontrados no PDF do editor.
- **Resultado:** o rótulo “diagnóstico” foi correto, mas a superfície continuou
  capaz de mascarar a qualidade real antes do round-trip.
- **Camadas afetadas:** autoria externa, editor, renderer e PDF.
- **Impacto:** aprovação pode ocorrer sobre uma imagem que não é a saída.
- **Como refutar:** ingerir os dois artefatos e provar equivalência de árvore,
  fontes, geometria, assets e pixels dentro de tolerância declarada.
- **Implicação preliminar:** descartar preview paralelo como entrega; decidir
  depois se há valor diagnóstico residual.

## KF-006 — proveniência declarada sem reprodutibilidade

- **Estado:** `observed`
- **Pergunta:** um asset `derived` identifica seus pais e método de forma
  suficiente para reproduzir a derivação?
- **Evidência:** o manifesto observado no ensaio final declarava
  `origin: derived` com `sourceAssetIds: []`; os documentos de política exigem
  fonte, método e preservação do original.
- **Resultado:** a forma do registro existia, mas a cadeia de custódia estava
  vazia.
- **Camadas afetadas:** autoria de assets, manifesto e package.
- **Impacto:** não é possível demonstrar fidelidade, refazer recorte ou revisar
  o que foi removido.
- **Como refutar:** ingerir o pacote e localizar fonte, hash ou URL reproduzível
  vinculada por outro campo autoritativo.
- **Implicação preliminar:** preservar hashing e aprovação; reconstruir o gate
  de linhagem de derivados.

## KF-007 — distribuição ambígua do guia visual

- **Estado:** `observed`
- **Pergunta:** um agente que recebe “o Authoring Kit 1.7.2” sabe se o guia
  visual está incluído ou deve ser obtido separadamente?
- **Evidência:** `authoring-kit/manifest.json` declara complemento 1.0.1 com
  `distribution: standalone-kit-only`; `buildAuthoringKit()` omite o guia por
  padrão e só o inclui quando recebe `visualGuideFiles`; os testes protegem as
  duas variantes.
- **Resultado:** o comportamento é intencional no código, mas o pacote-núcleo
  ainda referencia um caminho `visual-guide/manifest.json` ausente naquele ZIP.
  Um agente receptor identificou isso como inconsistência.
- **Camadas afetadas:** build, manifesto, distribuição e onboarding do agente.
- **Impacto:** o ponto de entrada promete material não presente e aumenta a
  chance de o agente operar apenas com política textual.
- **Como refutar:** fornecer descriptor externo resolvível ou empacotamento cujo
  manifesto diferencie inequivocamente “não incluído” de “ausente”.
- **Implicação preliminar:** reconstruir distribuição/descoberta; preservar o
  conteúdo do guia como evidência.

## KF-008 — custo manual continua material

- **Estado:** `reproduced`
- **Pergunta:** os ganhos em lote eliminaram a carga operacional para uma página
  técnica de sete produtos?
- **Evidência:** métricas comparáveis 05.12, 05.16 e 05.17.
- **Resultado:** houve ganho substancial de 267 para 157 ações, mas a página
  ainda exigiu 157 ações, 20 trocas de contexto, 45 mudanças de foco e 3
  correções no melhor ensaio preservado.
- **Camadas afetadas:** interface, modelo de componentes, store e layout.
- **Impacto:** refinamento fino permanece caro e sensível a contexto.
- **Como refutar:** corte vertical comparável com contagem menor e qualidade
  superior, sem ocultar passos em automação externa.
- **Implicação preliminar:** extrair operações em lote comprovadas; reconstruir
  a arquitetura da interação depois de medir tarefas essenciais.

## KF-009 — “zero colisões” é correto e enganoso ao mesmo tempo

- **Estado:** `observed`
- **Pergunta:** o termo “colisão” identifica qual superfície e qual objeto foi
  medido?
- **Evidência:** `app/catalog-validator.js` compara frames irmãos e limites do
  pai; `app/visual-text-integrity.js` mede fragmentos de texto e objetos no DOM.
  Relatos de agentes frequentemente resumiram apenas a primeira contagem.
- **Resultado:** `collisions: 0` pode ser verdadeiro no relatório estrutural e
  não responder se há clipping, reticência, colisão de glifos ou composição
  semanticamente ruim.
- **Camadas afetadas:** reports, nomenclatura, agente e decisão do usuário.
- **Impacto:** o gate influencia indevidamente a confiança e pode encerrar a
  iteração cedo.
- **Como refutar:** emitir relatório tipado cuja validade global não permita
  omitir superfícies `notRun` e cuja linguagem pública preserve a distinção.
- **Implicação preliminar:** preservar diagnósticos especializados; reconstruir
  agregação e semântica dos gates.

## KF-010 — multiplicidade de escritores e granularidade elevam o custo

- **Estado:** `inferred`
- **Pergunta:** por que correções locais passaram a exigir mudanças em várias
  camadas?
- **Evidência:** 48 módulos em `app/`, 16 tipos de componente, 51 capacidades,
  contratos espelhados no kit e sequência 05.47–05.60 de correções entre
  inspector, cards, tabelas, assets, footer, schemas, kit e gates.
- **Resultado:** o mesmo resultado editorial emerge de defaults do registro,
  source, plan, compiler, store/reflow, renderer/CSS, pós-compilação e ações do
  agente. Essa explicação ainda precisa de mapa formal de escritores.
- **Camadas afetadas:** todo o caminho crítico.
- **Impacto:** pequena mudança de intenção pode exigir sincronização ampla e
  testes de regressão heterogêneos.
- **Alternativas:** parte dessa multiplicidade pode ser separação saudável; a
  contagem bruta de módulos/capacidades não prova arquitetura ruim.
- **Como refutar:** mapear escritores e demonstrar uma autoridade única por
  invariável, com dependências direcionais e baixo custo de mudança.
- **Implicação preliminar:** ainda aberta; exige frente específica antes da
  matriz de disposição.

## Falhas deliberadamente não consolidadas aqui

Itens puramente cosméticos, bugs já corrigidos antes do 05.60 e desejos futuros
não entram automaticamente neste registro. Eles só devem ser promovidos quando
afetarem uma decisão de disposição ou um requisito mensurável da V2.

