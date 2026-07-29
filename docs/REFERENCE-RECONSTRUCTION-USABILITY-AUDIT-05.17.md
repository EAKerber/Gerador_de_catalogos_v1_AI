# Reconstrução manual comparável — Incremento 05.17

## Resultado

O catálogo de referência foi reconstruído em Chromium real, viewport 1366×768, usando apenas controles públicos. O ensaio terminou com:

- **157 ações**: 99 cliques, 34 preenchimentos, 11 seleções, 10 confirmações por teclado e 1 download;
- 20 trocas de contexto e 45 mudanças de foco;
- 3 correções, 1 tentativa sem efeito;
- 7 produtos, 7 cards, 16 linhas tabulares, 8 legendas e galerias de 3/5 imagens;
- **zero colisão, zero overflow e zero referência ausente**.

Comparação: 319 ações na linha histórica, 267 no 05.12 e 223 no 05.16. O 05.17 reduz 66 ações frente ao ensaio anterior (−29,6%) e 162 frente à linha histórica (−50,8%).

## O que gerou o ganho

1. Oito legendas cromáticas passaram de formulários repetidos para uma colagem materializada.
2. Galerias de três e cinco imagens passaram a aceitar legenda por linha e sincronização da coleção.
3. Sete caixas diferentes passaram a ser aplicadas por uma grade geométrica atômica, retirando 27 preenchimentos isolados.
4. Especificações ausentes na referência foram removidas em seleção múltipla; o card recalculou o mínimo usando apenas galeria e tabela.

## Leitura crítica

O resultado valida comandos de grupo sem invalidar edição do zero. A maior concentração restante continua em tabelas (36 ações) e conteúdo fino dos cards (28). Não há evidência atual para constraints relacionais persistentes: comandos efêmeros e aplicação atômica encerraram a composição geometricamente válida. Importação binária de várias imagens, preview anterior ao commit e vínculos cromáticos complexos permanecem candidatos, não requisitos confirmados.

## Evidências

`docs/evidence/05.17` contém documento JSON, métricas e log de ações, screenshots do editor/canvas e PDF A4.
