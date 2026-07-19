# ADR-004 — Escala adaptativa e contratos preparatórios

## Status

Aceita no Incremento 03.1.

## Contexto

O editor precisava operar em `1366×768` sem depender do zoom do navegador. Ao mesmo tempo, duplicação, recoloração vetorial e futuros assets exigiam contratos persistentes, mas implementar a biblioteca de artes nesta etapa quebraria o recorte incremental.

## Decisão

1. A página mantém 794×1123 unidades lógicas.
2. `editor.zoomMode: "fit"` calcula uma escala apenas visual pela área central disponível.
3. Movimento e resize consultam a escala efetiva do workspace.
4. Os painéis persistem somente seus estados recolhido/expandido.
5. `vectorColor` é um token separado, com fallback para `accentColor`.
6. Duplicação é uma operação do store sobre a subárvore JSON; o renderer apenas projeta o resultado.
7. Coleções usam um contrato genérico. Assets possuem política `reference-only` e apontam para storage por ID.
8. Upload, IndexedDB e storage remoto continuam fora desta implementação.

## Consequências positivas

- a interface cabe em telas de notebook sem perda de área por zoom externo;
- coordenadas, snap e impressão continuam determinísticos;
- futuras mídias não exigem inserir binários no documento;
- cópias de containers preservam a arquitetura de coordenadas locais;
- tokens vetoriais não acoplam iconografia ao destaque editorial.

## Consequências negativas

- a escala efetiva é estado de runtime e precisa ser compartilhada com interações;
- itens de coleção ainda não possuem interface;
- o modo fit pode resultar em uma A4 visualmente menor em telas baixas;
- duplicação simples não substitui seleção múltipla nem comandos de distribuição.
