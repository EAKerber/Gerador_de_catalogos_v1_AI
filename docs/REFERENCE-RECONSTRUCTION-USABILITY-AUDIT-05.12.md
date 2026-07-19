# Auditoria de reconstrução da referência — Editor 05.12

Data: 2026-07-19  
Alvo: catálogo “Fixação e acessórios” fornecido pelo usuário  
Viewport: `1366×768`, zoom do navegador em 100% e zoom lógico **Ajustar**  
Escopo: medir o fluxo manual atual; nenhuma otimização do editor foi implementada durante o ensaio.

## Resultado executivo

A reconstrução manual caiu de **319 para 267 ações**, redução de **52 ações (16,3%)**. Os ganhos fortes de cadastro em lote e receitas oficiais são reais, mas representam apenas o começo do fluxo. Configurar esquemas de tabela e posicionar a composição continuam dominando o trabalho.

O documento final contém 7 produtos, 7 cards, 16 linhas comerciais, galerias de 3 e 5 imagens, 8 legendas cromáticas e 97 componentes. O JSON usa `CatalogDocument 1.16.0`; o PDF possui uma página A4. Apesar disso, o gate geométrico encontrou **8 colisões e 2 overflows**, e a impressão preservou um aviso transitório do editor.

| Indicador | 05.4 | 05.12 | Variação |
| --- | ---: | ---: | ---: |
| Ações manuais | 319 | 267 | −16,3% |
| Cliques | 184 | 138 | −25,0% |
| Preenchimentos | 122 | 93 | −23,8% |
| Seleções em controles | 3 | 35 | +1.066,7% |
| Arrastes | 9 | 0 | −100% |
| Download | 1 | 1 | — |
| Trocas de contexto | não isoladas | 39 | nova métrica |
| Mudanças de foco de componente | não isoladas | 43 | nova métrica |
| Correções de fluxo | não isoladas | 29 | nova métrica |
| Tentativas sem efeito | 0 | 7 | regressão observável |
| Colisões | não diagnosticadas | 8 | agora detectadas |
| Overflows | não diagnosticados | 2 | agora detectados |
| Cobertura estrutural | 56% | 65% | +9 p.p. |

O aumento de seleções não indica perda absoluta: vários preenchimentos repetidos foram substituídos por escolhas semânticas. Ainda assim, a migração de custo para menus e disclosures mostra que a informação continua fragmentada.

## Método

O ensaio foi executado em Chromium real pelo teste `tests/browser-reference-manual-audit.test.js`. Toda mudança do documento ocorreu por controles públicos:

- clique em receita, componente, camada, aba ou comando;
- preenchimento de input/textarea;
- seleção de opção;
- navegação por breadcrumb;
- exportação JSON e comando **Imprimir / PDF**.

O estado interno foi lido somente para conferir IDs após ações, verificar se a seleção realmente mudou e coletar o relatório final. Quando um clique em Camadas não alterou a seleção, a tentativa foi registrada como sem efeito; o roteiro entrou no contêiner pai pela árvore e repetiu a ação.

O tempo automatizado não é estimativa de tempo humano. A métrica útil é a quantidade, a distribuição e a necessidade de correção das ações.

Uma execução completa anterior registrou 268 ações. Na execução canônica final, a seção de colunas permaneceu aberta e dispensou um clique de reabertura, resultando em 267. A faixa observada é, portanto, **267–268 ações**; o documento, as colisões, os overflows e todas as demais métricas permaneceram iguais. A variação confirma que disclosures ainda carregam estado transitório entre tarefas.

## Distribuição do esforço

| Fase | Ações | Parcela | Composição | Diagnóstico |
| --- | ---: | ---: | --- | --- |
| Tabelas | 82 | 30,7% | 36 cliques, 27 preenchimentos, 19 seleções | Cada tabela repete estrutura de colunas, papéis e disclosure antes da colagem em lote. |
| Geometria | 75 | 28,1% | 29 cliques, 45 preenchimentos, 1 seleção | **Avançado** reabre por componente; ajustes verticais não permaneceram como solicitados. |
| Legendas | 39 | 14,6% | 19 cliques, 9 preenchimentos, 11 seleções | O editor fecha a seção após materializar cada definição; o grupo precisa ser reorganizado manualmente. |
| Galerias | 36 | 13,5% | 28 cliques, 8 preenchimentos | Legendas por imagem funcionam, mas navegar entre imagens exige entrar novamente no pai. |
| Fundação | 13 | 4,9% | 11 cliques, 2 preenchimentos | Receita de página + colagem de sete produtos + cards confirmam o ganho dos incrementos 05.6/05.8. |
| Apresentações | 10 | 3,7% | 6 cliques, 4 seleções | Presets reduzem decisões, mas não asseguram geometria interna válida. |
| Textos finais | 6 | 2,2% | 4 cliques, 2 preenchimentos | Conteúdo simples; ainda sofre custo de contexto. |
| Saída | 6 | 2,2% | 5 cliques, 1 download | JSON e PDF são acessíveis, porém PDF não bloqueia composição inválida. |

