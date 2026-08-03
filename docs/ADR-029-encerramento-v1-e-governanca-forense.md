# ADR-029 — Encerramento da V1 e governança forense

- **Status:** aceita
- **Data:** 2026-08-02
- **Decisor:** usuário
- **Escopo:** transição da V1 para análise pré-V2

## Contexto

A V1 acumulou capacidades, contratos e testes relevantes, mas o ensaio em
início frio do Authoring Kit 1.7.2 mostrou divergência entre validade
estrutural e qualidade materializada. Zero colisões e overflows estruturais não
impediram truncamentos ou composição insatisfatória; o preview paralelo e o
PDF do editor divergiram; políticas textuais de imagem não viraram decisões de
enquadramento; correções locais passaram a atravessar várias camadas.

Continuar corrigindo sintomas aumentaria o custo de provar se a arquitetura
atual merece ser preservada. Iniciar uma “refatoração geral” também escolheria
prematuramente o esqueleto da solução.

## Decisão

1. Encerrar a V1 para desenvolvimento funcional e preservá-la como protótipo
   técnico, sem classificá-la como produto satisfatório ou publicável.
2. Executar uma autópsia rígida antes de qualquer V2.
3. Tratar a futura solução como reconstrução seletiva até que a análise prove
   quais módulos e contratos merecem ser reutilizados.
4. Bloquear correções da V1, novas funcionalidades, Authoring Kit 1.7.3,
   scaffold V2 e migração V1→V2 durante a autópsia.
5. Exigir quatro gates antes da decisão arquitetural: relatório de
   encerramento, matriz de disposição, contrato de qualidade e comparação de
   alternativas.
6. Manter uma única fonte operacional de verdade descoberta por padrão:
   `AGENTS.md` → `docs/START-HERE.md` → `STATUS/CHECKPOINT`.
7. Não criar branch documental permanente. Usar branches `agent/*` curtas e
   integrar documentação revisada ao plano de controle.
8. Após o encerramento analítico, promover o estado final, criar a branch
   protegida `archive/v1` e a tag anotada `v1.0.0-prototype`, confirmar por
   readback e somente então podar refs temporárias elegíveis.

## Governança transitória

Até a promoção final, `development` continua sendo a base transitória porque
contém o estado funcional mais completo da V1. `main` não será movida pela
mudança inicial de entrypoints. A passagem de `development` para `main` será
uma operação explícita de encerramento, não um merge incidental de produto.

Após essa passagem, `main` será o plano de controle documental. Mudanças de
autópsia continuarão por branches curtas e PRs. A criação de uma branch `v2`
fica proibida até a ADR arquitetural posterior.

## Alternativas consideradas

### Continuar estabilizando a V1

Rejeitada. Os gates atuais não medem adequadamente o objetivo e correções
pontuais deslocam falhas entre camadas.

### Iniciar uma grande refatoração imediatamente

Rejeitada. Presume que as abstrações e fronteiras atuais devem sobreviver antes
de a evidência classificá-las.

### Reescrever tudo do zero

Rejeitada como decisão antecipada. Infraestrutura de pacote, hashes, fixtures,
CI e disciplina factual pode ter valor comprovável.

### Manter uma branch `docs` permanente

Rejeitada. Criaria segunda fonte de verdade e permitiria que agentes iniciados
no branch padrão ignorassem decisões vigentes.

### Podar refs antes do snapshot

Rejeitada. A poda é destrutiva e a relação por squash exige comprovação por PR,
não somente ancestralidade Git.

## Consequências

- O ritmo deliberadamente diminui; isso é aceitável e desejado.
- Bugs conhecidos podem permanecer reproduzíveis e sem correção.
- Documentos históricos continuarão contendo estados superados, mas ganharão
  ponte explícita para o checkpoint vigente.
- A compatibilidade com V1 deixa de ser premissa e passa a decisão futura.
- A V2 só começa quando houver critérios mensuráveis para rejeitar seu primeiro
  corte vertical.

## Critérios de revisão desta decisão

Revisar a decisão somente se surgir evidência de que:

- os problemas centrais são localizados e independentes das fronteiras
  arquiteturais; ou
- a preservação de uma capacidade exige correção mínima na V1 para tornar a
  autópsia possível.

Mesmo nesses casos, registrar nova ADR e autorização explícita antes de mudar
o código do produto.
