# Convenções de desenvolvimento

## Branches

- `main` contém a versão estável mais recente.
- `development` recebe o desenvolvimento corrente e é a base normal de trabalho.
- Mudanças isoladas podem usar branches curtas derivadas de `development` quando isso reduzir risco ou facilitar revisão.

## Commits

Toda mensagem de commit deve começar pelo número do incremento correspondente:

```text
05.15 — descrição objetiva da mudança
```

Não são aceitas mensagens que ocultem a versão, misturem incrementos não relacionados ou publiquem artefatos gerados sem necessidade.

## Promoção

Um incremento só deve ser promovido de `development` para `main` depois de testes de domínio, validação de schema e verificações de navegador proporcionais ao risco. Checkpoints explicitamente incompletos permanecem em `development`.

ZIPs deixam de ser uma etapa normal de entrega. O repositório Git e seus branches passam a ser a fonte oficial; pacotes portáteis continuam existindo apenas como funcionalidade do produto ou backup excepcional.
