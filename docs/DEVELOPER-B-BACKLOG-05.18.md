# Developer B — revisão operacional do backlog 05.18

## Finalidade

Este documento define uma ordem de execução alternativa para a branch `agent/developer-b-05.18`.

Ele **não substitui** `docs/BACKLOG.md`, `docs/ROADMAP.md` nem `docs/INCREMENT-05.18.md`. Os itens, decisões de produto e restrições continuam sendo os mesmos. A mudança está somente em:

- prioridade operacional;
- tamanho das fatias;
- sequência de validação;
- critérios de interrupção;
- quantidade de superfícies alteradas por incremento.

A revisão existe para testar continuidade de desenvolvimento com um modelo de menor capacidade, reduzindo o custo de uma decisão equivocada e tornando regressões mais fáceis de localizar.

## Estado de partida

- base: `development` no Incremento 05.18;
- branch de trabalho: `agent/developer-b-05.18`;
- `CatalogDocument`: `1.16.0`;
- `CatalogAuthoringKit`: `1.6.0`;
- checkpoint 1 do 05.18 já materializado;
- dezesseis tipos de componente preservados;
- texto, escala interna de ícones/especificações e modos de card já possuem implementação inicial;
- `section-heading` e `fact` continuam apenas como candidatas;
- `callout` permanece receita;
- não há autorização para merge a partir desta branch.

## Princípios de segurança

### S1 — Uma responsabilidade por incremento

Cada incremento deve alterar apenas uma família principal:

- validação;
- texto;
- ícone/especificação;
- um modo de card;
- descoberta da biblioteca;
- um lote de iconografia;
- uma candidata a componente.

Mudanças auxiliares são aceitas somente quando necessárias para testar ou documentar a responsabilidade principal.

### S2 — Primeiro observar, depois corrigir

Nenhuma ampliação deve começar antes de existir uma matriz reproduzível do comportamento atual. Quando a implementação já existe, o primeiro trabalho é provar equivalência entre:

- canvas;
- inspetor;
- documento persistido;
- histórico;
- projeção PDF;
- largura ampla e compacta.

### S3 — Sem mudança de schema por conveniência

Novos valores devem continuar em `props`, apresentações ou manifestos extensíveis sempre que o contrato atual já comportar a informação. Alterar `CatalogDocument 1.16.0` exige evidência de impossibilidade real, não preferência de implementação.

### S4 — Sem refatoração transversal durante correção local

Uma falha em texto, ícone, card ou biblioteca deve ser corrigida na menor superfície possível. Não aproveitar uma correção para reorganizar store, renderização, registro, inspetor e kit simultaneamente.

### S5 — Runtime antes do espelho do kit

Quando runtime e `authoring-kit/runtime` precisam permanecer equivalentes:

1. corrigir e testar o runtime principal;
2. confirmar o comportamento;
3. atualizar o espelho e os manifestos;
4. executar os testes de paridade.

### S6 — Uma transação reversível por ação

Toda nova ação editável deve manter o contrato de histórico existente. Uma ação visível corresponde a uma transação e deve ser desfeita integralmente.

### S7 — Interromper diante de divergência estrutural

O incremento deve parar e ser documentado, sem ampliar a correção, quando ocorrer qualquer um destes casos:

- necessidade aparente de migração de schema;
- alteração simultânea de mais de duas famílias de componentes;
- regressão em documentos 1.16.0;
- diferença não explicada entre canvas e PDF;
- colisão ou overflow introduzido por preset oficial;
- ação que não possa ser revertida em uma única operação;
- necessidade de remover ou renomear capacidade canônica.

## Priorização revisada

