# Incremento 05.20 — Linguagem promocional e integração multirreferência

## Objetivo

Generalizar a biblioteca para catálogos técnicos e promocionais sem transformar uma referência isolada em novos tipos de componente. O incremento preserva os dezesseis tipos, usa papéis semânticos, tokens e receitas editáveis e submete as duas linguagens editoriais a gates de navegador separados.

## Capacidades integradas

- biblioteca organizada por intenção, mantendo infraestrutura no caminho avançado;
- texto com alinhamento, escala discreta e overflow explícito;
- escalas internas de ícone e especificação;
- modos `standard`, `hero`, `technical`, `variants` e `data-only` geometricamente distintos;
- famílias iconográficas técnicas e comerciais com metadados de descoberta;
- receitas `section-heading`, `fact`, `section-tip-callout`, `commerce-price-block` e `commerce-offer-unit`;
- tokens promocionais semânticos;
- ativos reais com proveniência, exportação, reimportação e hashes preservados;
- preços comerciais nativos e editáveis, sem conversão para tabela.

`CatalogDocument` permanece em `1.16.0`, `CatalogAuthoringKit` em `1.6.0` e o registro continua com dezesseis tipos.

## Curadoria da integração

A linha de integração parte de `development` e incorpora somente código, testes, fixtures necessárias e documentação canônica. Workflows experimentais, imagens de auditoria duplicadas e o histórico operacional das branches paralelas não fazem parte do produto.

Correções pré-merge:

- contratos históricos passaram a aceitar a versão final das receitas;
- redimensionar o rodapé até 80 px atualiza também os slots dos `footer-item`;
- a inicialização carrega contratos estaticamente, em ordem determinística, e não abre o editor com runtime parcial;
- o bloco de preço preserva proporções distintas para moeda e valor;
- o gate promocional reprova reticências ou clipping do valor em tela e impressão;
- build e inventário promocional foram incorporados ao `build-authoring-kit.js`;
- um runner descobre toda a suíte, sem filtro por número de incremento;
- o workflow de integração é somente leitura, usa Playwright fixado e não faz commit ou push automático.

## Gates das referências

### Catálogo técnico

- reconstrução manual comparável;
- zero colisão e zero overflow;
- screenshot de editor e canvas;
- PDF A4 com fundo e linhas físicas;
- exportação JSON.

### Catálogo promocional

- quatro ofertas independentes e quatro blocos de preço;
- valores `3,99`, `4,99`, `5,99` e `6,99` completos;
- moeda e valor sem clipping em tela e impressão;
- assets reais sem placeholders finais;
- zero colisão, overflow ou referência obrigatória ausente;
- pacote portátil, reimportação, undo e redo equivalentes.

O gate visual remoto é bloqueante. A integração não deve ser mesclada enquanto os jobs Node e Chromium não estiverem verdes.

## Decisões subtrativas

Não criar novos tipos para preço, selo, calendário, personagem, megafone, desenho técnico, QR code ou caixa promocional. Elementos gráficos permanecem `art`; hierarquia e valores editáveis usam receitas e tokens.

O antigo carregamento dinâmico deixou de ser um risco de inicialização parcial. A incorporação gradual dos contratos incrementais aos módulos canônicos continua como dívida de manutenção, mas só deve ocorrer em recortes separados, preservando os mesmos gates e sem misturar refatoração com novas capacidades.

## Critério de merge

1. build idempotente e derivados versionados;
2. suíte Node integral verde;
3. suíte Chromium integral verde no runtime publicado;
4. gates técnico e promocional aprovados;
5. diff sem evidências duplicadas ou workflows com escrita;
6. PR draft contra `development`, sem tocar em `main`;
7. revisão explícita antes do merge.
