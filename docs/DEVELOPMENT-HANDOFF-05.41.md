# Handover de desenvolvimento — estado 05.41

**Data de corte:** 28 de julho de 2026  
**Repositório:** `EAKerber/Gerador_de_catalogos_v1_AI`  
**Branch operacional:** `development`  
**Checkpoint obrigatório:** `5c4f79df7eadf52e305a9af01930b09249e5bf5f`  
**Último incremento integrado:** `05.41 — consolidar registro canônico de receitas`  
**Branch estável:** `main@0fda913609c59b231395ea0274abdb66a7c8e1ee`

## 1. Missão do próximo agente

Continuar a manutenção do projeto a partir de `development@5c4f79d`, preservando o encerramento funcional da V1 single-page.

O trabalho permitido neste estágio é:

- correção de regressões e problemas comprovados;
- aumento de confiabilidade;
- consolidação interna em recortes isolados;
- sincronização entre editor, Authoring Kit, testes e documentação;
- limpeza operacional e documental;
- discovery explícito, sem implementação automática de frentes pausadas ou congeladas.

Não reabrir funcionalidades da V1 apenas porque aparecem em documentos históricos.

## 2. Estado atual do produto

A V1 single-page foi formalmente estabilizada no incremento 05.23.

Contratos preservados no checkpoint atual:

- `CatalogDocument 1.16.0`;
- 16 tipos canônicos de componente;
- 45 capacidades declaradas;
- nove receitas oficiais;
- `CatalogAuthoringKit 1.6.0`;
- editor browser-only e local-first;
- JSON e pacote portátil como fontes autorais;
- impressão/PDF A4 da página atual;
- histórico transacional, importação segura e assets portáteis;
- compilação determinística a partir de dados;
- edição manual individual e em lote;
- ausência de backend central ou banco remoto.

O benchmark manual comparável mais recente permanece o 05.17:

- 157 ações;
- zero colisões;
- zero overflow.

Os incrementos posteriores priorizaram integração, confiabilidade, segurança geométrica e consolidação arquitetural, não uma nova medição integral.

## 3. Estado Git verificado

### `development`

Head atual:

```text
5c4f79df7eadf52e305a9af01930b09249e5bf5f
```

Commit:

```text
05.41 — consolidar registro canônico de receitas (#23)
```

### `main`

Head atual:

```text
0fda913609c59b231395ea0274abdb66a7c8e1ee
```

Commit:

```text
05.14 — versão estável inicial
```

`development` está 36 commits à frente de `main` e zero atrás no momento deste handover.

### Pull requests e CI

- PRs #2 a #23: integradas em `development`;
- PR #23: integrada por squash;
- PR #1: aberta em draft, dedicada à auditoria histórica e marcada como **não mesclar**;
- execução mais recente: `Catalog Integration #118`;
- Node, schema e build aprovados;
- quatro de quatro shards Chromium aprovados;
- 99 contratos Node reportados no incremento 05.41;
- nove receitas, 16 tipos e 45 capacidades preservados.

Não há publicação, merge ou CI pendente no checkpoint 05.41.

## 4. Promoção de `development` para `main`

O agente pode e deve **sugerir proativamente** uma promoção de `development` para `main` quando existir um marco coerente, estável e verificável.

A sugestão não precisa aguardar uma solicitação específica do usuário. Ela é apropriada quando:

- um ciclo funcional ou de consolidação foi encerrado;
- o conjunto acumulado passou pelos gates obrigatórios;
- a documentação descreve corretamente o estado promovido;
- não existem PRs bloqueantes ou incidentes de integridade conhecidos;
- o delta entre `main` e `development` já representa uma versão estável identificável.

Toda recomendação de promoção deve apresentar:

1. SHA atual de `main` e SHA candidato de `development`;
2. intervalo de incrementos incluído;
3. resumo funcional e arquitetural do delta;
4. gates executados e resultados;
5. riscos conhecidos e itens explicitamente fora do escopo;
6. proposta de mensagem de merge, tag ou identificação de release;
7. estratégia de reversão ou checkpoint anterior recuperável.

O agente pode preparar a análise, a branch ou a PR de promoção quando autorizado pelo fluxo vigente, mas **não deve integrar em `main` sem aprovação explícita do usuário**. A autorização geral para trabalhar e integrar em `development` não equivale a autorização permanente para promover `main`.

A recomendação deve ocorrer por marco coerente, não após cada incremento pequeno.

## 5. Incrementos recentes relevantes

### 05.33 — Reordenação acessível em Camadas

Entregue:

- mover irmãos para cima ou para baixo;
- mouse e teclado;
- controles desabilitados nos limites;
- restrição ao mesmo pai e grupo/slot;
- ordem serializada, reflow e undo preservados.

Fora do escopo:

