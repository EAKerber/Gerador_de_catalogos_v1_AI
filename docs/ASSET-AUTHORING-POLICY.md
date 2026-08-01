# Política canônica de autoria e publicação de assets

## Status

Aceita como política padrão do produto em 2026-07-14. O modo **Assistido** é o default quando o usuário não informa outra preferência.

## 1. Princípio

A permissão para gerar assets depende de sua função e do risco de representar um fato. O sistema não usa uma autorização global indistinta para “gerar imagens”.

O agente deve preferir, nesta ordem:

1. asset fornecido e inequivocamente associado;
2. asset oficial do kit ou biblioteca;
3. derivação segura de um asset real;
4. geração de asset não factual;
5. template que não dependa do asset ausente;
6. placeholder editorial;
7. pergunta ao usuário quando a fidelidade for indispensável.

## 2. Modos de política

### Estrito

- fotos, logos e desenhos técnicos vêm do usuário ou de fonte oficial;
- o agente gera apenas decoração, fundos e iconografia genérica;
- produto sem imagem usa placeholder ou apresentação sem foto.

### Assistido — default

- reutiliza assets fornecidos e oficiais;
- permite recorte, remoção de fundo, enquadramento e normalização que preservem o produto;
- permite decoração, fundos e iconografia gerados;
- permite derivações controladas, como variação de cor confirmada da mesma geometria;
- imagem factual gerada do zero permanece `draft-only` até aprovação explícita;
- prefere fallback sem foto antes de interromper o usuário.

### Criativo

- pode gerar representações conceituais de produto quando autorizado;
- não transforma geração em dado técnico ou prova de fidelidade;
- publicação continua condicionada ao estado de aprovação do asset.

O modo pode ser definido no kit, no brief do catálogo ou por classe de asset. A regra mais restritiva aplicável prevalece.

## 3. Matriz por função

| Função | Regra padrão |
| --- | --- |
| Logo e identidade | Não recriar sem solicitação; pedir se indispensável |
| Foto principal de produto | Usar original; se ausente, aplicar fallback ou perguntar |
| Recorte e remoção de fundo | Permitidos a partir de fonte real |
| Luz, contraste e enquadramento | Permitidos sem alterar características do produto |
| Variação somente de cor | Derivação permitida quando forma e cores forem confirmadas |
| Variação de modelo ou geometria | Exige imagem real ou aprovação conceitual explícita |
| Desenho técnico | Fornecido ou SVG determinístico a partir de medidas confirmadas |
| Dimensões técnicas | Nunca inferir visualmente |
| Ícone semântico | Preferir manifesto oficial; gerar vetor compatível se necessário |
| Fundo, textura ou grafismo | Pode gerar autonomamente |
| Swatch e legenda cromática | Gerar deterministicamente a partir de dados e tokens |
| Placeholder | Permitido com aviso e política de publicação |

## 4. Estado de publicação

Todo asset possui um estado explícito:

- `publish-ready`: apto para PDF final;
- `review-required`: precisa de aprovação;
- `draft-only`: pode compor rascunho, mas não publicação;
- `missing`: obrigatório e ausente;
- `optional-missing`: ausência aceita pelo template.

### Gates de exportação

- **Exportar rascunho:** permite `review-required`, `draft-only`, placeholders e avisos visíveis no relatório.
- **Exportar para publicação:** bloqueia `missing`, `draft-only` e assets obrigatórios em `review-required`.

Um asset opcional ausente não bloqueia publicação quando o template possui fallback válido.

## 5. Proveniência mínima

O manifesto do asset deve registrar:

- origem: `provided`, `official`, `derived`, `generated` ou `placeholder`;
- função editorial;
- produto ou variante relacionados, quando aplicável;
- assets de origem em derivações;
- operação ou método aplicado;
- fidelidade: `product-faithful`, `deterministic`, `conceptual` ou `decorative`;
- estado de aprovação;
- permissão de publicação;
- ferramenta ou agente gerador quando disponível.

Reparos, migrações e importação não podem promover automaticamente um asset para `publish-ready`.

## 6. Requisitos declarados pelos templates

Cada template ou modo oficial declara:

- roles obrigatórias e opcionais;
- quantidade mínima e máxima por role;
- proporção e resolução recomendadas;
- estados de publicação aceitos;
- se aceita asset gerado, derivado ou placeholder;
- template ou modo de fallback;
- condição para exportação final.

Exemplos de intenção:

- `card.standard`: imagem principal opcional;
- `card.hero`: imagem principal obrigatória para publicação;
- `card.technical`: desenho técnico ou dados dimensionais confirmados;
- `card.variants`: múltiplas imagens reais ou derivações autorizadas;
- `card.data-only`: nenhuma imagem obrigatória.

O agente avalia os requisitos antes de escolher a apresentação. Ausência de asset pode mudar o template sem exigir uma pergunta quando o fallback preservar o conteúdo.

## 7. Decisão do agente

1. classificar a função e o risco do asset;
2. verificar associação e direitos declarados dos arquivos fornecidos;
3. consultar assets oficiais e capacidades do ambiente;
4. verificar requisitos e fallbacks dos templates candidatos;
5. escolher reutilização, derivação, geração, fallback, placeholder ou pergunta;
6. registrar origem, estado e decisão no relatório;
7. revalidar gates de rascunho e publicação.

O agente pode perguntar quando a associação entre produto e imagem for ambígua ou quando um asset factual indispensável não tiver fallback. Não pergunta por assets puramente decorativos ausentes.

## 8. Regras de segurança semântica

- preço, código, medida, material, certificação e compatibilidade nunca são extraídos de uma imagem como fato sem confirmação;
- remoção de fundo não pode apagar peças ou acessórios relevantes;
- mudança de cor não pode ser usada para criar uma variante não confirmada;
- imagem conceitual deve permanecer identificável como gerada no relatório e no estado de aprovação;
- cor nunca é o único meio de comunicar uma categoria ou variante;
- hashes e MIME validam integridade de arquivo, não fidelidade do produto.

### 8.1 Edição factual não imaginativa

Zoom, foco, reenquadramento, redimensionamento, recorte de margens neutras,
expansão de fundo uniforme e correções de contraste, luminosidade, balanço de
branco e cor são permitidos e recomendados quando melhoram o preenchimento do
componente sem alterar a identidade do produto. Em especial, o agente deve
evitar deixar visível um arquivo quadrado sobre um componente retangular quando
o fundo puder ser expandido de forma uniforme ou a margem neutra puder ser
recortada com segurança.

A transformação não pode inventar partes, deformar geometria, ocultar detalhes
comerciais, alterar acabamento nem criar uma variante inexistente. Recoloração
só materializa uma cor confirmada pela fonte. Toda derivação preserva o
asset-fonte, cria novo arquivo, recalcula integridade e registra método,
`sourceAssetIds`, fidelidade e aprovação, para permanecer reversível.

## 9. Estado de implementação

O Incremento 05.3 formalizou e transporta `provenance` e `approval`, com defaults conservadores e política Assistida no manifesto. Permanecem para incrementos posteriores:

- armazenamento do resumo ou prompt de geração;
- interface de aprovação individual ou em lote;
- limites de resolução por template;
- integração futura com provedores de geração e edição de imagens;
- assinatura e confiança de pacotes vindos de agentes externos.
