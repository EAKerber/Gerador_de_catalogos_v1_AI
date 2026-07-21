# Batch de testes de estresse — Developer B / 05.18

## Objetivo

Este batch não tenta construir um catálogo comercialmente válido.

Ele tenta pressionar simultaneamente as capacidades já existentes para descobrir:

- exceções não tratadas;
- estado corrompido;
- IDs duplicados;
- geometria não finita;
- componentes ausentes no DOM;
- referências de seleção obsoletas;
- divergência entre canvas e impressão;
- falhas de contenção;
- inconsistências de undo/redo;
- limites que falham de maneira silenciosa;
- limites que falham de maneira controlada e compreensível.

O batch é de auditoria. Ele não adiciona novos componentes, schema ou capacidade editorial.

## Escopo

### Domínio e histórico

Arquivo:

```text
tests/stress-domain-history-05.18.test.js
```

O cenário principal materializa uma árvore heterogênea com:

- área de composição em grade extrema;
- textos longos em `wrap`, `ellipsis` e `clip`;
- ícones em 80%, 100% e 120%;
- card alternado entre `hero`, `technical`, `variants`, `data-only` e `standard`;
- frame solicitado com valores negativos, mínimos e excessivos;
- arte com foco fora da faixa;
- tabela recebendo vinte linhas para o limite de doze;
- galeria recebendo trinta itens para o limite de vinte e quatro;
- duplicação em série;
- exclusão parcial;
- reflow com doze colunas, gap zero e padding zero.

Depois da carga, o teste:

1. valida IDs, frames, seleção e schema;
2. desfaz todas as operações do cenário reversível;
3. compara o snapshot ao estado inicial;
4. refaz todas as operações;
5. compara o snapshot ao estado terminal.

### Limite do histórico

Um cenário separado cria 125 entradas independentes.

O comportamento esperado é:

- retenção máxima de 100 entradas;
- 25 operações antigas deixam de ser alcançáveis por undo;
- cem undos levam ao estado com 25 componentes;
- cem redos restauram os 125 componentes.

Isso é registrado como limite conhecido, não como corrupção.

### Coalescência

Vinte edições rápidas no mesmo campo devem formar uma única entrada adicional de histórico.

Undo deve recuperar o valor anterior ao lote; redo deve recuperar o último valor.

### Falhas deliberadas esperadas

O teste tenta provocar e classificar:

- slot já ocupado;
- adição de linha em componente que não é tabela;
- tipo de componente desconhecido;
- inserção automática sem espaço disponível;
- documento com ID duplicado;
- schema futuro;
- frame com dimensão inválida.

Essas situações devem produzir erro ou diagnóstico explícito, sem alterar parcialmente o documento.

## Interface e representação visual

Arquivo:

```text
tests/browser-stress-interface-05.18.test.js
```

O teste usa Chromium real via Playwright em `1366×768`.

A carga inclui:

- página-base inserida pelo botão real da biblioteca;
- doze produtos e doze cards em quatro colunas;
- modos e densidades diferentes na mesma composição;
- galeria saturada em vinte e quatro itens;
- tabela saturada em doze linhas;
- rodapé reduzido para 80 px com títulos e subtítulos muito longos;
- receitas `fact` e `callout`;
- área aninhada reduzida ao mínimo com vinte e quatro filhos;
- seleção alternada oitenta vezes.

### Tempestade de controles

O teste também executa repetidamente:

- recolher e expandir os dois painéis;
- alternar Componentes, Produtos e Camadas;
- buscar termos válidos, inválidos e limpar a busca;
- mudar zoom entre ajuste e valores fixos;
- ligar e desligar grade, snap, smart snap, espaçamento e guias.

### Undo e redo pela interface

São usados dois caminhos reais:

- oito inserções desfeitas e refeitas pelos botões da toolbar;
- quatro edições desfeitas por `Ctrl+Z` e refeitas por `Ctrl+Shift+Z`.

Os snapshots antes e depois precisam ser byte a byte equivalentes, ignorando apenas estado de sessão e timestamp.

### Três projeções visuais

O teste gera métricas e screenshots para:

