# Incremento 05.27 — consolidação do overflow textual

## Direção

Continuar a consolidação interna da V1 single-page em um recorte isolado, sem
alterar interface, schema, persistência ou resultado visual.

## Problema confirmado

As políticas `wrap`, `ellipsis` e `clip` já eram persistidas corretamente, mas
um contrato carregado depois do store substituía toda a classe para normalizar
rodapés legados, interceptar importações e marcar escolhas explícitas. O
comportamento dependia da ordem de instalação apesar de pertencer ao domínio
documental.

## Contrato

- o store canônico normaliza overflow legado no construtor, análise e
  substituição de documento;
- `updateComponent` marca como explícita toda alteração de overflow em texto;
- o contrato tardio preserva defaults do registro, estilos e API pública;
- instalar o contrato não substitui a classe nem métodos do store;
- documentos atuais e legados mantêm o mesmo resultado.

## Gates

- políticas `wrap`, `ellipsis` e `clip`, histórico e round-trip;
- fallback `ellipsis`/`wrap` de rodapé legado conforme o slot;
- análise de importação antes do commit;
- identidade da classe e de `updateComponent` antes/depois da instalação;
- paridade entre runtime principal e Authoring Kit;
- regressão Node, build e Chromium multirreferência.

## Fora do incremento

- consolidação de reflow ou modos de produto;
- mudanças de interface ou vocabulário;
- novos tipos, capacidades ou campos persistidos;
- alteração de schema.
