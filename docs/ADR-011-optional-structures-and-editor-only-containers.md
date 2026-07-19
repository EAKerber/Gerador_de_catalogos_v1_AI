# ADR-011 - Estruturas opcionais e contêineres exclusivos do editor

## Contexto

Slots vazios continuavam reservando geometria, e a hidratação automática não distinguia uma estrutura legada ainda não inicializada de uma remoção intencional. Além disso, a Área de composição é necessária no canvas, mas não representa conteúdo editorial no PDF.

## Decisão

Contêineres persistem `structureInitialized`. A criação e a migração inicializam seus filhos padrão uma vez; depois disso, remover todos os filhos continua válido após salvar e recarregar. O registro permanece responsável pela geometria de cada slot, permitindo que slots ocupados se expandam quando outro tipo desaparece.

O inspetor obtém do store os descritores padrão ausentes e oferece ações explícitas de restauração. A ação cria novos IDs e não recupera conteúdo excluído silenciosamente.

Separadores inseridos entre itens usam `layoutItem.overlay: true`, guardam os IDs do par adjacente e são reposicionados após o auto-layout. Eles não participam do cálculo de distribuição ou do mínimo do contêiner.

Na impressão, `layout-container` mantém sua subárvore, mas seu próprio fundo, borda e conteúdo auxiliar ficam transparentes. Todos os outlines e box-shadows editoriais também são neutralizados.

## Consequências

- remoção e restauração são explícitas e persistentes;
- documentos antigos continuam recebendo estruturas padrão;
- o rodapé pode ser editado e recolorido por átomo;
- separadores não distorcem a largura ou a altura dos itens;
- o PDF contém apenas conteúdo editorial, sem envelopes de composição.
