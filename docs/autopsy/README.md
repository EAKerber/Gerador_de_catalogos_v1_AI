# Autópsia da V1

## Objetivo

Determinar, antes de qualquer desenvolvimento, quais partes da V1 são
patrimônio comprovado, quais precisam ser reconstruídas e quais representam
custo afundado. A autópsia avalia o sistema pelo resultado materializado, não
pela quantidade de capacidades nem pela aprovação isolada da CI.

## Regra de congelamento

A autópsia não corrige o objeto analisado. Reproduções executam a V1 intacta;
qualquer mudança necessária para tornar um teste possível deve ser descrita
como limitação ou proposta futura, não aplicada ao runtime.

## Unidade de análise

Cada frente deve mapear o caminho completo, não somente um arquivo:

1. intenção e fatos em `CatalogSource`;
2. decisões em `CatalogGenerationPlan`;
3. materialização no compilador;
4. resolução geométrica e reflow;
5. projeção no renderer/editor;
6. medição visual e textual real;
7. PDF e pacote reimportável;
8. feedback disponível ao agente e ao usuário.

Para cada passagem, registrar:

- autoridade de escrita;
- entrada e saída;
- invariantes pretendidos;
- observabilidade real;
- gate existente;
- falhas conhecidas e propagação;
- dependências que seriam herdadas por uma V2.

## Vocabulário de evidência

| Estado | Uso |
| --- | --- |
| `observed` | O artefato ou execução identificada contém o comportamento. |
| `reproduced` | Procedimento, ambiente e resultado foram repetidos e registrados. |
| `inferred` | Há explicação causal plausível, ainda falsificável. |
| `decided` | O usuário aceitou uma escolha e suas consequências foram registradas em ADR. |

Uma conclusão arquitetural não pode depender somente de evidência `inferred`.
Discordâncias entre estrutura e render devem preservar os dois resultados; não
se escolhe silenciosamente o mais favorável.

## Formato mínimo de um achado

```text
ID:
Estado: observed | reproduced | inferred | decided
Pergunta:
Evidência e localização:
Procedimento de reprodução:
Resultado:
Camadas afetadas:
Impacto no usuário/agente:
Explicação causal atual:
Alternativas/fatores de confusão:
Como refutar:
Confiança:
Implicação de disposição: preservar | extrair | reconstruir | descartar | adiar | ainda aberta
```

## Frentes de trabalho

1. **Autoridade visual e renderização** — editor, impressão, PDF e previews.
2. **Layout, texto e reflow** — escritores geométricos, mínimos, overflow,
   truncamento e decisões de redução.
3. **Contrato de autoria** — Source, Plan, kit, proveniência, assets e ciclo de
   feedback do agente.
4. **Modelo de documento e componentes** — granularidade, bindings, receitas,
   coleções, migração e custo de edição.
5. **Portabilidade e infraestrutura** — pacote, hashes, round-trip, testes,
   fixtures e CI.
6. **Interface e operação manual** — descoberta, carga cognitiva, ações,
   responsividade e autoridade local.

As frentes podem ser investigadas em qualquer ordem quando a evidência exigir,
mas as conclusões devem ser reconciliadas no caminho crítico completo.

## Entregas bloqueantes

- relatório de encerramento da V1;
- índice e registro reproduzível de evidências;
- matriz de disposição de capacidades e módulos;
- contrato mensurável de qualidade da V2;
- comparação de alternativas arquiteturais;
- ADR de arquitetura, somente após aprovação dos itens anteriores.

## Critério de saída

A autópsia só termina quando um agente novo consegue:

- localizar o estado e o próximo passo sem ler chats;
- distinguir fatos, hipóteses e decisões;
- rastrear cada conclusão importante a evidência;
- explicar por que cada capacidade será preservada, extraída, reconstruída,
  descartada ou adiada;
- aplicar o contrato de qualidade a um corte vertical proposto;
- comparar as alternativas arquiteturais sem pressupor que refatorar ou
  reescrever seja a resposta.

Até lá, `docs/project/STATUS.md` permanece a entrada operacional.
