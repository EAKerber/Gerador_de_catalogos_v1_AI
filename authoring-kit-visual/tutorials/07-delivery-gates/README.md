# 07 — Gate de entrega

Quando usar: sempre, depois da última alteração factual ou geométrica.

1. Recompile a mesma fonte e o mesmo plano.
2. Leia `workflow.unresolvedCorrections` e `issues[]`; não interprete as três
   ações de importação como pendências.
3. Audite a árvore materializada, inclusive defaults, contra fatos e decisões
   registrados; mantenha placeholders e omissões explicitamente classificados.
4. Resolva colisão, overflow, clipping e referências ausentes.
5. Importe e faça a revisão visual no editor real. Gate `notRun` continua
   pendente; preview paralelo do agente é diagnóstico, não resultado final.
6. Exporte pacote de rascunho ou publicação conforme a aprovação dos assets e
   reimporte-o para confirmar o round-trip.
7. Gere o PDF a partir do editor e confirme ausência de grid, guias, seleção e
   chrome do editor.

Use `../../troubleshooting/GATES.md` para mapear o código ao reparo.