- reparenting;
- cruzamento entre slots;
- drag-and-drop na árvore;
- alteração do modelo de empilhamento.

### 05.34 e 05.40 — Publicação e confirmação determinísticas

O fluxo Git passou a:

- derivar manifesto canônico diretamente de `HEAD`;
- enumerar caminhos, modos e blobs;
- normalizar respostas diretas e aninhadas;
- detectar enumeração parcial;
- validar contagem, caminhos e SHAs;
- reconstruir a entrada canônica uma única vez;
- bloquear uma segunda divergência;
- comparar integralmente a árvore antes de criar referências remotas;
- tratar o retorno imediato de uma escrita como acknowledgement;
- confirmar branch, commit, árvore e PR por readback independente;
- aceitar nome/ref como identidade própria do acknowledgement de `create_branch`;
- exigir o SHA no readback da referência, não no acknowledgement inicial.

Uma resposta incompleta nunca autoriza repetição cega da escrita.

### 05.35–05.39 — Consolidação interna

Foram removidas dependências de substituições tardias em:

- projeção de rótulos do editor;
- reflow e histórico;
- apresentações `variants` e `data-only`;
- renderer da biblioteca por intenção;
- manifesto de capacidades.

### 05.41 — Registro canônico de receitas

Quatro contratos tardios substituíam sequencialmente `CatalogSectionRecipes` e `CATALOG_SECTION_RECIPES`, tornando o resultado dependente da ordem de carregamento.

Estado atual:

- uma única API;
- um único registro;
- operação canônica de registro;
- conflito explícito;
- ordem determinística;
- clones independentes;
- versão pública derivada das receitas registradas;
- instalação e reinstalação independentes da ordem;
- exatamente nove receitas preservadas;
- nenhuma nova capacidade ou alteração visual.

A primeira imagem de referência continua sendo o critério canônico da V1. A segunda deve ser tratada somente como benchmark pós-V1.

## 6. Protocolo Git obrigatório

Cada incremento deve começar em uma branch curta `agent/*`, derivada do `development` remoto já integrado.

Sequência esperada:

1. confirmar o SHA remoto de `development`;
2. criar checkout ou árvore limpa a partir desse SHA;
3. não reutilizar worktrees históricas como base;
4. executar o pré-voo Git uma única vez;
5. selecionar transporte por capacidade: `direct-git`, `github-connector` ou `blocked`;
6. rodar build e testes proporcionais ao risco;
7. publicar somente a branch do agente;
8. criar PR draft contra `development`;
9. validar Node/schema/build e os quatro shards Chromium;
10. integrar por squash somente após todos os gates;
11. confirmar o novo SHA de `development` por readback;
12. manter `main` intocada, salvo promoção explicitamente aprovada.

O conector GitHub é preferencial para operações remotas que ele exponha. A ausência de `gh` não significa que o GitHub está indisponível.

## 7. Branches e poda operacional

A auditoria anterior encontrou 25 branches.

Preservar por enquanto:

- `main`;
- `development`;
- `agent/developer-b-05.18`.

As 22 branches `agent/*` associadas às PRs #2–#23 já integradas são candidatas à exclusão, desde que um readback final confirme que seus heads não receberam commits posteriores relevantes.

A poda desse conjunto reduziria o repositório de 25 para três branches.

Não apagar `agent/developer-b-05.18` junto das branches comuns de incremento.

## 8. Prioridade P1 — revisão da branch histórica

A revisão de `agent/developer-b-05.18` passa a ser **P1 operacional e documental**.

Ela deve preceder novas consolidações internas não urgentes. Correções P0 de regressão, integridade ou segurança continuam tendo precedência.

Motivos da prioridade:

- a branch possui 489 commits de auditoria;
- diverge do `development` atual e está 25 commits atrás;
- mantém grande volume de screenshots, relatórios e workflows experimentais;
- parte de suas evidências não foi migrada para `development`;
- sua existência prolongada dificulta distinguir fonte canônica, evidência histórica e implementação já integrada;
- ela impede uma poda completa e mantém a PR #1 indefinidamente aberta.

A branch inteira não deve ser mesclada. O conteúdo deve ser triado e migrado de forma curada a partir de uma branch limpa baseada em `development`.

## 9. Classificação obrigatória do conteúdo histórico

Cada item exclusivo da branch histórica deve receber uma das seguintes decisões.

### A. Aproveitar no estado canônico

Migrar para `development` somente quando o item for único, útil e ainda válido.

Candidatos possíveis:

- documentação que explica decisões ainda não registradas nos documentos canônicos;
- screenshots representativas que devam se tornar baselines permanentes;
- relatórios de auditoria com conclusões ainda relevantes;
- fixtures necessárias para reproduzir referências ou regressões;
- testes que cubram um risco real ainda não coberto pela suíte atual;
- índices que ajudem agentes futuros a localizar evidências.

