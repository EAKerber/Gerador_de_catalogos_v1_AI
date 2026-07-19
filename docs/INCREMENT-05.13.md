# Incremento 05.13 — Auditoria subtrativa e governança de recursos

## Objetivo

Interromper a acumulação de opções antes de implementar novas ações, distinguir disponibilidade de prioridade e testar se os controles de layout atuais representam intenções reais ou mecânicas internas.

## Entregas

- governança explícita para as 35 capacidades do manifesto;
- quatro frentes congeladas e critérios estritos de exceção por dívida;
- matriz de intenção versus mecanismo;
- auditoria de autoridade de layout;
- teste comportamental de Auto/Manual, slot e auto-layout;
- ADR de política subtrativa, compatibilidade e depreciação;
- roadmap dividido entre confiabilidade, comandos compostos e interface orientada à tarefa;
- atlas e kit atualizados para publicar governança.

## Resultado

| Estado | Capacidades |
| --- | ---: |
| Ativas | 20 |
| Mantidas | 5 |
| Em auditoria | 5 |
| Congeladas | 4 |
| Pausadas | 1 |

O teste confirmou que:

- Auto restaura overrides de slots descendentes;
- Manual preserva o override ao interromper a recursão naquele contêiner;
- **Reajustar ao slot** e **Reintegrar ao auto-layout** devolvem autoridade ao layout por ramos internos diferentes;
- a UI atual mistura validade estrutural e preservação de exceções.

## Decisões

- a criação manual do zero continua como benchmark, não como fluxo principal;
- PDF continua dentro de fidelidade e confiabilidade;
- expansão multimídia, plataforma online, colaboração, touch/mobile completo e publicação ficam congelados;
- multipágina fica pausada até estabilização do núcleo;
- preservação arquitetônica não obriga preservar toda opção ou implementação;
- nenhuma remoção de schema acontece antes de caminho canônico, migração e janela de compatibilidade.

## Contratos

- `CatalogDocument` permanece em `1.16.0`;
- nenhuma migração foi necessária;
- `CatalogAuthoringKit` passa a `1.5.2`;
- `feature-governance.json` entra no manifesto do kit;
- `feature-inventory.json` passa a publicar status e motivo por capacidade.

## Próximos incrementos

1. 05.14 — confiabilidade estrutural e autoridade de layout;
2. 05.15 — comandos compostos e esquemas reutilizáveis;
3. 05.16 — interface orientada à tarefa e nova medição.

Relatório: `SUBTRACTIVE-FEATURE-AUDIT-05.13.md`.
