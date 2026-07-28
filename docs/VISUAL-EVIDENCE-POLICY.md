# Política de referências e evidências visuais

## Objetivo

Separar cobertura funcional, invariantes geométricas, artefatos de execução e
baselines permanentes. Uma suíte Chromium numerosa não implica que cada teste
deva versionar uma imagem.

## Categorias

### 1. Referência externa de produto

Material recebido para orientar linguagem editorial ou cobertura, como
`docs/reference/catalogo-base.jpeg`.

Não é resultado do editor nem baseline de regressão. Deve registrar origem,
papel no escopo e se é critério canônico ou somente benchmark.

No estado atual:

- a primeira referência é o critério canônico da V1;
- a segunda referência promocional é benchmark pós-V1;
- nenhuma referência externa autoriza reprodução pixel a pixel ou novos tipos
  sem evidência de intenção exclusiva.

### 2. Baseline canônica

Saída estável, aprovada explicitamente e versionada para detectar regressão
visual que não possa ser expressa com contratos semânticos ou geométricos.

Toda baseline deve declarar:

- referência coberta;
- viewport e escala;
- cenário e fixture;
- teste responsável;
- data ou incremento de aprovação;
- tolerância ou método de comparação;
- condição para atualização;
- aprovador ou decisão documental correspondente.

Uma captura não vira baseline por estar no repositório ou num artefato de CI.

### 3. Evidência de execução

Screenshot, PDF, JSON de métricas ou log produzido por uma execução específica.
Serve para diagnosticar e comprovar um gate, mas pode ser reproduzível e
efêmero.

Por padrão:

- permanece no artefato da CI com retenção definida;
- o relatório registra run, job, cenário, resultado e digest quando relevante;
- não é copiada para `development` se a conclusão já está documentada;
- não é usada como golden image sem promoção explícita.

### 4. Evidência histórica de auditoria

Material ligado a uma branch, SHA ou investigação encerrada. Seu valor está na
conclusão e na rastreabilidade, não necessariamente nos bytes.

Quando o arquivo bruto não for migrado, o índice histórico deve preservar:

- título e categoria;
- caminho e SHA de origem;
- conclusão relevante;
- substituto canônico;
- decisão de descarte ou retenção.

### 5. Artefato gerado reproduzível

Bundle, relatório intermediário, screenshot repetida, saída de runner ou
resultado reconstruível por ferramenta canônica. Deve ser descartado da branch
operacional quando não contém conclusão exclusiva.

## Escolha do tipo de teste

Preferir:

- contratos Node para schema, manifesto, ordem, paridade e transformação;
- Chromium funcional para interação, histórico, importação e impressão;
- invariantes geométricas para contenção, colisão, overflow e posição relativa;
- métricas editoriais para esforço e cobertura;
- baseline visual somente quando diferenças de pixels representam risco real
  não capturado pelas camadas anteriores.

## Promoção e atualização

A promoção de uma imagem a baseline e sua substituição futura exigem decisão
explícita. A mudança deve explicar a causa visual e provar que não apenas aceitou
uma regressão.

Nenhuma captura de `agent/developer-b-05.18` foi promovida durante a auditoria
05.43. As 16 capturas exclusivas eram quatro imagens repetidas em quatro runs e
o protocolo original declarava ausência de baseline pixel a pixel aprovada.
