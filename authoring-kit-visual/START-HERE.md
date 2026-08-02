# Guia visual do CatalogAuthoringKit 1.7.2

Este complemento transforma os contratos do kit em decisões reconhecíveis na
interface e no resultado. Ele não substitui schemas, `capabilities.json` nem o
compilador: use a imagem para localizar e comparar; use o caminho JSON para
editar; use o relatório e os gates para aprovar.

## Começo em dez minutos

1. Abra [`interface/editor-map.svg`](interface/editor-map.svg) para reconhecer
   toolbar, biblioteca, canvas, inspetor e status.
2. Execute o tutorial
   [`01-first-page`](tutorials/01-first-page/README.md) uma vez, sem editar o
   documento compilado manualmente.
3. Escolha no [`visual-index.json`](visual-index.json) a intenção mais próxima
   do problema atual.
4. Compare o resultado com o cookbook indicado pelo tutorial.
5. Antes da entrega, siga
   [`07-delivery-gates`](tutorials/07-delivery-gates/README.md).

## Regra de autoridade

| Dúvida | Fonte de autoridade |
| --- | --- |
| “Onde fica?” | mapa da interface e captura real |
| “Qual composição escolher?” | tutorial e cookbook |
| “Qual propriedade/valor usar?” | `../authoring-patterns.json` e `../capabilities.json` |
| “O JSON é válido?” | schemas e compilador do núcleo |
| “Pode publicar?” | documento importado, relatório, gates renderizados, round-trip e PDF do editor |

Uma captura é orientação, não golden image. Os caminhos JSON e IDs ligados a
cada entrada do índice permanecem verificáveis mesmo que a interface mude de
posição.

Uma prévia paralela criada pelo agente é apenas diagnóstico. Ela não substitui
o documento importado no editor, o pacote reimportável nem o PDF gerado pelo
editor como resultado final.

## Estudos de caso

- [`catalogo-tecnico`](case-studies/catalogo-tecnico/README.md): evidência
  técnica conhecida e aderente ao escopo atual, sem função de template ou
  critério normativo. O ensaio cego final usa uma terceira referência inédita.
- [`promocional`](case-studies/promocional/README.md): benchmark pós-V1 não
  bloqueante. Mostra o limite entre receitas existentes e composição gráfica
  livre.

## Empacotamento

O ZIP autônomo **Kit de autoria** contém o núcleo e este complemento. Pacotes de
catálogo carregam somente o núcleo contratual, evitando duplicar as imagens em
cada projeto. `manifest.json` e o manifesto do núcleo registram tamanho e
SHA-256 de todos os arquivos.