Antes de migrar código ou testes, verificar se a capacidade já foi integrada de forma diferente pelos incrementos 05.20–05.41. Não restaurar patches antigos, subclasses tardias, runners paralelos ou workflows experimentais apenas porque existem na branch.

### B. Manter apenas como registro histórico

Não migrar os arquivos brutos quando o valor estiver na explicação do processo, não na sua execução atual.

Exemplos:

- relatórios intermediários substituídos por uma conclusão posterior;
- logs de tentativas e falhas úteis para rastreabilidade;
- screenshots de estados transitórios;
- comparações antigas já consolidadas em métricas finais;
- planos de remediação já executados;
- workflows usados somente para diagnóstico da branch.

Nesses casos, criar ou ampliar um índice histórico em `development` com:

- título;
- categoria;
- caminho original;
- SHA da branch histórica;
- conclusão relevante;
- documento canônico que o substitui, quando houver.

O índice preserva a descoberta sem incorporar todo o volume bruto à branch operacional.

### C. Descartar após registro mínimo

Não migrar e não manter cópia adicional quando o item for:

- duplicado byte a byte ou semanticamente;
- artefato gerado reproduzível;
- workflow temporário ou seletivo preso à auditoria;
- saída de execução sem conclusão exclusiva;
- tentativa falha sem valor diagnóstico residual;
- implementação obsoleta substituída pelo runtime canônico;
- arquivo truncado, incompleto ou criado apenas para transporte.

A decisão de descarte deve constar no inventário para evitar que outro agente reavalie os mesmos arquivos sem contexto.

## 10. Passo a passo recomendado para podar a branch histórica

### Etapa 1 — Congelar a fonte

1. manter a PR #1 em draft e marcada como não mesclar;
2. registrar o head exato de `agent/developer-b-05.18`;
3. registrar o merge-base com `development`;
4. não adicionar novos commits à branch durante a triagem;
5. apontar toda análise para o SHA congelado, não apenas para o nome móvel da branch.

### Etapa 2 — Gerar inventário integral

1. enumerar todos os caminhos exclusivos da branch;
2. agrupar por código, teste, fixture, documentação, screenshot, PDF, JSON, log, workflow e artefato gerado;
3. registrar tamanho, hash e último commit relevante;
4. detectar duplicatas exatas;
5. detectar equivalentes já existentes em `development` com nome ou estrutura diferentes.

Resultado esperado: uma tabela ou JSON versionado de inventário.

### Etapa 3 — Avaliar valor atual

Para cada grupo:

1. identificar a pergunta ou risco que originou o material;
2. verificar se a conclusão ainda é válida;
3. localizar a implementação ou documento canônico atual;
4. classificar como **Aproveitar**, **Registro histórico** ou **Descartar**;
5. justificar a decisão em uma frase objetiva;
6. marcar dependências entre relatório, screenshot, fixture e teste.

### Etapa 4 — Selecionar referências visuais canônicas

Distinguir:

1. referência externa de produto;
2. baseline canônica aprovada;
3. evidência de uma execução de teste;
4. evidência histórica de auditoria.

Migrar somente baselines representativas e estáveis. Evitar séries redundantes de screenshots, capturas intermediárias e imagens que possam ser reproduzidas automaticamente pela CI.

Cada baseline migrada deve indicar:

- referência coberta;
- viewport;
- cenário;
- teste responsável;
- data ou incremento de aprovação;
- condição para atualização futura.

### Etapa 5 — Migrar conteúdo aproveitável

1. criar uma nova branch curta a partir do `development` mais recente;
2. copiar somente os arquivos classificados como Aproveitar;
3. adaptar caminhos e links ao estado canônico;
4. não fazer merge da branch histórica;
5. não importar workflows experimentais;
6. não reintroduzir código já substituído por consolidações 05.25–05.41;
7. adicionar um índice histórico para o material que permanecer apenas referenciado.

### Etapa 6 — Validar a curadoria

Para mudanças exclusivamente documentais:

- validar links e caminhos;
- verificar que todo item migrado possui justificativa;
- confirmar que o handover e o índice apontam para SHAs imutáveis.

Quando houver teste, fixture ou código migrado:

- executar Node/schema/build;
- executar os quatro shards Chromium;
- confirmar paridade entre editor e Authoring Kit quando aplicável;
- impedir aumento acidental dos tipos, capacidades ou schema.

### Etapa 7 — Publicar relatório de encerramento

O relatório deve conter:

- head congelado da branch histórica;
- quantidade de arquivos e commits analisados;
- itens aproveitados e seus novos caminhos;
- itens mantidos apenas no índice histórico;
- grupos descartados e justificativa;
- referências visuais promovidas;
- lacunas que permaneceram sem resposta;
- confirmação de que nenhum código foi integrado por merge da branch histórica.

