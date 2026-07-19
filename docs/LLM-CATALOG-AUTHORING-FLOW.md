# Fluxo de autoria de catálogos por agente

## Status

Especificação funcional canônica do fluxo desejado. Transporte portátil foi implementado no 05.3; `CatalogSource`, apresentações semânticas e gates de assets no 05.4; `CatalogGenerationPlan`, compilador determinístico e gate geométrico no 05.5; receitas oficiais declarativas no 05.8; ações contextuais no 05.9; variantes e legendas hierárquicas no 05.10; atlas funcional validado no 05.11.

## 1. Kit entregue uma única vez

O `CatalogAuthoringKit` é versionado e autocontido. Ele deve poder ser anexado a um chat, projeto ou agente especializado uma única vez e reutilizado em várias criações.

Conteúdo entregue na versão 1.5.0:

```text
CatalogAuthoringKit-1.5.0/
├── GUIDE.md
├── manifest.json
├── capabilities.json
├── feature-inventory.json
├── feature-guide.json
├── schemas/
│   ├── catalog-document.schema.json
│   ├── catalog-project-package.schema.json
│   ├── catalog-capabilities.schema.json
│   ├── catalog-source.schema.json
│   └── catalog-generation-plan.schema.json
├── examples/
│   ├── minimal-document.json
│   ├── catalog-project.json
│   ├── catalog-source.json
│   └── reference-catalog-source.json
├── compiler/
│   └── compile-catalog.js
└── runtime/
    ├── section-recipes.js
    └── módulos autocontidos do compilador
```

Conteúdo-alvo das versões posteriores:

```text
catalog-authoring-kit/
├── GUIDE.md
├── VERSION
├── schemas/
│   ├── catalog-source.schema.json
│   ├── catalog-generation-plan.schema.json
│   ├── catalog-document.schema.json
│   └── catalog-project-manifest.schema.json
├── manifests/
│   ├── components.json
│   ├── templates.json
│   ├── tokens.json
│   ├── icons.json
│   └── capabilities.json
├── examples/
│   ├── minimal/
│   └── reference-catalog/
├── tools/
│   ├── compile
│   ├── validate
│   └── package
└── assets/
    └── bundled/
```

O kit deve declarar sua versão no pacote gerado. Se o contrato mudar de forma incompatível, o kit é atualizado uma vez no projeto do agente; não é reenviado a cada catálogo.

## 2. Entrada por criação

O usuário pode fornecer dados estruturados ou texto livre. O agente converte a entrada para `CatalogSource`.

### Entrada mínima operacional

- ao menos uma entidade de produto identificável por título ou código;
- valores factuais que o usuário deseja publicar;
- instrução implícita ou explícita de criar o catálogo.

### Entrada opcional

- título e subtítulo do catálogo;
- categorias, ordem e agrupamentos;
- identidade ou campanha diferente do default do kit;
- imagens, logos e desenhos técnicos;
- destaque de produtos;
- densidade, quantidade aproximada de páginas ou produtos por página;
- preferências de template, modo ou cor;
- textos de apoio, contato e rodapé;
- restrições de impressão.

Ausência de uma consideração editorial transfere a decisão ao agente. Ausência de um fato não autoriza sua invenção.

## 3. Protocolo do agente

### Etapa A — inventário

1. listar produtos e campos disponíveis;
2. identificar assets anexados e possíveis associações;
3. ler as capacidades declaradas pelo kit e pelo ambiente;
4. classificar lacunas como factual, editorial, visual ou técnica.

### Etapa B — decisão de perguntas

Uma pergunta é feita apenas se ao menos uma condição for verdadeira:

- a resposta altera um fato publicado;
- não existe fallback válido para uma peça obrigatória;
- duas interpretações plausíveis causam resultados materialmente diferentes;
- o ambiente não consegue executar uma ação indispensável;
- prosseguir pode associar o asset ao produto errado.

Preferências não informadas usam defaults documentados. O agente pode agrupar perguntas bloqueantes em uma única rodada curta.

### Etapa C — plano editorial

O agente define:

- agrupamentos e ordem;
- papéis de página e seções;
- produto em destaque e produtos regulares;
- template, modo e densidade de cada família;
- estratégia de tabelas, galerias e legendas;
- estratégia de assets ausentes;
- fallbacks autorizados.

O agente produz `CatalogGenerationPlan` quando precisa sobrescrever o plano padrão; não calcula manualmente toda a geometria recursiva.

### Etapa D — compilação e validação

1. materializar o `CatalogDocument`;
2. importar ou gerar assets;
3. criar referências estáveis por `assetId`;
4. validar schema, referências, slots, tokens e layout;
5. executar reparos determinísticos seguros;
6. repetir validação;
7. bloquear a entrega somente em erros que impeçam importação ou alterem fatos.

### Etapa E — entrega

