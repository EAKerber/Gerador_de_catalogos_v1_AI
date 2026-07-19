# Incremento 04.4 - Ocupação múltipla de slots

## Entrega

- `slot.span` persistido no documento e validado pelo schema `1.7.0`;
- migração automática de referências antigas para `span: 1`;
- capacidade calculada pela soma das unidades ocupadas;
- controle **Espaços ocupados** no inspetor para slots coletivos;
- distribuição proporcional em linha, coluna e grade;
- duplicação, inserção, movimentação e substituição respeitam a capacidade ponderada;
- testes de domínio e navegador para persistência, limite e geometria.

## Continuidade

As capturas recebidas originaram três critérios P1 para o Incremento 04.5: fidelidade canvas×PDF de linhas finas, reflow recursivo Auto/Manual e mínimo vertical real de Áreas de composição com cards/tabelas.
