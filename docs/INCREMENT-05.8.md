# Incremento 05.8 — Estruturas prontas e inserção contextual

## Objetivo

Reduzir as ações de montagem manual que ainda antecediam o cadastro e o refinamento em lote, mantendo todos os resultados como componentes comuns, editáveis e reversíveis.

## Entrega

- registro oficial `CatalogSectionRecipes 1.0.0`;
- receita **Página-base de catálogo**, com cabeçalho, conteúdo principal e rodapé;
- receitas **Faixa de aplicações**, **Legenda de embalagens** e **Dica editorial**;
- foco automático na área principal da página-base;
- inserção por `+` para componentes, receitas e itens salvos;
- escolha automática do primeiro slot compatível ou espaço livre;
- drag and drop preservado para posicionamento exato;
- hidratação dos filhos padrão e IDs novos em cada instância;
- uma transação de histórico por receita;
- receitas publicadas no manifesto de capacidades e no `CatalogAuthoringKit 1.2.0`.

## Arquitetura

Uma receita contém o snapshot de um componente raiz e metadados de descoberta. Sua inserção usa o caminho já existente de templates reutilizáveis; depois do commit, não existe uma entidade de layout paralela nem vínculo obrigatório com a receita de origem.

O posicionamento automático é uma intenção diferente do drag. Slots usam compatibilidade e capacidade. Contextos livres usam busca determinística alinhada ao grid, respeitando bordas e componentes existentes. Se nenhuma posição for segura, o editor informa a impossibilidade e não cria uma sobreposição.

## Medição

| Subfluxo | Antes | 05.8 | Redução |
| --- | ---: | ---: | ---: |
| Cabeçalho + área principal + rodapé + entrar na área | ≥4 comandos | 1 ação | ≥75% |
| Página-base + cadastrar sete produtos + criar/vincular sete cards | não medido como unidade nos incrementos anteriores | 6 ações | linha de base criada |

O segundo ensaio terminou com uma raiz de página, sete cards dentro do conteúdo principal, zero colisão e zero overflow. A contagem integral de 319 ações da reconstrução de referência ainda precisa ser repetida.

## Testes acrescentados

- contrato do registro e filtragem por contexto;
- hidratação recursiva de cabeçalho e rodapé;
- foco no papel `primary-content`;
- sete cards na grade sem colisão ou overflow;
- receita de aplicações como uma única transação;
- posicionamento livre de duas inserções sucessivas;
- preferência de slot compatível;
- fluxo real em Chromium 1366×768 e desfazer integral.

## Fora do incremento

- seleção por caixa e transformação de grupos por arraste;
- previsão ampla e adaptativa da próxima intenção;
- paginação automática e balanceamento multipágina;
- repetição completa do ensaio humano de 319 ações.
