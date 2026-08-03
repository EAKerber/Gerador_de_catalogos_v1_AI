# Comece aqui — transição forense da V1

Este é o ponto de entrada canônico para qualquer pessoa ou agente que retome o
repositório depois de 2 de agosto de 2026.

## Estado em uma frase

A V1 está congelada como protótipo técnico após o incremento funcional `05.60`;
o trabalho ativo é uma autópsia documental, sem correções do produto e sem
implementação da V2.

## Ordem de leitura

1. `AGENTS.md` — permissões, proibições e método;
2. `docs/project/STATUS.md` — estado humano atual e próximo passo;
3. `docs/project/CHECKPOINT.json` — o mesmo controle em formato estruturado;
4. `docs/ADR-029-encerramento-v1-e-governanca-forense.md` — decisão aceita;
5. `docs/autopsy/README.md` — método, frentes e gates;
6. `docs/v1/README.md` — índice do patrimônio e da evidência da V1.

Depois dessa leitura, abra somente os documentos históricos necessários à
pergunta em análise. Não percorra todos os incrementos por padrão.

## O que não é mais um ponto de retomada

Os itens abaixo permanecem úteis, mas não descrevem isoladamente o estado
vigente:

- `docs/DEVELOPMENT-HANDOFF-05.58.md` e handovers anteriores;
- a fila ativa descrita no início de `docs/BACKLOG.md`;
- a sequência incremental de `docs/ROADMAP.md`;
- `docs/PRODUCT-DEFINITION.md` como se já fosse especificação da V2;
- `docs/FEATURE-CATALOG.md` e `authoring-kit/feature-governance.json` como se
  capacidades marcadas `active` ainda estivessem autorizadas a evoluir;
- `authoring-kit/GUIDE.md` e `authoring-kit-visual/START-HERE.md` como regras de
  desenvolvimento do repositório.

O Authoring Kit 1.7.2 é um artefato autoral preservado da V1. Ele pode ser
executado em reproduções controladas, mas não deve ser corrigido durante a
autópsia.

## Decisão rápida

| Intenção | Ação vigente |
| --- | --- |
| Corrigir um bug visual da V1 | Registrar/reproduzir; não implementar |
| Melhorar a interface | Converter em evidência e requisito mensurável |
| Propor arquitetura V2 | Comparar como alternativa; não escolher sem gate |
| Criar código V2 | Bloqueado |
| Executar teste existente | Permitido se não mutar o produto |
| Atualizar documento/ADR | Permitido por branch curta |
| Podar branches | Inventariar agora; excluir somente após snapshot autorizado |
| Usar referência visual | Evidência não normativa; nunca fonte de fatos comerciais |

## Continuação segura

Se o chat ou agente atual terminar no meio da tarefa, a continuação deve estar
expressa em `docs/project/STATUS.md`. Se ela não estiver lá, o trabalho não
está formalmente entregue, mesmo que exista em uma conversa ou branch local.

Qualquer divergência entre este arquivo e o checkpoint deve interromper a
execução até os dois serem reconciliados em documentação.
