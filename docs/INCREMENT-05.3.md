# Incremento 05.3 — Pacote portátil e manifestos de autoria

## Objetivo

Transportar documento e assets entre navegadores/agentes sem base64, criar uma fronteira segura para ZIP externo e entregar a primeira versão autocontida do kit usado por uma LLM para produzir projetos importáveis.

## Entregue

- `CatalogProjectPackage 1.0.0` em ZIP;
- exportação do documento com referências `package` em vez de chaves IndexedDB;
- inclusão de todos os assets registrados e disponíveis;
- manifesto raiz com versão, política, projeto, documento, arquivos, assets, kit, capacidades e relatório;
- tamanho e SHA-256 de cada arquivo declarado;
- MIME de asset confirmado pela assinatura dos bytes;
- importação em duas fases, integrada ao diálogo existente de JSON;
- preflight do diretório central antes da descompactação;
- bloqueio de caminhos absolutos, `..`, barras invertidas, duplicatas, criptografia, ZIP64 e compressão desconhecida;
- limites de 100 MB comprimidos, 25 MB por entrada, 150 MB descompactados e 1024 entradas;
- commit em lote dos blobs somente depois da validação completa;
- novas chaves locais por importação e remapeamento para `indexeddb`;
- rollback do lote se o commit falhar antes da substituição;
- importação como uma única ação reversível no histórico;
- `CatalogCapabilities 1.0.0` derivado dos registros runtime;
- `CatalogAuthoringKit 1.0.0` com guide, schemas, exemplos e capacidades;
- menu hierárquico **Exportar** para pacote, JSON e kit;
- governança inicial de assets com proveniência, fidelidade, aprovação e permissão de publicação;
- política Assistida registrada no manifesto;
- migração para `CatalogDocument 1.13.0`.

## Estrutura do pacote

```text
catalog-project.json
document/catalog.json
assets/*
manifests/catalog-capabilities.json
reports/export-report.json
authoring-kit/GUIDE.md
authoring-kit/manifest.json
authoring-kit/capabilities.json
authoring-kit/schemas/*
authoring-kit/examples/*
```

O manifesto raiz não precisa declarar o próprio hash. Todos os demais arquivos usados pelo importador são declarados. Arquivos extras são ignorados com aviso; nunca são gravados no filesystem.

## Governança de assets

Cada asset transporta:

- `origin`: `provided`, `official`, `derived`, `generated` ou `placeholder`;
- `role` e relações com produtos/assets de origem;
- `method`, `fidelity` e agente/ferramenta quando conhecidos;
- `status`: `publish-ready`, `review-required`, `draft-only`, `missing` ou `optional-missing`;
- `publishAllowed` e data de revisão.

Upload e migração usam defaults conservadores: `review-required` e publicação desativada. O importador preserva estados explícitos; não promove um asset automaticamente.

## Atomicidade

Analisar um pacote não altera documento nem IndexedDB. No commit:

1. são criadas chaves novas para todos os assets;
2. os blobs são gravados em uma única transação IndexedDB;
3. as referências da cópia validada são remapeadas;
4. o documento é substituído como uma ação de histórico.

Falhas antes do passo 4 limpam as chaves novas. Blobs de uma importação desfeita permanecem para suportar Refazer; a coleta de órfãos continua sendo uma rotina futura.

## Dependência ZIP

O projeto inclui `fflate 0.8.2` sob licença MIT em `vendor/`. A dependência é vendorizada para manter funcionamento sem backend e sem carregamento por CDN.

## Testes

- pacote íntegro e estrutura esperada;
- política Assistida e capacidades declarativas;
- SHA-256 em todos os arquivos;
- referência `package` na exportação;
- remapeamento e persistência local na importação;
- recuperação por Desfazer;
- adulteração de bytes;
- path traversal;
- exportação bloqueada quando faltam bytes;
- AuthoringKit autocontido;
- contratos estáticos e schemas 1.13/1.0;
- fluxo real de navegador preparado em `tests/browser-project-package.test.js`.

## Fora de escopo

- `CatalogSource` e `CatalogGenerationPlan`;
- compilador editorial;
- requisitos/fallbacks completos por template;
- interface de aprovação e gates de rascunho/publicação;
- assinaturas criptográficas de autoria/confiança;
- multipágina.
