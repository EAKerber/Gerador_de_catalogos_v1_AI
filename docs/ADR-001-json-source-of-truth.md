# ADR-001 — JSON como fonte de verdade

**Status:** aceito

## Contexto

O projeto precisa funcionar localmente agora, mas deve evoluir para API, templates, produtos e múltiplos exportadores. Salvar HTML como documento principal acoplaria conteúdo, aparência e estado de edição.

## Decisão

O documento será mantido como JSON versionado. O DOM será reconstruído a partir desse estado.

## Consequências positivas

- persistência local e remota usam o mesmo formato;
- renderer HTML pode ser substituído sem migrar o conteúdo;
- exportadores PDF e XLSX podem consumir o domínio;
- templates e produtos podem ser vinculados por ID;
- mudanças de schema podem ser migradas explicitamente.

## Consequências negativas

- exige um renderer;
- exige comandos para manter estado e DOM sincronizados;
- edição de texto e interações precisam ser convertidas em patches de estado.
