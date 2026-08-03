# Convenções de contribuição

> A governança vigente está em `docs/START-HERE.md`. A V1 está congelada e a
> fase atual aceita somente documentação, inventário/reprodução de evidência e
> testes de consistência documental. Não inicie correção funcional ou V2 a
> partir deste arquivo.

## Branches durante a autópsia

- `development` é a base transitória até o encerramento e snapshot formais;
- cada unidade usa uma branch curta `agent/*` derivada do head remoto
  comprovado;
- PRs começam como draft e têm base `development` enquanto o checkpoint assim
  declarar;
- não existe branch documental permanente;
- `main`, `archive/v1` e `v1.0.0-prototype` só mudam na operação formal de
  encerramento descrita no checkpoint;
- branches V2 são proibidas antes da decisão arquitetural.

## Escopo de uma contribuição forense

Cada PR deve declarar:

- pergunta investigada;
- evidência adicionada ou reproduzida;
- distinção entre observado, reproduzido, inferido e decidido;
- documentos e camadas afetados;
- incertezas e alternativas;
- próximo passo exato;
- confirmação de que nenhum código do produto foi alterado.

Se uma análise revelar um fix provável, registre-o como implicação ou hipótese.
Não o implemente na mesma PR.

## Identificação

O último incremento funcional permanece `05.60`. Checkpoints da fase forense
usam a sequência documental iniciada em `05.61`, explicitando que não alteram a
versão do editor ou do Authoring Kit.

Mensagens de commit devem começar pelo checkpoint correspondente:

```text
05.61 — descrição objetiva da mudança documental
```

Não misture autópsia, implementação e higiene de refs no mesmo commit.

## Validação

Execute os testes documentais e, quando a mudança tocar referências consumidas
por contratos antigos, os testes Node relevantes. Build e Chromium completos
são proporcionais ao risco e continuam obrigatórios na CI quando o workflow os
executar; aprovação técnica não substitui revisão da evidência.

## Promoção e artefatos

ZIPs não são uma etapa normal de contribuição. O repositório é a fonte
oficial; pacotes da V1 são evidência ou funcionalidade preservada.

A promoção para `main`, criação de `archive/v1`, tag ou release e a poda de
branches formam uma operação separada, posterior à aprovação dos gates de
encerramento e sujeita a readback.
