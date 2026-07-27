# Incremento 05.21 — orientação contextual determinística

## Decisão

“Contextualização inteligente” não usará IA, modelo remoto/local, classificação probabilística nem geração de conteúdo. A orientação será composta por:

- estado explícito do documento e da sessão;
- intenção/tarefa declarada pelo usuário;
- regras determinísticas, versionadas e inspecionáveis;
- diagnósticos já produzidos pelo editor;
- sugestões autorais que exigem confirmação.

O mesmo estado deve sempre produzir o mesmo foco. Nenhuma opção será ocultada, nenhuma mutação será automática e toda sugestão deverá explicar a regra que a ativou.

## Auditoria técnica

| Frente | Estado confirmado | Estratégia | Risco principal | Gate |
| --- | --- | --- | --- | --- |
| Contexto e seleção | `document-store` já é a fonte única; Camadas, canvas e breadcrumb comandam a mesma transição. | Preservar o store; não criar segundo estado de navegação. | Projeções divergirem visualmente. | Testar a mesma transição nas três superfícies. |
| Breadcrumb | Renderizava toda a hierarquia em uma linha. | Raiz, pai imediato e contexto atual visíveis; miolo condensado em menu. | Ocultar orientação útil. | Profundidade extrema em 1366×768, teclado e título completo. |
| Painéis | Larguras fixas; colapso já existe; zoom fit observa o viewport. | Alças independentes, mínimo igual ao default atual, máximo derivado do canvas e preferência apenas local. | Sufocar o canvas ou restaurar largura inválida. | Dois painéis nos limites em 1366×768 e recálculo do fit. |
| Camadas | Árvore integral, seleção atômica e multisseleção entre irmãos. | Primeiro estados/expansão/foco; depois filtro e intervalo; sem reparent/reordenação neste recorte. | Estado visual ambíguo e foco agressivo. | Canvas, breadcrumb e árvore concordam sem fechar subárvores manuais. |
| Locks | Ausentes; resize pode alterar autoridade de layout. | Centralizar resolução e implementar largura/altura/proporção somente após a auditoria de precedência. | Documento sem solução geométrica. | Conflito explicado, sem mutação parcial ou liberação silenciosa de slot. |
| Grade | Snap e lote existem; normalização explícita não. | Preview determinístico de posição, dimensão ou ambos, numa transação. | Arredondamento alterar fluxo interno. | Mínimos, locks e coordenadas locais respeitados. |
| Orientação contextual | Há ações compatíveis e continuidade por tipo, mas sem ranking formal. | Inventário de sinais → regras declarativas → tarefa explícita → ensaio comparável. | Controles saltarem ou sugestão virar ruído. | Mesmo estado, mesmo foco; “Todas as opções” estável; sem IA. |

## Ordem dos recortes

1. breadcrumb resiliente;
2. painéis redimensionáveis;
3. Camadas como navegação e seleção;
4. precedência geométrica e locks;
5. normalização explícita à grade;
6. inventário e protótipo das regras contextuais.

Cada recorte permanece isolado e não altera o schema `1.16.0` salvo quando uma decisão autoral persistente exigir migração explícita.

## Recorte 1 — breadcrumb

- função pura define quais ancestrais ficam visíveis ou condensados;
- página raiz, pai imediato e contexto atual permanecem disponíveis;
- menu de overflow reutiliza `data-context-id` e a transição canônica;
- nomes completos permanecem em `title`;
- sem quebra, novo estado persistido ou alteração de documento.

## Recorte 2 — painéis

- alça em cada divisória, com mouse e teclado;
- largura padrão do breakpoint atual é o mínimo;
- máximo reserva ao menos 420 px para o workspace;
- preferência fica no navegador e não entra no documento;
- duplo clique ou tecla `Home` restaura o default;
- colapso permanece uma ação independente;
- mudança de largura dispara o cálculo existente de zoom fit.

## Recorte 3 — Camadas

- recolhimento de subárvores é estado efêmero do renderer e não altera documento, seleção ou histórico;
- a transição canônica continua no `document-store`; Camadas apenas a projeta e comanda;
- seleção primária, membros da seleção, ancestrais, descendentes e contexto ativo recebem estados distintos;
- selecionar ou mudar contexto reabre apenas os ancestrais necessários e preserva os demais recolhimentos manuais;
- a seleção primária é revelada e rolada para a área visível somente quando Camadas está aberta;
- busca, seleção por intervalo, reordenação e reparenting permanecem fora deste recorte.

## Evidência

- suíte Node: 89/89;
- build do Authoring Kit: aprovado, 16 tipos e schema `1.16.0`;
- testes Chromium dedicados a breadcrumb, painéis e Camadas incluídos;
- execução Chromium local pendente porque o binário do Playwright não está instalado nesta sessão.

## Continuidade 05.22

A auditoria de precedência foi concluída em
`GEOMETRY-PRECEDENCE-AUDIT-05.22.md`. Ela confirmou que locks não podem ser
adicionados apenas ao `clampFrame`: slots e auto-layout escrevem frames depois
dele, e algumas operações liberam autoridade antes de confirmar que a mudança
é válida.

O próximo recorte será um resolvedor transacional sem locks e sem mudança de
schema. Ele deverá validar o plano completo, incluindo mudanças derivadas e de
autoridade, antes de qualquer mutação.