### Etapa 8 — Encerrar PR e remover branch

Somente depois da integração do relatório de encerramento:

1. confirmar que todos os itens Aproveitar já existem em `development`;
2. confirmar que o índice histórico registra o SHA da branch e os materiais não migrados;
3. revisar a PR #1 pela última vez;
4. fechar a PR #1 como auditoria concluída ou não planejada para merge;
5. excluir `agent/developer-b-05.18`;
6. verificar por readback que a branch não existe mais;
7. manter no repositório canônico o SHA histórico e o número da PR como referências permanentes.

Se o conector disponível não expuser exclusão de branch, executar apenas a etapa final por uma superfície Git autenticada que ofereça remoção de refs. Não mover a branch para outro nome como substituto permanente da poda.

## 11. Testes visuais e referências visuais

O projeto possui muitos testes Chromium distribuídos em quatro shards, mas uma quantidade menor de referências permanentes versionadas.

Essa diferença não é necessariamente falta de cobertura. É resultado de categorias atualmente misturadas:

- testes funcionais de navegador;
- gates geométricos e visuais;
- artefatos temporários de CI;
- baselines canônicas;
- evidências históricas.

A reestruturação documental deve formalizar essas categorias e garantir que evidência relevante não permaneça somente em branch temporária.

## 12. Inconsistências documentais conhecidas

- `docs/ROADMAP.md` ainda marca o 05.31 como em validação, apesar da integração da PR #13;
- `docs/ROADMAP.md` ainda marca o 05.41 como em validação, apesar da integração da PR #23 e da CI aprovada;
- a narrativa de consolidação do backlog precisa alcançar formalmente o estado 05.41;
- a política de referências visuais ainda não está separada da política de testes visuais.

Essas inconsistências não afetam o runtime, mas aumentam o risco de reabrir trabalho concluído.

## 13. Próximo recorte recomendado

### 05.42 — Handover, documentação e triagem histórica

Prioridade:

- P1 operacional e documental;
- posterior somente a correções P0 urgentes;
- anterior a novas consolidações internas sem urgência.

Objetivos:

- publicar este handover;
- corrigir os estados documentais de 05.31 e 05.41;
- sincronizar Roadmap e Backlog;
- inventariar `agent/developer-b-05.18`;
- classificar conteúdo em Aproveitar, Registro histórico e Descartar;
- formalizar a taxonomia de referências visuais;
- migrar evidências canônicas selecionadas;
- publicar relatório de encerramento;
- encerrar a PR #1 e podar a branch histórica;
- podar também as branches de incrementos já integrados quando a superfície Git permitir.

## 14. Frentes que não devem ser reabertas sem decisão explícita

Pausadas ou congeladas:

- documento multipágina;
- balanceamento e repaginação;
- colaboração WebRTC;
- hospedagem e publicação;
- plataforma online;
- touch/mobile completo;
- expansão multimídia;
- novos pipelines de assets;
- locks geométricos persistentes;
- contextualização por IA;
- reescrita integral da aplicação;
- novos tipos sem evidência de intenção exclusiva.

Permanecem em discovery:

- reparenting em Camadas;
- movimentação entre slots;
- drag-and-drop da árvore;
- modelo de sobreposição e empilhamento promocional;
- preview geométrico anterior a todos os commits;
- constraints persistentes;
- regras condicionais avançadas para legendas.

## 15. Autorizações e governança

O usuário já autorizou:

- uso de `development`;
- criação de branches de agente;
- criação e integração de PRs;
- merges por squash após CI aprovada;
- incrementos pequenos de confiabilidade e consolidação;
- sugestão proativa de promoções coerentes para `main`.

Continuam sob aprovação explícita do usuário:

- integração efetiva em `main`;
- expansão significativa do escopo;
- retomada de frentes pausadas ou congeladas;
- mudanças arquiteturais maiores;
- remoção definitiva da branch histórica após a triagem;
- escolha final das evidências visuais promovidas a baseline canônica.

## 16. Instrução curta para retomada

> Continue o projeto a partir de `development@5c4f79df7eadf52e305a9af01930b09249e5bf5f`. A V1 single-page está funcionalmente encerrada. Preserve `CatalogDocument 1.16.0`, 16 tipos, 45 capacidades, nove receitas e o Authoring Kit 1.6.0. Não mescle `agent/developer-b-05.18`. Trate sua revisão como P1: inventarie, classifique o que será aproveitado, apenas registrado ou descartado, migre conteúdo curado por uma branch limpa e só então encerre a PR #1 e pode a branch. O agente pode sugerir uma promoção coerente de `development` para `main`, apresentando delta, gates, riscos e rollback, mas não deve executá-la sem aprovação explícita. Use branch `agent/*`, PR draft para `development`, readback após escritas e Node/build/quatro shards Chromium como gates obrigatórios.
