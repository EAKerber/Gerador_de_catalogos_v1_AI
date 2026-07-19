# ADR-025 — Governança subtrativa e autoridade de layout

## Status

Aceita no Incremento 05.13.

## Contexto

O editor acumulou caminhos de inserção, repetição, posicionamento, reflow, apresentação e legenda ao longo de incrementos orientados por cobertura. A auditoria manual 05.12 demonstrou profundidade suficiente, mas também 267 ações, 29 correções, 7 tentativas sem efeito, 8 colisões e 2 overflows.

Preservar toda opção por já possuir código, schema ou testes passou a representar risco maior do que a ausência de novos controles. Em particular, o layout expõe simultaneamente:

- `reflow.mode` Auto/Manual;
- `slot.managed`;
- `layoutItem.managed`;
- **Reajustar ao slot**;
- **Reintegrar ao auto-layout**;
- **Aplicar auto-layout**;
- frames exatos e arraste que criam overrides.

O teste `subtractive-layout-authority.test.js` confirmou que Auto reintegra silenciosamente overrides descendentes, enquanto Manual preserva os overrides ao custo de interromper garantias recursivas. O controle mistura validade estrutural e autoridade de edição.

## Decisão

### 1. Preservação não significa acumulação

Preservar arquitetura significa preservar dados, contratos e decisões ainda válidas. Interface, vocabulário e implementação podem ser fundidos, ocultados, depreciados ou removidos quando não representarem uma intenção distinta.

### 2. Ciclo de vida explícito

Cada capacidade recebe um dos estados `active`, `maintain`, `audit`, `frozen` ou `paused` em `authoring-kit/feature-governance.json`.

- **active:** evolução permitida no foco atual;
- **maintain:** compatibilidade e correções, sem expansão;
- **audit:** utilidade existente, mas mecanismo ou acesso precisa ser simplificado;
- **frozen:** somente guardrails contra dívida ou regressão;
- **paused:** depende da estabilização do núcleo.

### 3. Foco atual

O desenvolvimento ativo prioriza usabilidade, fidelidade e confiabilidade. Expansão multimídia, plataforma online, colaboração, touch/mobile completo e workflow de publicação ficam congelados. PDF permanece saída de fidelidade, não plataforma de publicação.

### 4. Criação manual como benchmark

Criar um catálogo do zero permanece possível como benchmark integrado e escape hatch. O fluxo principal continua data-first: agente/compilador criam a base e a edição manual corrige ou excepcionaliza. Métricas de geração, criação manual e refinamento de uma saída gerada permanecem separadas.

### 5. Autoridade de layout alvo

O vocabulário futuro deve convergir para:

- **Gerenciado pelo layout:** o sistema mantém estrutura válida e reflow determinístico;
- **Posição independente:** override local, explícito e durável;
- **Reintegrar ao layout:** remove o override e devolve autoridade ao sistema.

Recursão é responsabilidade interna. Exceções locais não devem exigir desativar garantias de uma subárvore inteira. `reflow.mode` continua aceito no schema 1.16.0 durante a janela de compatibilidade; nenhuma migração é feita neste incremento.

### 6. Ações compostas compartilhadas

Operações amplas devem ser comandos semânticos usados por UI, histórico, compilador e kit do agente. Elas precisam ser contextuais, delimitadas, reversíveis, auditáveis, materializadas em componentes normais e incapazes de alterar fatos comerciais implicitamente.

### 7. Remoção em duas etapas

1. definir intenção e caminho canônico;
2. rebaixar ou retirar a alternativa da UI;
3. continuar importando documentos anteriores;
4. parar de gerar o campo depreciado quando houver migração segura;
5. migrar testes para o resultado preservado;
6. remover a implementação somente após a janela de compatibilidade.

## Consequências

- novos controles precisam justificar resultado exclusivo;
- testes deixam de proteger mecanismos redundantes e passam a proteger intenção e resultado;
- o atlas publica governança além de disponibilidade;
- os incrementos de confiabilidade podem remover UI sem remover documentos antigos;
- ações de grupo não devem formar um segundo motor de layout;
- multipágina permanece pausada até layout e reflow ficarem previsíveis.

## Alternativas rejeitadas

- continuar adicionando opções sem inventário de sobreposição;
- remover campos imediatamente com quebra de documentos antigos;
- tornar o editor um canvas livre e abandonar garantias estruturais;
- ocultar toda profundidade avançada sem escape hatch;
- tratar a contagem de cliques como único critério de sucesso.
