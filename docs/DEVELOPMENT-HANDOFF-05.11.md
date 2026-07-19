# Handoff de desenvolvimento — Incremento 05.11

**Status:** concluído. A implementação está registrada em `INCREMENT-05.11.md`; antes da auditoria 05.12, o painel esquerdo foi equiparado ao direito como ajuste explícito de baseline (`310 px` amplo, `294 px` notebook).

## Objetivo

Sanear as duas regressões visuais confirmadas e transformar as capacidades já existentes em um atlas utilizável por pessoas e agentes. O incremento prepara uma nova auditoria de construção manual sem introduzir funcionalidades de plataforma.

## Ordem de execução

1. capturar testes que reproduzam a colisão da toolbar e a sobreposição dos cards;
2. implementar hierarquia responsiva da barra de comandos;
3. implementar regiões estáveis nos cards da biblioteca;
4. gerar o inventário técnico a partir do manifesto de capacidades;
5. escrever o primeiro guia curado e validar suas referências;
6. executar testes em 1280, 1366 e 1800 px, navegação por teclado e smoke test existente;
7. registrar evidências, atualizar documentação e empacotar o incremento.

## Contrato visual

### Barra de comandos

- Documento e Histórico permanecem acionáveis na faixa principal.
- Visualização pode ser condensada em agrupamento/menu antes de qualquer corte.
- A preferência continua acessível pelo mesmo modelo de estado e por teclado.
- Nenhum controle pode ter hitbox sobreposta ou provocar scroll horizontal da página.

### Cards da biblioteca

- ícone, texto, `+` e menu secundário ocupam regiões distintas;
- título usa no máximo duas linhas e descrição tem truncamento deliberado;
- `+` é a ação primária; menu secundário não disputa a mesma área;
- nenhuma ação essencial depende exclusivamente de hover;
- os mesmos critérios valem dentro de contexto interno e painel estreito.

## Atlas funcional

O manifesto é a fonte técnica. O incremento produz:

- inventário gerado de IDs, tipos, slots, propriedades, presets, ações e atalhos;
- guia curado por intenção com acesso, pré-condição, resultado, exemplo, limites e contrato;
- validação que falha em referências curadas inexistentes;
- caminho documentado para regeneração.

## Fora de escopo

- mudança de `CatalogDocument` ou migração implícita;
- redução de ações manuais além dos reparos necessários;
- repetição do ensaio de 319 ações, reservada ao 05.12;
- deploy público;
- snapshots, colaboração, sinalização, WebRTC ou TURN;
- redesign ou paridade mobile;
- paginação multipágina e regras cromáticas condicionais avançadas.

## Definição de pronto

- critérios de `BACKLOG.md` e `ROADMAP.md` satisfeitos;
- regressões cobertas antes e depois do reparo;
- testes geométricos sem interseções nos três viewports;
- fluxo crítico navegável por teclado;
- atlas regenerável e sem IDs quebrados;
- documentação coerente com `PRODUCT-DEFINITION.md`, `ARCHITECTURE.md` e `ADR-024-browser-local-first-collaboration.md`;
- nenhuma regressão nos testes existentes;
- pacote completo do incremento gerado somente ao final.
