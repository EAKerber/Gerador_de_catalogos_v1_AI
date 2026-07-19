# Handoff de desenvolvimento — Incremento 05.13

**Status:** auditoria e governança concluídas; nenhuma opção foi removida do runtime.

## Linha de base

- editor: Incremento 05.13;
- schema: `CatalogDocument 1.16.0`;
- kit: `CatalogAuthoringKit 1.5.2`;
- capacidades: 35 com governança completa;
- frentes congeladas: multimídia, plataforma online, touch/mobile completo e publicação;
- multipágina: pausada;
- benchmark manual: evidência 05.12 preservada em 267 ações.

## Achado crítico

`reflow.mode`, `slot.managed` e `layoutItem.managed` formam autoridades concorrentes. Auto restaura overrides descendentes; Manual preserva exceções desligando a recursão do contêiner. Os botões de reajuste convergem conceitualmente para **Reintegrar ao layout**, embora usem ramos internos distintos.

## Regra do 05.14

- não remover `reflow.mode` do schema ainda;
- introduzir autoridade gerenciada/independente sem duplicar o motor;
- fazer overrides locais sobreviverem ao reflow do ancestral;
- expor geometria solicitada, resolvida e motivo;
- migrar testes para intenção e resultado;
- somente depois retirar/rebaixar controles redundantes da UI;
- preservar importação de documentos 1.16.0.

## Arquivos canônicos

- `ADR-025-governanca-subtrativa-e-autoridade-de-layout.md`;
- `SUBTRACTIVE-FEATURE-AUDIT-05.13.md`;
- `authoring-kit/feature-governance.json`;
- `tests/subtractive-layout-authority.test.js`.

## Teste focal

```bash
node tests/subtractive-layout-authority.test.js
```

Esse teste descreve a sobreposição atual. No 05.14 ele deve ser substituído por um contrato em que validade recursiva e override local coexistam.
