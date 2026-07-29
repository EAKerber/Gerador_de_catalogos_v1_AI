# Auditoria de reconstrução comparável — Editor 05.16

Data: 2026-07-19  
Alvo: mesma página “Fixação e acessórios” da auditoria 05.12  
Viewport: `1366×768`, navegador em 100% e zoom lógico **Ajustar**

## Resultado executivo

A reconstrução manual integral caiu de **267 para 223 ações**, redução de **44 ações (16,5%)** desde 05.12 e de **96 ações (30,1%)** sobre a linha de base de 319. O documento preserva sete produtos, sete cards, dezesseis linhas, galerias de três e cinco imagens, oito legendas cromáticas, JSON e PDF A4.

O ganho veio quase todo do mecanismo certo: esquemas reutilizáveis aplicados em grupo. Tabelas caíram de 82 para 56 ações sem criar um formato de documento paralelo. As exceções editoriais `COR`, `MODELO` e `VALOR À VISTA` foram contadas como edição manual; os presets genéricos preservam `VARIAÇÃO` e `PREÇO`. Continuidade do inspetor removeu reaberturas, mas a geometria exata, as galerias e as legendas continuam sendo trabalho pontual demais.

| Indicador | 05.12 | 05.16 | Variação |
| --- | ---: | ---: | ---: |
| Ações | 267 | 223 | −16,5% |
| Cliques | 138 | 110 | −20,3% |
| Preenchimentos | 93 | 83 | −10,8% |
| Seleções | 35 | 19 | −45,7% |
| Trocas de contexto | 39 | 28 | −28,2% |
| Correções | 29 | 18 | −37,9% |
| Tentativas sem efeito | 7 | 6 | −14,3% |
| Colisões | 8 | 8 | sem ganho |
| Overflows | 2 | 0 | resolvido |

## Esforço por fase

| Fase | 05.12 | 05.16 | Diagnóstico |
| --- | ---: | ---: | --- |
| Fundação | 13 | 13 | Cadastro e criação em lote já são eficientes. |
| Tabelas | 82 | 56 | Esquemas em grupo economizaram 26 ações, contando rótulos específicos. |
| Legendas | 39 | 31 | A continuidade ajuda; criar oito definições ainda exige três ações por valor. |
| Galerias | 36 | 36 | Nenhum ganho: cada imagem ainda exige navegação e edição individual. |
| Apresentações | 10 | 8 | Presets funcionam, mas não asseguram o resultado geométrico final. |
| Geometria | 75 | 67 | Continua sendo o maior custo isolado: 45 preenchimentos exatos e repetição por item. |
| Textos finais | 6 | 6 | Custo coerente com duas edições. |
| Saída | 6 | 6 | JSON e PDF permanecem diretos. |

Tabelas deixaram de ser o maior gargalo. **Geometria + galerias + legendas somam 134 ações (60,1%)** e agora definem o foco.

## Validade e fidelidade

O relatório geométrico terminou com oito colisões e zero overflow. A melhoria de overflow confirma os mínimos internos da dica e das receitas compactas, mas não melhora a intenção global da página:

- duas colisões entre a galeria e especificações do card 04;
- duas colisões entre especificações e tabela do card 07;
- duas colisões do hero com cards secundários;
- uma colisão do card 07 com a chamada de dica;
- uma colisão do conteúdo principal com o rodapé.

As seis tentativas sem efeito permanecem concentradas na seleção de descendentes após mudanças de contexto. A árvore consegue corrigir o caminho, mas ainda cobra três ações — tentativa, entrada no pai e repetição — em vez de cumprir o contrato de seleção contextual em um clique.

## Meta-análise e decisão subtrativa

O ensaio reduz viés de novidade ao manter o mesmo alvo, o mesmo roteiro e o mesmo critério de contagem. Também evita atribuir à continuidade o ganho da receita focal de nove ações: essa receita não substituiu a construção completa neste protocolo.

Evidências suportam quatro decisões, sem justificar remoção de capacidades persistidas:

1. **Manter esquemas de tabela em grupo.** É uma abstração reutilizável e respondeu por 26 das 44 ações economizadas, sem contaminar o preset genérico com rótulos desta referência.
2. **Não ampliar controles de frame individuais.** Eles são um escape hatch; o fluxo principal precisa de operações de composição e distribuição em grupo.
3. **Fundir navegação contextual e seleção.** “Entrar no pai” não representa uma intenção editorial exclusiva e deve deixar de ser uma etapa manual obrigatória.
4. **Transformar legendas e galerias em edição de coleção.** O usuário deve poder colar/adicionar vários valores e depois refinar exceções, preservando os itens canônicos atuais.

Não há evidência para remover separadores, mínimos, autoridade gerenciada/independente, presets ou edição exata. Há evidência para ocultar geometria exata do caminho normal e consolidar comandos redundantes na superfície orientada à tarefa.

## Próximo foco recomendado

1. corrigir seleção contextual para zero tentativas sem efeito;
2. adicionar ações de grupo para distribuir, alinhar e dimensionar uma seleção no mesmo contexto;
3. fornecer edição em lote para legendas e legendas de galeria;
4. fazer presets/receitas reservarem espaço pelos mínimos resolvidos dos filhos;
5. repetir o benchmark somente depois dessas quatro mudanças.

O critério do próximo ciclo não deve ser apenas menos ações: o mesmo documento precisa terminar com **zero colisão e zero overflow**, sem perder edição individual.

## Evidências

- `docs/evidence/05.16/reference-manual.metrics.json` — 223 ações e relatório geométrico;
- `docs/evidence/05.16/reference-manual.document.json` — documento exportado;
- `docs/evidence/05.16/reference-manual.editor.png` e `.canvas.png` — estado visual;
- `docs/evidence/05.16/reference-manual.pdf` — PDF A4 produzido.
