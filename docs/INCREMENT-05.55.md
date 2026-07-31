# Incremento 05.55 — guia visual do Authoring Kit

## Objetivo

Reduzir a distância entre conhecer um contrato e reconhecer quando e onde
usá-lo. O incremento adiciona um complemento visual/tutorial ao
`CatalogAuthoringKit` sem alterar `CatalogDocument 1.16.0`, geometria, runtime de
renderização ou escopo single-page.

## Entrega

- `CatalogAuthoringKit 1.7.0` continua sendo o núcleo textual e executável;
- `CatalogAuthoringVisualGuide 1.0.0` contém entrada visual, mapa da interface,
  sete microtutoriais, cinco comparações de cookbook, troubleshooting, exemplo
  compilado e dois estudos de caso;
- `visual-index.json` vincula intenção a fluxos, capacidades, componentes,
  receitas, arquivos e previews;
- cada arquivo do complemento possui tamanho, MIME, papel e SHA-256;
- o manifesto do núcleo fixa o SHA-256 do manifesto visual;
- o ZIP autônomo do botão **Kit de autoria** reúne os dois artefatos;
- pacotes de catálogo continuam transportando apenas o núcleo.

## Referências

- catálogo técnico: referência forte/canônica da V1, hash
  `4262171d057c6daedd47cd192600fa9f826d739552b4a4c84f38c917c010f2f6`;
- peça promocional: benchmark pós-V1 não bloqueante, hash
  `dfdf29abd4d82f207071e482cb6f49bfd893f28a741039f1e38cffd02b4ab586`.

Ambas são evidências externas e material pedagógico; nenhuma é golden image.
Como a referência técnica agora foi decomposta, o ensaio cego final precisa
usar uma terceira referência inédita.

## Capturas

A captura de interface e o canvas incluídos são evidências reais do 05.17, com
proveniência explícita e contratos revalidados no 05.55. O procedimento
`npm run capture:visual-guide` produz capturas atuais quando o Chromium oficial
está disponível. A indisponibilidade local não permite rotular bytes antigos
como captura nova.

## Gates

- build visual e build do núcleo idempotentes;
- validação Draft 2020-12 do índice;
- IDs do índice resolvidos contra guia, capacidades, componentes e receitas;
- hashes de todos os arquivos e das duas referências;
- exemplo executável com sete produtos, zero colisões, zero overflow e zero
  correções pendentes;
- prova de que o bundle textual não contém binários visuais;
- prova de que pacote de catálogo não contém o complemento;
- Chromium oficial valida o ZIP autônomo completo.
