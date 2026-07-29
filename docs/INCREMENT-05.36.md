# Incremento 05.36 — reflow e histórico no store canônico

## Direção

Continuar a consolidação interna da V1 single-page sem alterar interface,
schema, geometria observável ou formatos persistidos.

## Problema confirmado

A convergência de reflow antes do histórico ainda dependia de uma subclasse
instalada depois do store canônico. O contrato substituía construtor, `emit`,
reflow manual e restauração de snapshots, tornando undo, dirty state e
geometria dependentes da ordem de carregamento.

## Contrato

- o store canônico estabiliza raízes gerenciadas na construção e antes de
  capturar uma mutação;
- reflow manual sincroniza o baseline sem criar uma ação artificial;
- undo e redo restauram e estabilizam a geometria antes de expor o estado;
- o diagnóstico da última estabilização permanece disponível;
- o módulo tardio preserva a API pública, mas não substitui classe ou métodos;
- subclasses de apresentações continuam herdando o mesmo comportamento.

## Gates

- identidade da classe e de `emit` antes/depois da instalação;
- geometria convergida na construção, mutação, undo, redo e importação;
- dirty state e baseline após reflow manual;
- paridade entre runtime principal e Authoring Kit;
- regressão Node, build e Chromium multirreferência;
- schema `1.16.0`, tipos e capacidades preservados.

## Fora do incremento

- consolidação das subclasses `variants` e `data-only`;
- mudanças de interface, schema ou vocabulário;
- novos tipos, capacidades ou regras de layout.
