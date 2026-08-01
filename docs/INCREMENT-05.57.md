# Incremento 05.57 — integridade factual e footer declarativo

## Motivação

O ensaio real do Authoring Kit revelou que um pacote estruturalmente válido
podia materializar dados comerciais não fornecidos, perder valores de tabela
por diferença de caixa e criar galerias sem assets distintos. O footer era
especialmente ambíguo: `enabled` ligava seis itens com conteúdo didático, e
`disabled` removia a estrutura inteira.

As referências visuais permanecem evidência de investigação e desenvolvimento.
Elas não são templates, fontes factuais nem critérios globais de aceitação.

## Escopo

- remover dados comerciais válidos dos defaults e exemplos visuais;
- fornecer receitas estruturais de footer sem conteúdo factual implícito;
- permitir de um a oito itens, recomendando de dois a cinco;
- recomendar papéis a partir dos dados informados e pedir decisão quando não
  houver conteúdo suficiente;
- preservar footer vazio como escolha explícita, não como padrão;
- aplicar receita e quantidade numa única transação reversível;
- validar linhas comerciais pelas colunas declaradas, sem duplicar valores no
  nível do produto;
- rejeitar diferenças de caixa entre chaves de coluna e células;
- criar galeria automaticamente somente quando houver assets distintos;
- distinguir gates `passed`, `failed` e `notRun` no relatório do compilador;
- atualizar o runtime distribuído sem promover o Authoring Kit além de 1.7.1.

## Fora do escopo

- controles de zoom, deslocamento e recorte por instância de imagem;
- revisão editorial ampla do Authoring Kit 1.7.2;
- renderizador headless do editor;
- round-trip autônomo de ZIP para PDF;
- taxonomia normativa de referências visuais;
- novos tipos de ícone ou suporte a SVG externo no átomo `icon`.

## Contrato do footer

As receitas descrevem estrutura e papéis, nunca fatos. Os papéis disponíveis
são identidade, contato, localização, benefício, serviço, paginação e conteúdo
personalizado. Placeholders didáticos são inválidos por construção e carregam
estado pendente; publicação é bloqueada enquanto permanecerem no documento.

Quando não houver fatos suficientes, o plano registra `needs-input`. O agente
deve perguntar ao usuário se deseja fornecer dados, manter pendências, usar
somente paginação/metadados ou remover explicitamente o footer.

## Critérios de aceite

1. Compilar sem dados de footer não materializa empresa, cidade, telefone ou
   benefícios reais.
2. Footer omitido só ocorre com decisão explícita.
3. Receita e quantidade são editáveis, respeitam o limite de oito itens e são
   desfeitas em uma ação.
4. Placeholders pendentes bloqueiam publicação, mas permanecem auditáveis no
   rascunho.
5. Linhas comerciais declaradas não geram avisos de duplicação; diferenças de
   caixa geram erro específico.
6. Múltiplas linhas comerciais sem assets distintos não criam galeria.
7. O compilador nunca apresenta gates renderizados não executados como sucesso.
8. Node e build ficam verdes; Chromium continua gate obrigatório na CI.

`CatalogDocument` permanece em `1.16.0`; `CatalogGenerationPlan` passa a
`1.1.0`; o Authoring Kit permanece em `1.7.1`.