| Prioridade Developer B | Item canônico | Motivo da posição |
| --- | --- | --- |
| B0 | Matriz visual dos cinco modos, texto e escala interna | Cria linha de base antes de qualquer nova alteração. |
| B1 | Paridade e robustez do átomo `text` | Superfície isolável, já implementada e com baixo risco de arquitetura. |
| B1 | Paridade e robustez de `icon` e `specification` | Mudança localizada e independente do frame externo. |
| B1 | Diferenciação dos modos de `product-card` | Item central do 05.18, mas dividido por modo para limitar regressões. |
| B2 | Descoberta da biblioteca por intenção | Importante para uso, porém afeta navegação e manifesto; entra após estabilizar representação. |
| B2 | Ampliação curada de iconografia | Baixo risco estrutural se feita em lotes pequenos e sem novo pipeline. |
| B3 | Experimento `section-heading` | Primeiro como composição/receita mensurável; novo tipo somente após evidência. |
| B3 | Experimento `fact` | Primeiro como composição/receita mensurável; novo tipo somente após evidência. |
| B4 | Reavaliação de `callout` | Continua receita até demonstrar custo recorrente de edição ou inconsistência. |

## Plano por incrementos reduzidos

### DB-05.18.1 — Linha de base visual e contratual

**Natureza:** validação e evidência, sem nova capacidade.

**Escopo:**

- montar matriz dos modos `standard`, `hero`, `technical`, `variants` e `data-only`;
- exercitar largura ampla e compacta;
- comparar canvas e projeção PDF;
- registrar frame dos slots, colisões, overflow e propriedades persistidas;
- validar texto em seus defaults e escala interna em 100%;
- reutilizar o documento 1.16.0 e os presets existentes.

**Não inclui:**

- correções visuais extensas;
- reorganização de biblioteca;
- novos ícones;
- novos componentes.

**Saída mínima:**

- teste de navegador reproduzível;
- matriz ou relatório em `docs/evidence/05.18/developer-b/`;
- lista objetiva de divergências por responsabilidade.

**Gate:** nenhum próximo incremento altera runtime antes desta linha de base passar ou registrar claramente as falhas existentes.

---

### DB-05.18.2 — Texto: alinhamento e persistência

**Natureza:** endurecimento do comportamento já entregue.

**Escopo:**

- alinhamento horizontal `start`, `center`, `end`;
- alinhamento vertical `start`, `center`, `end`;
- persistência em exportação/importação;
- histórico em uma transação por mudança;
- defaults conservadores para documentos anteriores.

**Não inclui:**

- escala;
- overflow;
- novos estilos tipográficos;
- editor rico;
- CSS arbitrário.

**Critério de saída:** o alinhamento deve ser equivalente no canvas e PDF, sem alterar o frame do componente nem exigir schema novo.

---

### DB-05.18.3 — Texto: escala discreta

**Escopo:**

- escalas 80%, 100% e 120%;
- interação com tokens tipográficos existentes;
- preservação do tamanho externo do componente;
- equivalência no PDF;
- teste de mínimos e histórico.

**Não inclui:**

- valores livres;
- escala responsiva contínua;
- alteração de família de fonte;
- política de overflow.

**Critério de saída:** a escala altera somente a composição interna prevista, sem escapar do frame ou produzir mudança não solicitada de geometria.

---

### DB-05.18.4 — Texto: política de overflow

**Escopo:**

- `wrap`;
- `ellipsis`;
- `clip`;
- combinação com as três escalas;
- comportamento em altura ampla e compacta;
- equivalência de impressão.

**Não inclui:**

- autoexpansão de frame;
- truncamento semântico;
- edição de HTML;
- regras condicionais por conteúdo.

**Critério de saída:** cada política deve ter resultado previsível, persistente e visualmente distinguível sem colisão externa.

---

### DB-05.18.5 — Escala interna de ícone

**Escopo:**

- `icon` em 80%, 100% e 120%;
- escala centrada dentro do frame;
- preservação de token e recoloração;
- canvas/PDF;
- limites do viewBox e clipping.

**Não inclui:**

- novos ícones;
- redimensionamento do frame;
- mudanças em `specification`.

**Critério de saída:** alterar escala interna não modifica o frame, não desloca irmãos e não escapa da caixa.

---

### DB-05.18.6 — Escala interna de especificação

**Escopo:**

- molécula `specification` em 80%, 100% e 120%;
- interação entre ícone, rótulo e valor já existentes;
- mínimos internos;
- canvas/PDF;
- histórico e presets.

**Não inclui:**

- conversão para `fact`;
- novos campos semânticos;
- alteração de layout de tabelas.

**Critério de saída:** a escala interna preserva legibilidade, vínculo e frame externo, sem transformar a molécula em um novo tipo implícito.

