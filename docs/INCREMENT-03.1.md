# Incremento 03.1 — Estabilização do editor

## Objetivo

Estabilizar o ambiente de edição antes da biblioteca de artes. Esta etapa melhora a operação em telas reais, formaliza contratos necessários aos próximos incrementos e evita antecipar upload, inventário ou seleção múltipla.

## Entregue

### Workspace adaptável

- layout calibrado para `1366×768` com zoom do navegador em 100%;
- barra superior compactada sem alterar a hierarquia da aplicação;
- painéis laterais recolhíveis e persistidos no documento;
- modo **Ajustar** calcula a escala efetiva pela largura e altura disponíveis;
- mudança de janela e recolhimento de painéis recalculam a página;
- zoom manual continua disponível em 55%, 70%, 85% e 100%;
- frames A4 permanecem em coordenadas lógicas 794×1123.

### Vetores por token

- novo campo `style.vectorColor`;
- ícones, especificações, vetores de artes e ícones do rodapé usam a cor vetorial;
- fallback para `accentColor` preserva documentos anteriores;
- inspetor expõe **Cor do vetor** apenas nos tipos compatíveis.

### Duplicação simples

- botão no cabeçalho do inspetor;
- atalho `Ctrl+D`/`Cmd+D`;
- cópia profunda de containers e filhos;
- renovação recursiva de IDs;
- deslocamento de 16 px para componentes livres;
- manutenção de slot quando existe capacidade; fallback livre quando o slot está cheio;
- reinserção coerente em auto-layout.

### Coleções genéricas

- novo `app/collection-registry.js`;
- coleções padrão `assets`, `products` e `templates`;
- APIs de store para consultar, inserir/atualizar e remover itens;
- assets aceitam apenas referências e rejeitam dados binários/base64;
- artes recebem `props.assetId: null` como contrato preparatório.

### Cobertura da referência

`REFERENCE-IMAGE-COVERAGE.md` diferencia regiões cobertas, preparadas e adiadas. A matriz impede que um campo de schema vazio seja confundido com funcionalidade concluída.

## Schema 1.3.0

Adições obrigatórias:

- `collections` na raiz;
- `editor.zoomMode`;
- `editor.leftPanelCollapsed`;
- `editor.rightPanelCollapsed`;
- `props.assetId` em componentes `art`;
- referências de coleção com provider e key.

A migração de 1.0.0, 1.1.0 e 1.2.0 normaliza esses campos, preserva componentes existentes e mantém seleção/contexto transitórios limpos.

## Limites mantidos

- nenhuma seleção ou upload de arquivo;
- nenhum blob/base64 no JSON;
- nenhuma renderização real de `assetId`;
- nenhuma seleção múltipla ou distribuição coletiva;
- nenhuma tabela com múltiplas linhas;
- nenhuma legenda vinculada à arte;
- nenhuma alteração nos contratos de coordenadas locais, slots ou auto-layout.
