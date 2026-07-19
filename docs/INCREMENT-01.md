# Incremento 01 — escopo entregue

## Objetivo

Validar a espinha dorsal do editor sem antecipar edição aninhada ou vínculo com produtos.

## Fluxo validado

1. Abrir uma página A4 vazia.
2. Arrastar um componente da biblioteca.
3. Posicioná-lo usando seu grid mínimo.
4. Selecioná-lo na página ou nas camadas.
5. Alterar conteúdo e aparência no inspetor.
6. Mover e redimensionar dentro dos limites da página.
7. Salvar localmente ou exportar o documento como JSON.

## Regras atuais

- o zoom não altera as coordenadas salvas;
- o frame nunca sai da página;
- largura e altura respeitam mínimos do tipo;
- `Alt` ignora o snap durante a interação;
- `Shift` trava o movimento no eixo predominante;
- `freeX` e `freeY` têm prioridade sobre snap por eixo;
- tokens visuais são fechados e selecionáveis.

## Dívidas assumidas

- o renderer recria a camada de componentes após mudanças de estado;
- ainda não existe histórico de desfazer/refazer;
- não há importação de JSON pela interface;
- a persistência local guarda apenas um documento;
- o resize usa somente a alça inferior direita;
- não existem guias inteligentes entre elementos.

Essas limitações são conscientes e não impedem o Incremento 02.
