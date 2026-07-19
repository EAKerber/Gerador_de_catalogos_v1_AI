# ADR-016 — Integridade e commit do pacote portátil

## Status

Aceita e implementada no Incremento 05.3.

## Contexto

O documento JSON referencia blobs locais e não consegue reproduzir sozinho um projeto em outro navegador. Aceitar ZIPs externos amplia a superfície de ataque: path traversal, zip bombs, arquivos criptografados, MIME falso, substituição parcial e colisão com blobs do projeto aberto.

## Decisão

1. `CatalogProjectPackage` é um ZIP com manifesto raiz legível e arquivos separados.
2. Base64 continua proibido no documento.
3. O diretório central é inspecionado antes de descompactar.
4. Caminhos precisam ser relativos, normalizados, únicos e sem `.`/`..` ou barra invertida.
5. ZIP64, volumes, criptografia e métodos além de store/deflate são bloqueados nesta versão.
6. Limites comprimido, individual, total e de quantidade são aplicados antes da alocação descompactada.
7. Todos os arquivos declarados possuem tamanho e SHA-256; assets também têm MIME confirmado pelos bytes.
8. Arquivos extras nunca são persistidos.
9. Assets usam caminhos `package` durante transporte e novas chaves `indexeddb` após importação.
10. Nenhum blob é persistido durante análise/preview.
11. O commit grava o lote de blobs, remapeia uma cópia validada e só então substitui o documento.
12. A substituição do documento forma uma única ação de histórico.

## Consequências

- pacote íntegro é portátil entre navegadores sem depender da origem;
- edição manual permanece possível, mas qualquer divergência estrutural ou binária é explicitada no relatório;
- hashes provam integridade, não fidelidade semântica ou confiança na origem;
- o manifesto raiz não pode autenticar a si próprio; assinatura e confiança ficam para uma evolução posterior;
- o pacote só é exportado quando todos os assets registrados possuem bytes compatíveis;
- blobs importados podem ficar órfãos após caminhos de histórico e exigirão coleta futura.

## Alternativas rejeitadas

### Base64 no JSON

Mistura domínio e armazenamento, aumenta diffs e não resolve governança de arquivos.

### Descompactar antes de validar limites

Permite consumo descontrolado de memória por entradas comprimidas maliciosas.

### Reutilizar o ID do asset como chave de storage

Pode sobrescrever bytes usados pelo documento aberto antes da confirmação.

### Persistir cada asset sem transação de lote

Pode deixar importação parcial quando uma escrita intermediária falha.

## Referências

- `ADR-005-asset-storage-and-references.md`
- `ADR-014-agent-authored-portable-catalogs.md`
- `ADR-015-risk-based-asset-generation.md`
- `PRODUCT-DEFINITION.md`
- `ASSET-AUTHORING-POLICY.md`