Somente **Tabelas + Geometria** consomem 157 ações, ou 58,8% do ensaio. Esse é o principal dado de priorização.

## Resultado representado

Foi possível materializar:

- página A4 com cabeçalho e rodapé compostos;
- 7 produtos vinculados e numerados;
- hero pretendido e seis cards secundários;
- 16 linhas comerciais em três esquemas de coluna;
- galerias de 3 e 5 imagens, com uma legenda por imagem;
- 8 definições cromáticas, painel em grupos e 2 células vinculadas;
- callout de dica com ícone, título e corpo;
- JSON exportado e PDF A4 de uma página.

Não foi possível obter, pelo fluxo manual atual, uma composição final válida e fiel sem outra rodada extensa de correções.

## Cobertura da referência

Pontuação: `11 / 17 = 64,7%`, arredondada para **65%**. A pontuação mede capacidade de representação, não similaridade de pixels; assets novos continuam fora do escopo.

| Capacidade observada | Cobertura | Evidência 05.12 | Limite |
| --- | --- | --- | --- |
| Página A4 e PDF | Parcial | PDF A4 de uma página | Imprime composição inválida e toast transitório. |
| Cabeçalho com logo, título e linhas | Parcial | Estrutura pronta e linha física | Zona direita não aceita a composição de aplicações/desenho. |
| Aplicações e desenho no cabeçalho | Ausente | Receita existe separadamente | Não há slot/modo integrado e seguro no cabeçalho. |
| Card principal em destaque | Parcial | Preset hero aplicado | Posição vertical foi restaurada e o hero ficou atrás dos cards 02/03. |
| Grade secundária 3×2 | Parcial | Três colunas cabem tecnicamente | Ordem/linhas finais divergem após ajustes exatos. |
| Numeração e títulos | Suficiente | Cards 01–07 vinculados | Títulos longos ainda truncam. |
| Arte simples | Parcial | Slots e placeholders corretos | Assets foram omitidos conforme escopo. |
| Galeria com legenda individual | Suficiente | 3 imagens no 04; 5 no 07 | Galeria colide com especificações em ambos os cards. |
| Especificações com ícone | Suficiente | Duas por card | Textos truncam em densidade compacta. |
| Tabelas com linhas variáveis | Suficiente | 1–5 linhas, total 16 | Altura afeta empacotamento. |
| Esquemas de coluna distintos | Suficiente | medida, cor, modelo e valor unitário | Configuração precisa ser repetida em cada tabela. |
| Células e legenda cromática vinculadas | Suficiente | 8 definições; 2 vínculos reais | Tokens `pack.500` e `pack.300` têm baixo contraste. |
| Modos/presets de card | Parcial | hero, padrão e variações | Preset não garante ausência de colisão interna. |
| Aplicações sob cards | Ausente | Dados semânticos foram cadastrados | Não há apresentação contextual no card. |
| Legenda global de embalagens | Suficiente | Painel hierárquico com 8 itens | Precisa de grade manual e ocupa área alta. |
| Callout/dica | Parcial | Receita e conteúdo corretos | Filhos ultrapassam 78 px ao estreitar a receita. |
| Rodapé | Parcial | Itens compostos e PDF | Conteúdo principal invade 45 px do rodapé. |

## Problemas confirmados

### P1 — Geometria exata não preserva a intenção vertical

Foram informados `x`, `y`, largura e altura para 12 componentes. Valores horizontais foram majoritariamente aplicados, enquanto `y`/altura permaneceram ou voltaram para a geometria anterior em cards, legenda, callout, estrutura raiz e rodapé.

Exemplos:

| Componente | Solicitado | Observado |
| --- | --- | --- |
| Card 02 | `y 234`, `240×246` | `y 8`, `240×237` |
| Card 04 | `y 234`, `242×246` | `y 257`, `242×257` |
| Card 07 | `y 492`, `242×286` | `y 525`, `242×297` |
| Legenda | `y 790`, `500×120` | `y 525`, `500×297` |
| Dica | `y 790`, `236×120` | `y 525`, `236×297` |
| Rodapé | `y 1020`, altura `80` | `y 975`, altura `100` |

