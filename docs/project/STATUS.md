# Estado do projeto

- **Atualizado em:** 2026-08-02
- **Fase:** encerramento e autópsia forense da V1
- **Checkpoint de governança:** `05.62`
- **Último incremento funcional:** `05.60`
- **Estado do produto:** protótipo técnico congelado; não aceito como produto
  satisfatório ou pronto para publicação

## Decisão vigente

O usuário aprovou encerrar a evolução funcional da V1 e realizar uma análise
rígida antes de qualquer desenvolvimento posterior. A próxima arquitetura não
é presumida como refatoração: ela poderá reutilizar módulos comprovados, mas o
esqueleto atual precisa justificar sua preservação por evidência.

A decisão completa está em
`docs/ADR-029-encerramento-v1-e-governanca-forense.md`.

## Estado técnico preservado

| Item | Valor |
| --- | --- |
| Base funcional final candidata | `development@e83a8f361b5bdcc9c33136ebebe87454abcb3bb8` |
| Incremento funcional | `05.60` |
| Authoring Kit | `1.7.2` |
| `main` anterior à transição | `050589347e55613182a00ed1e22f6efd2f1a2540` |
| Base integrada da autópsia | `development@efe9c063404910e902b109f340ff2dab7358876e` |
| Branch de arquivo planejada | `archive/v1` — ainda não criada |
| Tag planejada | `v1.0.0-prototype` — ainda não criada |
| Branch documental permanente | nenhuma |

Esses SHAs identificam as bases observadas antes deste checkpoint documental.
Um agente deve confirmar refs remotas antes de qualquer operação Git; não deve
assumir que o SHA deste texto seja o head corrente.

## Por que o desenvolvimento foi congelado

O ensaio em início frio do Authoring Kit 1.7.2 mostrou que os sinais técnicos
de sucesso não predizem adequadamente o resultado visual. Entre os achados que
motivaram a decisão:

- zero colisões/overflows estruturais coexistiu com textos truncados e
  composição visual insuficiente;
- a prévia diagnóstica e o PDF autoritativo do editor formaram duas verdades
  visuais diferentes;
- a política de enquadramento existia no kit, mas as artes foram materializadas
  nos defaults;
- o editor possuía controle de enquadramento, porém o fluxo autoral não fechava
  o ciclo renderizar → medir → corrigir → renderizar;
- correções locais passaram a deslocar problemas entre schema, compilador,
  layout, renderer, editor, kit e testes.

Esses pontos são insumos, não uma autópsia concluída. A procedência e o grau de
confiança serão consolidados no registro de evidências.

## Escopo ativo

Permitido:

- preservar e classificar evidências;
- reproduzir comportamento sem alterar o runtime;
- mapear contratos, dependências e escritores de estado;
- distinguir observação, reprodução, inferência e decisão;
- produzir relatório de encerramento, matriz de disposição, contrato de
  qualidade e comparação arquitetural;
- melhorar somente a documentação e seus testes de consistência.

Bloqueado:

- correções ou funcionalidades na V1;
- Authoring Kit 1.7.3;
- scaffold, implementação ou migração da V2;
- promoção de uma referência visual a golden image;
- promessa de compatibilidade integral com documentos V1;
- poda de refs antes do snapshot final comprovado.

## Unidade 05.62 concluída para revisão

O encerramento factual e a cadeia de evidências foram consolidados sem mudança
de produto:

- `docs/v1/CLOSURE-REPORT.md` reconstrói objetivo, trajetória, resultado e
  motivo formal do congelamento;
- `docs/v1/EVIDENCE-INDEX.md` distingue evidência reproduzida, observada,
  inferida e decidida;
- `docs/v1/KNOWN-FAILURES.md` registra dez falhas com critérios de refutação;
- `docs/v1/PR-LEDGER.md` consolida 48 PRs, CI e refs remotas.

O ensaio cego final ainda não está no repositório. Seus achados permanecem como
`observed`, não `reproduced`, até a ingestão dos pacotes, PDFs e relatórios. As
duas referências anexadas já possuem cópias versionadas com os mesmos hashes e
não foram duplicadas.

O relatório está pronto para revisão, mas o gate
`v1-closure-report-approved` permanece aberto. Produção documental não é
autoaprovação.

## Plano aprovado e gates

1. **Encerramento factual da V1** — consolidar objetivo, resultado, falhas,
   decisões revertidas, testes e evidências.
2. **Matriz de disposição** — classificar cada capacidade/módulo como preservar,
   extrair, reconstruir, descartar ou adiar.
3. **Contrato de qualidade V2** — definir métricas para colisão, overflow,
   truncamento, legibilidade, ocupação, fidelidade e autoridade visual.
4. **Alternativas arquiteturais** — comparar evolução interna, núcleo paralelo
   e reconstrução seletiva, incluindo custo, risco e migração.
5. **Decisão arquitetural** — somente depois dos quatro itens anteriores.
6. **Snapshot e simplificação de refs** — promover a documentação final,
   criar tag/arquivo por readback e só então podar branches elegíveis.
7. **Corte vertical V2** — apenas após autorização explícita posterior.

## Próximo passo exato

Produzir `docs/v1/CAPABILITY-DISPOSITION.md`. A matriz deve avaliar capacidades
e módulos pelo caminho crítico e classificá-los como `preservar`, `extrair`,
`reconstruir`, `descartar`, `adiar` ou `ainda aberta`, sempre com evidência,
dependências, custo de migração e condição de refutação. Não classificar as 51
capacidades em bloco e não presumir compatibilidade de schemas.

Nenhum código do produto deve mudar nessa etapa. Achados novos sobre o
encerramento devem corrigir os documentos 05.62 e manter explícito se foram
observados ou reproduzidos.

## Condição de handoff

Ao terminar uma unidade de análise, atualizar este arquivo e
`CHECKPOINT.json` no mesmo commit. Se o próximo passo acima ainda for o mesmo,
registrar ao menos o novo achado e sua evidência no índice da autópsia.