O agente entrega o pacote e resume:

- decisões editoriais tomadas;
- assets gerados, reutilizados, omitidos ou pendentes;
- suposições não factuais;
- avisos remanescentes;
- versão do kit e do schema.

## 4. Política de assets

O modo **Assistido** é aplicado quando o brief não define outra política. Função, risco e proveniência controlam a geração; não existe uma autorização global indistinta para todo tipo de imagem.

Ordem preferencial:

1. reutilizar asset fornecido e inequivocamente associado;
2. reutilizar asset oficial do kit ou da biblioteca declarada;
3. gerar asset quando houver capacidade, autorização e segurança semântica;
4. usar placeholder editorial quando a imagem for opcional;
5. pedir ao usuário quando a fidelidade do produto depender do asset.

| Situação | Conduta padrão |
| --- | --- |
| Logo fornecida | Reutilizar; não redesenhar sem solicitação |
| Foto de produto fornecida | Vincular pelo produto/variante confirmado |
| Fundo ou elemento decorativo ausente | Pode gerar se o ambiente permitir |
| Ícone semântico disponível no manifesto | Reutilizar o ícone oficial |
| Foto específica ausente | Pedir, usar placeholder ou escolher template sem foto |
| Desenho técnico ausente | Não inventar dimensões ou geometria técnica |
| Ambiente sem geração de imagem | Aplicar fallback e relatar; perguntar apenas se indispensável |

Todo asset gerado precisa de nome estável, MIME suportado, função, origem e relação com o produto quando aplicável.

Assets também carregam estado de publicação: `publish-ready`, `review-required`, `draft-only`, `missing` ou `optional-missing`. Exportação de rascunho tolera pendências registradas; exportação para publicação bloqueia assets obrigatórios ausentes, de rascunho ou ainda sem aprovação.

Regras normativas, matriz por função e requisitos de template estão em `ASSET-AUTHORING-POLICY.md` e `ADR-015-risk-based-asset-generation.md`.

## 5. Saída portátil

Formato entregue no `CatalogProjectPackage 1.0.0`:

```text
catalog-project.zip
├── catalog-project.json
├── document/catalog.json
├── source/catalog-source.json
├── plan/catalog-generation-plan.json
├── assets/*
├── manifests/catalog-capabilities.json
├── reports/export-report.json
└── authoring-kit/*
```

`source/catalog-source.json` acompanha o pacote desde o 05.4. `plan/catalog-generation-plan.json` acompanha documentos compilados desde o 05.5.

### `catalog-project.json`

Deve declarar:

- versão do pacote;
- versão do kit e do schema;
- arquivo principal;
- lista de assets com caminho, MIME, tamanho e hash;
- política de importação;
- data e agente gerador quando disponíveis.

### Importação

O editor deve:

1. validar o ZIP e impedir travessia de caminho ou arquivos não permitidos;
2. validar manifesto e hashes;
3. validar e migrar o documento em memória;
4. importar assets no armazenamento atual;
5. remapear referências portáteis sem alterar `assetId` sem necessidade;
6. apresentar erros e avisos antes de substituir o documento aberto;
7. manter backup ou possibilitar desfazer a substituição;
8. renderizar preview e executar a validação de layout.

JSON isolado permanece aceito para documentos sem assets locais ou quando todas as referências forem resolvíveis. O pacote ZIP é o formato recomendado.

## 6. Níveis de validação

| Nível | Exemplos | Resultado |
| --- | --- | --- |
| Erro | JSON inválido, referência quebrada obrigatória, tipo desconhecido | Não importar sem reparo |
| Aviso | Asset opcional ausente, overflow, baixo contraste | Importar com painel de revisão |
| Informação | Default escolhido, campo opcional omitido | Registrar no relatório |

Reparos automáticos não podem alterar preços, códigos, medidas ou especificações.

## 7. Estratégia de implementação

O alvo é híbrido:

- o agente interpreta e decide;
- schemas e manifestos descrevem as possibilidades;
- um compilador determinístico materializa a árvore final;
- o agente pode gerar diretamente o documento apenas como escape hatch validado;
- o importador nunca confia no pacote sem validação.

Essa estratégia permite que ambientes com execução de ferramentas entreguem resultados estáveis e que ambientes mais limitados ainda produzam um JSON validável a partir dos exemplos e manifestos.

## 8. Pontos ainda em Discovery

- novas estratégias além de `hero-grid` e nível de customização sem transformar o plano em CSS;
- heurísticas que escolhem entre os presets iniciais e futuras famílias de templates;
- regras de paginação e balanceamento;
- limites de geração automática de imagens por categoria de asset;
- estratégia de assinatura, confiança e proveniência de pacotes externos;
- política para atualização do kit e compatibilidade entre versões;
- interface avançada do relatório de validação e dos reparos sugeridos.
