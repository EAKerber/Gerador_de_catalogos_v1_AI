# Addendum do backlog Developer B — DB-05.18.12.2

## Posição na sequência

Este addendum insere o incremento abaixo entre:

- `DB-05.18.12` — apresentação da biblioteca por intenção;
- `DB-05.18.13` — iconografia técnica e desempenho.

A iconografia não deve começar antes da auditoria deste recorte, porque o caso afeta diretamente a representação dos ícones e textos dentro do rodapé.

## DB-05.18.12.2 — Contenção mínima do `footer-item`

**Natureza:** correção geométrica e visual localizada.

### Problema

Ao reduzir `catalog-footer` ao mínimo técnico, moléculas `footer-item` com ícone, título e subtítulo podiam ultrapassar a linha inferior do rodapé.

O problema combinava:

- alturas mínimas internas maiores que o espaço disponível;
- largura textual mínima capaz de ultrapassar a lateral;
- ausência de recorte defensivo da camada de filhos.

### Escopo

- recalcular os frames de `title` e `subtitle` pelo espaço real do `footer-item`;
- preservar ícone, título, subtítulo e margem inferior no mínimo de 64 px;
- conter largura interna em itens de 80 px;
- impedir vazamento externo em tela e impressão;
- preservar edição interna, `wrap`, `ellipsis` e `clip`;
- manter o mínimo técnico atual enquanto ele demonstrar ser suficiente;
- espelhar o contrato no AuthoringKit;
- fornecer build auditável específico da branch.

### Não inclui

- redução automática de fonte;
- elevação preventiva do mínimo técnico;
- novo componente de rodapé;
- alteração da quantidade padrão de itens;
- revisão de iconografia;
- alteração de schema;
- refatoração ampla do motor de slots.

### Critérios de saída

O incremento é considerado concluído quando:

1. um `footer-item` de 80 × 64 px contém título e subtítulo sem sobreposição;
2. um rodapé de 80 px contém integralmente suas seis moléculas;
3. nenhum frame de texto ultrapassa os limites do pai em X ou Y;
4. nenhum retângulo DOM ultrapassa o pai em tela ou impressão;
5. “Atendimento via WhatsApp” permanece íntegro e pode quebrar linha;
6. o modo de edição interna continua acessível;
7. editor e AuthoringKit usam o mesmo contrato;
8. schema permanece em `1.16.0`;
9. nenhum merge é realizado.

### Evidência

```text
docs/evidence/05.18/developer-b/DB-05.18.12.2-FOOTER-ITEM-CONTAINMENT.md
```

### Testes

```text
tests/footer-item-containment-05.18.12.2.test.js
tests/footer-item-containment-build-05.18.12.2.test.js
tests/browser-footer-item-containment-05.18.12.2.test.js
```

### Gate para DB-05.18.13

A iconografia pode prosseguir após auditoria confirmar que:

- os ícones permanecem contidos em 80%, 100% e 120%;
- o texto de rodapé não volta a alterar a altura externa da molécula;
- a mídia de impressão não reintroduz overflow;
- o build Developer B mantém paridade dos contratos.
