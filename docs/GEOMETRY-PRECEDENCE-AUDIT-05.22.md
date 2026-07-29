# Auditoria 05.22 — precedência e autoridade geométrica

## Escopo

Esta auditoria avalia as rotas que alteram `frame`, mínimos, autoridade de slot/auto-layout, snap e reflow. Ela foi iniciada para avaliar travas de largura, altura e proporção, mas a revisão estratégica posterior concluiu que locks persistentes não possuem benefício comprovado suficiente para a V1. A falha de atomicidade encontrada continua válida e será corrigida independentemente de locks.

## Estado real

Não existe hoje um resolvedor geométrico único. A geometria é decidida em estágios:

1. a interação ou comando produz um frame solicitado;
2. `clampFrame` aplica mínimos, limites do contexto e coordenadas válidas;
3. `updateComponent` grava o frame;
4. contêineres podem executar `ensureContainerMinimum` e `reflowTree`;
5. `layoutSlot` ou `applyAutoLayout` podem substituir frames de descendentes;
6. o store registra apenas a comparação final entre pedido e resultado do componente diretamente atualizado.

As escritas derivadas em filhos e irmãos não passam pelo mesmo relatório de resolução.

## Autoridades confirmadas

| Autoridade | Implementação atual | Alcance | Limite encontrado |
| --- | --- | --- | --- |
| Mínimo técnico/conteúdo | `getReflowMinimum`, `contentMinimum`, `clampFrame` e `ensureContainerMinimum` | Componente solicitado e contêineres recalculados | O mínimo é limitado ao tamanho do contexto; quando não há solução, o resultado pode continuar insuficiente sem diagnóstico de conflito. |
| Slot | `slot.managed`, `layoutSlot` e `reflowTree` | Filho alocado e irmãos do mesmo slot | Reflow escreve frames diretamente e não consulta futuras travas. |
| Auto-layout | `layoutItem.managed`, `applyAutoLayout` e `reflowTree` | Filhos gerenciados e separadores contextuais | Reflow escreve frames diretamente e distribui o espaço após o clamp. |
| Snap/grade | `interactions` e `CatalogLayoutEngine.snapFrame` | Preview do gesto | É assistência anterior ao clamp; não é autoridade persistente. |
| Operação manual | inspector, canvas e comandos em lote | Componente ou seleção | Várias operações liberam slot/auto-layout antes de aplicar o frame. |
| Reflow compatível | `reflow.mode` | Subárvore de contêiner | Continua legível por compatibilidade, mas não é uma autoridade autoral nova. |

## Conflitos reproduzíveis por inspeção

### 1. Liberação antecipada de autoridade

No fim de um gesto, `handlePointerUp` chama `markSlotFree` e/ou `markLayoutFree` antes de `updateComponent`. Se mínimos, limites ou uma futura trava impedirem a mudança, o item ainda assim pode ficar independente.

O mesmo padrão aparece em operações em lote por `releaseBatchLayout`.

**Decisão:** autoridade só será alterada dentro do mesmo commit transacional e depois de a resolução confirmar uma mudança manual aplicável.

### 2. Locks no clamp seriam ultrapassados pelo reflow

Mesmo que `clampFrame` preserve largura ou altura, `layoutSlot`, `applyAutoLayout` e o reflow recursivo escrevem `child.frame` diretamente.

**Decisão:** locks precisam participar das funções que calculam slots e auto-layout, não apenas da entrada manual.

### 3. Ausência de solução não é um estado formal

`clampFrame` reduz o mínimo ao tamanho do contexto com `Math.min(minimum, size)`. Isso evita frames maiores que o pai, mas não distingue:

- pedido ajustado com sucesso;
- mínimo técnico impossível dentro do pai;
- lock incompatível com o espaço;
- slot/auto-layout sem solução.

**Decisão:** a resolução deverá poder retornar `blocked` com motivos estruturados, sem mutação parcial.

### 4. Relatório cobre apenas o alvo direto

`geometryResolutions` compara pedido e resultado do componente atualizado. Alterações derivadas em filhos e irmãos não são registradas.

**Decisão:** uma operação geométrica produzirá um plano com todas as mudanças derivadas antes do commit e um resumo por componente.

