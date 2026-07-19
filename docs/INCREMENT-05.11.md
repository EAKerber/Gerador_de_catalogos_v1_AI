# Incremento 05.11 — Saneamento visual e atlas funcional

## Objetivo

Eliminar as duas regressões visuais confirmadas no chrome do editor e publicar uma referência operacional derivada do manifesto para pessoas e agentes, sem alterar o schema do catálogo.

## Entregas

- barra de comandos separada em Documento, Histórico e Visualização;
- preferências de visualização inline em viewport amplo e condensadas em menu abaixo de 1500 px;
- comandos primários preservados em 1280, 1366 e 1800 px;
- cards da biblioteca com colunas explícitas para ícone, texto e ações;
- painel esquerdo equiparado ao direito: 310 px em desktop amplo e 294 px no alvo de notebook;
- título limitado a duas linhas e descrição limitada a três, sem sobreposição;
- foco visível por teclado nas ações modificadas;
- `feature-inventory.json` gerado com todas as capacidades, componentes, campos, slots, receitas, apresentações, tokens e ícones;
- `feature-guide.json` com fluxos curados por intenção;
- `FEATURE-CATALOG.md` gerado para leitura humana;
- `CatalogAuthoringKit 1.5.0` autocontido;
- testes estáticos e teste Playwright geométrico para os três viewports.

## Contratos preservados

- `CatalogDocument 1.16.0` permanece inalterado;
- nenhuma migração foi necessária;
- IDs dos controles de visualização foram preservados;
- o manifesto de capacidades continua sendo fonte técnica;
- o inventário gerado não deve ser editado manualmente;
- colaboração, hospedagem, mobile e multipágina permanecem fora do runtime.

## Validação

- `node tools/build-authoring-kit.js` valida todas as referências curadas;
- `node tests/chrome-responsive-contract.test.js` cobre estrutura e CSS;
- `node tests/feature-catalog.test.js` compara manifesto, inventário, curadoria e documento humano;
- `tests/browser-chrome-responsive.test.js` mede corte, colisão, overflow, menu, teclado e cards em 1280/1366/1800;
- a suíte existente continua cobrindo store, compilação, pacote, impressão e edição semântica.

O navegador empacotado do ambiente de desenvolvimento não estava disponível durante a implementação. O teste Playwright foi entregue completo e aceita `CATALOG_CHROMIUM_EXECUTABLE` para execução com Chrome/Chromium externo; essa limitação não reduz os critérios do teste.