---

### DB-05.18.7 — Card `hero`

**Escopo:** somente o contraste entre `standard` e `hero`.

- prioridade da arte;
- proporção dos slots;
- largura ampla e compacta;
- binding e overrides;
- reversão para `standard`;
- zero colisão e overflow.

**Não inclui:** ajustes nos demais modos além do necessário para preservar a linha de base.

**Critério de saída:** `hero` deve ser reconhecível pela geometria, não apenas por metadado, e retornar a `standard` sem perda de conteúdo.

---

### DB-05.18.8 — Card `technical`

**Escopo:** somente o contraste entre `standard` e `technical`.

- prioridade de especificações;
- redução proporcional da arte;
- mínimos;
- largura ampla e compacta;
- PDF e reversibilidade.

**Critério de saída:** especificações recebem prioridade observável sem invalidar galeria, tabela, binding ou subárvore canônica.

---

### DB-05.18.9 — Card `variants`

**Escopo:** somente o modo `variants`.

- empilhamento de galeria e informações comerciais;
- comportamento sem galeria;
- comportamento com uma e várias imagens;
- legenda individual;
- largura compacta;
- zero overflow.

**Critério de saída:** o modo funciona com conteúdo parcial e completo sem criar tipos paralelos ou exigir preenchimento fictício.

---

### DB-05.18.10 — Card `data-only`

**Escopo:** somente o modo `data-only`.

- ampliação da área de dados;
- comportamento com arte ausente ou preservada;
- tabelas curtas e longas dentro dos limites existentes;
- largura ampla e compacta;
- PDF.

**Critério de saída:** dados ganham prioridade clara sem remover bindings, conteúdo ou possibilidade de retornar a outro modo.

---

### DB-05.18.11 — Descoberta por intenção: classificação

**Natureza:** metadados e teste de navegação, sem remover componentes.

**Escopo:**

- classificar os dezesseis tipos em página, produto, dados, comunicação e estrutura avançada;
- manter IDs e registro atuais;
- declarar categorias no manifesto/guia apropriado;
- testar que nenhum tipo se torna inacessível.

**Não inclui:** mudança visual ampla da biblioteca.

**Critério de saída:** a classificação deve ser consumível pela UI sem duplicar registros ou alterar documentos.

---

### DB-05.18.12 — Descoberta por intenção: apresentação da biblioteca

**Escopo:**

- priorizar página, produto, dados e comunicação no fluxo inicial;
- mover `layout-container` e peças internas para um caminho de estrutura avançada;
- manter busca, teclado e acesso contextual;
- preservar drag and drop e `+` contextual.

**Não inclui:** exclusão, depreciação ou renomeação de tipos.

**Critério de saída:** infraestrutura continua acessível, mas deixa de competir visualmente com escolhas editoriais iniciais.

---

### DB-05.18.13 — Iconografia técnica e desempenho

**Escopo:** primeiro lote curado de ícones monocromáticos por token.

- cada ícone precisa atender ao menos dois fluxos plausíveis;
- categoria e rótulo explícitos;
- SVG compatível com recoloração atual;
- teste de viewBox, escala 80/100/120% e PDF.

**Não inclui:** novo pipeline de assets, ícones multicoloridos ou biblioteca indiscriminada.

**Critério de saída:** lote pequeno, documentado e exercitado em mais de um componente/contexto.

---

### DB-05.18.14 — Iconografia comercial, contato e confiança

Repete o contrato do incremento anterior para as categorias restantes, sem misturar revisão de navegação ou novos tipos.

**Critério de saída:** cada ícone possui uso recorrente demonstrável e não duplica significado já coberto.

---

### DB-05.18.15 — Experimento de intenção `section-heading`

**Natureza:** evidência antes de registro.

**Escopo:**

- compor kicker opcional, título, complemento e divisor com tipos existentes;
- exercitar ao menos dois catálogos ou seções diferentes da referência original;
- medir ações, consistência e custo de reuso;
- testar receita ou snapshot antes de criar tipo.

**Não inclui:** registrar `section-heading` como componente.