### 5. Mínimo recomendado não é autoridade

O mínimo customizado/recomendado é persistido em `constraints.minimums`, mas a geometria obrigatória usa `constraints.minWidth`, `constraints.minHeight` e mínimos calculados. Portanto ele funciona como orientação, não como barreira.

**Decisão:** preservar essa semântica. Locks não reutilizarão o campo de mínimo recomendado.

## Precedência corrigida

A precedência não deve ser entendida como uma lista em que a última regra sobrescreve as anteriores. Ela será dividida em validade, autoridade e assistência:

1. **Validade estrutural**
   - números finitos;
   - mínimo técnico e mínimo calculado dos descendentes;
   - limites do contexto;
   - capacidade e contrato do slot.
2. **Restrições autorais**
   - lock de largura;
   - lock de altura;
   - lock de proporção.
3. **Autoridade de posicionamento**
   - slot gerenciado;
   - auto-layout gerenciado;
   - posição independente.
4. **Assistência**
   - grade;
   - smart snap;
   - sugestão determinística.
5. **Pedido**
   - gesto no canvas;
   - campo do inspetor;
   - comando em lote;
   - ajuste derivado solicitado por apresentação ou conteúdo.

Validade estrutural nunca é violada. Locks restringem as soluções possíveis. Slot ou auto-layout escolhem a solução dentro dessas restrições. Snap modifica apenas o pedido, antes da resolução.

## Estratégia de implementação

### Fase A — resolvedor e plano, sem locks

- introduzir uma função pura que recebe documento/componente, pedido e intenção;
- retornar `requested`, `resolved`, mudanças derivadas, mudanças de autoridade, motivos e estado `applied`, `adjusted` ou `blocked`;
- fazer o commit somente depois de o plano completo ser válido;
- manter adaptadores temporários para `updateComponent`, canvas e operações em lote;
- preservar o schema.

**Benefício:** remove mutações parciais e cria um ponto único para testes.

**Risco:** duplicar temporariamente cálculos de reflow.

**Mitigação:** o plano reutiliza as funções existentes em uma cópia da subárvore; não cria um segundo motor permanente.

### Discovery posterior — locks de largura e altura

- persistir locks apenas depois de definir schema e migração;
- aplicar locks ao alvo e às escritas derivadas de slot/auto-layout;
- um lock não libera autoridade de layout;
- pedido incompatível retorna `blocked`;
- oferecer ação explícita para remover o lock responsável.

**Benefício:** proteção previsível de componentes aprovados.

**Risco:** contêiner sem solução.

**Mitigação:** preview, diagnóstico do componente/lock responsável e ausência de commit parcial.

### Discovery posterior — lock de proporção

- armazenar a proporção capturada no momento da ativação;
- resolver resize por uma dimensão dirigente;
- bloquear quando mínimos, largura, altura e proporção não admitirem solução simultânea.

**Benefício:** preserva arte e peças promocionais durante resize.

**Risco:** ambiguidade sobre qual eixo deve conduzir.

**Mitigação:** handle/campo alterado define o eixo dirigente; mudanças derivadas são mostradas no preview.

## Gates obrigatórios

- gesto bloqueado não altera frame, autoridade nem histórico;
- resize de filho gerenciado não é sobrescrito silenciosamente pelo reflow;
- reflow de pai respeita locks de descendentes ou bloqueia a operação inteira;
- slot com múltiplos ocupantes resolve todos ou não altera nenhum;
- operações em lote geram um único undo;
- mínimos técnicos e conteúdo de tabelas continuam prevalecendo;
- documentos `1.16.0` continuam importáveis antes da migração dos locks;
- as reconstruções das referências técnica e promocional mantêm os gates visuais e geométricos existentes.

## Decisão de avanço

Locks não serão implementados na V1. O recorte executável é a Fase A: resolução transacional sem novo campo persistido e sem mudança visual. Depois dos gates dessa base, o encerramento da V1 prioriza regressões, documentação de limites e redução do backlog.

Uma migração que introduza locks só poderá ser proposta se um ensaio real demonstrar insuficiência de proteção direta efêmera, posição independente, snapshots e undo. A existência da base transacional, isoladamente, não é evidência para promover essa funcionalidade.
