# ADR-026 — Autoridade local de layout e geometria resolvida

**Status:** aceita no Incremento 05.14.

## Contexto

O editor expunha Auto/Manual no contêiner, `slot.managed`, `layoutItem.managed` e dois comandos de reajuste. No modo Auto, o reflow reativava silenciosamente exceções descendentes; no Manual, preservava a exceção interrompendo também garantias estruturais da subárvore. O usuário precisava compreender a implementação para prever o resultado.

## Decisão

- a autoridade normal passa a ser local ao item: **Gerenciado pelo layout** ou **Posição independente**;
- arrastar ou editar a geometria de um item gerenciado cria uma exceção local durável;
- **Reintegrar ao layout** é a única intenção pública para devolver autoridade ao pai, seja o mecanismo interno slot ou auto-layout;
- o reflow continua recursivo para validade e mínimos, mas não altera `managed: false`;
- `reflow.mode: manual` continua legível como compatibilidade de documentos 1.16.0, sem ser oferecido como controle normal;
- todo commit de frame registra, em memória, geometria solicitada, geometria aplicada e motivos. O registro é feedback de sessão e não altera o schema.

## Consequências

Documentos existentes permanecem válidos e não exigem migração. A interface perde uma decisão global ambígua, exceções locais sobrevivem a mudanças em pais e irmãos, e restrições deixam de parecer falhas silenciosas. Uma futura remoção de `reflow.mode` exige versão de schema e migração separadas.