**Gate para promoção:** criar um novo tipo somente se a composição demonstrar repetição relevante, inconsistência ou custo que preset/receita não resolva adequadamente.

---

### DB-05.18.16 — `section-heading`, somente se promovido

**Escopo condicional:**

- um novo tipo;
- estrutura mínima validada pelo experimento;
- registro, renderer, inspetor, manifesto, kit e testes;
- leitura compatível de documentos anteriores;
- sem aproveitar o incremento para criar outros tipos.

**Critério de saída:** intenção exclusiva comprovada, edição mais clara que a receita e custo de manutenção proporcional ao ganho.

---

### DB-05.18.17 — Experimento de intenção `fact`

**Natureza:** evidência antes de registro.

**Escopo:**

- representar ícone opcional, rótulo, valor e unidade com tipos existentes;
- exercitar dimensão, peso, material e compatibilidade;
- comparar com texto, especificação e tabela;
- medir clareza, ações e reuso.

**Não inclui:** registrar `fact` como componente.

**Gate para promoção:** somente promover se nenhuma composição atual expressar o dado com clareza e edição suficiente.

---

### DB-05.18.18 — `fact`, somente se promovido

**Escopo condicional:** uma única molécula nova, com contrato mínimo derivado do experimento e cobertura completa de runtime, manifesto, kit e PDF.

**Não inclui:** tabelas novas, regras condicionais ou família paralela de especificações.

---

### DB-05.18.19 — Reavaliação de `callout`

**Natureza:** auditoria, não implementação presumida.

**Escopo:**

- medir uso da receita atual em mais de um caso;
- avaliar edição, reuso, responsividade e consistência;
- registrar se o custo continua aceitável.

**Critério de saída:** manter como receita por padrão. Novo componente exige evidência superior à exigida para `section-heading` e `fact`, pois não é candidata imediata canônica.

## Ordem recomendada de execução

1. `DB-05.18.1` — linha de base;
2. `DB-05.18.2` a `DB-05.18.4` — texto;
3. `DB-05.18.5` e `DB-05.18.6` — escala interna;
4. `DB-05.18.7` a `DB-05.18.10` — um modo de card por vez;
5. `DB-05.18.11` e `DB-05.18.12` — descoberta por intenção;
6. `DB-05.18.13` e `DB-05.18.14` — iconografia em dois lotes;
7. `DB-05.18.15` e, somente se aprovado, `DB-05.18.16`;
8. `DB-05.18.17` e, somente se aprovado, `DB-05.18.18`;
9. `DB-05.18.19` — reavaliar `callout` sem obrigação de promovê-lo.

## Regra de conclusão de cada incremento

Um incremento Developer B só é considerado concluído quando possui:

- escopo principal isolado;
- teste de domínio ou contrato quando aplicável;
- teste de navegador quando há mudança visual ou interativa;
- verificação de canvas e PDF quando há representação gráfica;
- zero nova colisão ou overflow em presets oficiais;
- histórico reversível para ações editáveis;
- documentação curta do resultado e das limitações;
- commit iniciado pelo número `05.18`;
- nenhuma alteração em `main` ou `development`.

## Itens preservados fora do ciclo

Continuam fora desta revisão, sem mudança de prioridade canônica:

- preço, selo, chip, botão e QR code como tipos próprios;
- caixa colorida, card de contato e aplicação como tipos próprios;
- novas famílias paralelas de tabela;
- editor rico ou CSS arbitrário;
- expansão multimídia;
- hospedagem e publicação;
- colaboração;
- touch/mobile completo;
- documento multipágina enquanto estiver pausado;
- merge desta branch.

## Papel deste documento na comparação de modelos

Além de orientar desenvolvimento, esta divisão permite comparar:

- quantidade de contexto necessária por incremento;
- capacidade de manter uma responsabilidade isolada;
- frequência de regressões transversais;
- quantidade de correções solicitadas pelo usuário;
- proporção entre trabalho implementado e trabalho apenas explicado;
- tamanho máximo de fatia concluída com testes e documentação coerentes.

Caso uma fatia ainda seja grande demais, ela deve ser subdividida sem alterar o item canônico correspondente. A redução de escopo é preferível a uma implementação parcial espalhada por várias superfícies.