1. tela em `1366×768`, alvo suportado;
2. mídia de impressão;
3. tela em `1100×650`, abaixo do alvo mínimo.

A projeção abaixo do alvo não exige ausência de pressão visual. Ela serve para documentar como a interface degrada.

## Classificação de resultados

### Bloqueadores

Fazem o teste falhar:

- erro de página;
- erro de console;
- recurso local não carregado;
- frame `NaN`, infinito ou não positivo;
- estilo com `NaN`, `Infinity` ou `undefinedpx`;
- componente no modelo sem representação DOM;
- ID duplicado no DOM;
- seleção apontando para componente removido;
- schema diferente de `1.16.0`;
- canvas ausente;
- divergência do documento após undo/redo;
- filho de `footer-item` escapando da molécula em tela ou impressão;
- overflow horizontal da aplicação no viewport suportado;
- teste que excede o timeout configurado.

### Achados esperados

São registrados, mas não falham automaticamente:

- colisões deliberadas;
- overflow editorial provocado por excesso de conteúdo;
- pais incapazes de crescer porque a página é rígida;
- recorte interno em cenários saturados;
- inserção automática recusada por falta de espaço;
- compressão e scroll no viewport abaixo de `1366×768`.

A auditoria posterior deve decidir se um achado esperado representa comportamento aceitável, melhoria desejável ou bug.

## Evidências produzidas

Cada execução de domínio gera:

```text
domain/stress-domain-<seed>.json
```

Cada execução de Chromium gera:

```text
browser-<seed>/stress-interface-report.json
browser-<seed>/supported-full.png
browser-<seed>/supported-canvas.png
browser-<seed>/supported-print.png
browser-<seed>/undersized-full.png
```

O executor do batch gera:

```text
stress-batch-summary.json
```

## Executor

Arquivo:

```text
tools/run-developer-b-stress.js
```

### Listar o plano

```bash
node tools/run-developer-b-stress.js --list
```

### Executar somente domínio

```bash
node tools/run-developer-b-stress.js --node
```

Esse é o comportamento padrão sem flags.

### Executar somente Chromium

Inicie o servidor:

```bash
python -m http.server 8080
```

Depois:

```bash
node tools/run-developer-b-stress.js --browser
```

### Executar ambos

```bash
node tools/run-developer-b-stress.js --all
```

### Repetir com sementes sequenciais

```bash
node tools/run-developer-b-stress.js --all --repeat=10 --seed=5182026
```

As execuções usarão as sementes `5182026` até `5182035`.

### Limitar a duração

O timeout padrão é de 180000 ms por arquivo de teste. Ele pode ser alterado entre 10000 e 900000 ms:

```bash
node tools/run-developer-b-stress.js --all --timeout=300000
```

Um processo encerrado por timeout é registrado como falha com `timedOut: true` no resumo consolidado.

### Definir diretório de saída

```bash
node tools/run-developer-b-stress.js --all --output=./stress-output
```

### Endereço diferente

```bash
CATALOG_BASE_URL=http://127.0.0.1:9000 node tools/run-developer-b-stress.js --browser
```

## Relação com a regressão comum

`tools/run-developer-b-audit.js` exclui somente os arquivos pesados iniciados por:

- `stress-`;
- `browser-stress-`.

Isso preserva dois fluxos distintos:

- auditoria funcional comum, mais rápida;
- batch de estresse, explicitamente solicitado e potencialmente lento.

O teste leve `tests/developer-b-stress-runner-05.18.test.js` permanece na regressão comum e valida sintaxe, descoberta, flags, timeout e isolamento sem executar a carga pesada.

## Limitações

- As screenshots são evidências para inspeção e métricas de DOM; ainda não existe baseline pixel a pixel aprovado.
- O cenário usa sementes para reprodução, mas a carga principal é deliberadamente estruturada, não um fuzzer irrestrito.
- O teste abaixo de `1366×768` caracteriza degradação; não transforma esse viewport em plataforma oficialmente suportada.
- Chromium e Playwright precisam estar disponíveis na máquina de auditoria.
- O batch foi preparado nesta branch, mas não executado no ambiente do conector GitHub.