O editor não distingue claramente “valor rejeitado”, “valor limitado” e “valor posteriormente refeito por reflow”. Isso impede confiar no modo Exato/Avançado.

### P1 — Seleção de camada fora do contexto pode não produzir efeito

Houve 7 tentativas sem efeito. O clique visualmente válido manteve a seleção anterior até que o usuário entrasse no contêiner pai e repetisse a ação. O problema apareceu em tabela, imagens de galeria, rodapé e corpo da dica.

### P1 — Esquemas de tabela não são reutilizáveis

As linhas em lote funcionam, mas 82 ações foram necessárias para sete tabelas porque rótulos e papéis de coluna são reconfigurados individualmente. Não existe preset de esquema, aplicação em lote ou “usar o esquema desta tabela nas selecionadas”.

### P1 — O gate existe, mas não protege Imprimir / PDF

O relatório detectou 8 colisões e 2 overflows, porém o comando de impressão continuou. A saída inclui:

- hero atrás dos cards 02/03;
- galerias sobre especificações;
- card 07 sobre a dica;
- conteúdo sobre o rodapé;
- dois textos da dica fora do pai;
- toast “No diálogo do navegador…” impresso na página.

### P2 — Divulgação progressiva perde continuidade

Foram necessários 13 cliques apenas para reabrir **Avançado** ao trocar o componente. O editor de legenda também precisou ser reaberto após cada materialização. A profundidade está corretamente escondida no início, mas não existe persistência de intenção durante uma tarefa repetida.

### P2 — Preset de variações não é geometricamente seguro

As galerias de 3 e 5 itens foram representadas, mas colidiram com as duas especificações dos cards. O preset deve reservar área pelo número de imagens ou propor um modo alternativo.

### P2 — Receita de dica não responde à largura técnica

Ao ajustar o callout para 236 px, título e corpo preservaram o frame largo e ultrapassaram 78 px. O mínimo do contêiner não representa a geometria interna final.

### P3 — Contraste de dois tokens de embalagem

`pack.500` e `pack.300` ficaram em aproximadamente `1,14:1` contra o papel. O vínculo semântico funciona, mas a amostra visual precisa de borda, padrão ou token mais distinto.

## Comparação com o fluxo automatizado

| Fluxo | Ações | Resultado geométrico |
| --- | ---: | --- |
| `CatalogSource` → compilador | 3 | 0 colisões, 0 overflows |
| Construção manual 05.12 | 267 | 8 colisões, 2 overflows |

Os números não devem ser combinados. A geração automatizada atende ao objetivo principal data-first; a construção manual continua sendo o fluxo de exceção e refinamento. A diferença mostra que o editor ainda não traduz bem uma intenção de página para operações manuais compostas.

## Decisão de priorização

O próximo pacote de redução de ações deve atacar, nesta ordem:

1. **estabilidade da geometria e feedback de commit** — o valor aplicado precisa permanecer ou explicar por que foi alterado;
2. **seleção contextual previsível** — Camadas deve navegar ao contexto correto ou explicar o bloqueio, sem clique silencioso;
3. **presets reutilizáveis de tabela** — esquema semântico aplicável a uma seleção de tabelas, separado dos valores;
4. **receita editorial hero + grade + faixa final** — materializar a intenção de página e permitir refinamento, em vez de 75 ações de frame;
5. **persistência de tarefa do inspetor** — manter Avançado/disclosures enquanto o usuário repete a mesma operação;
6. **gate antes de PDF** — bloquear ou exigir confirmação explícita com resumo de colisões/overflows; chrome transitório nunca deve imprimir;
7. **layout responsivo de galeria, dica e legenda** — mínimos derivados dos filhos e alternativas de densidade.

Hospedagem estática permanece válida como Incremento 05.13 porque não modifica o runtime e permite avaliação externa reproduzível. O primeiro incremento de resposta à auditoria será o 05.14.

## Evidências

- `docs/evidence/05.12/reference-manual.metrics.json` — log das 267 ações e relatório geométrico;
- `docs/evidence/05.12/reference-manual.document.json` — documento exportado;
- `docs/evidence/05.12/reference-manual.editor.png` — interface completa em 1366×768;
- `docs/evidence/05.12/reference-manual.canvas.png` — canvas com painéis recolhidos;
- `docs/evidence/05.12/reference-manual.pdf` — PDF A4 produzido no ensaio.
