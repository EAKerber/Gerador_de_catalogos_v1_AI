# ADR-024 — Operação local-first e colaboração browser-only

- **Status:** aceito
- **Data:** 2026-07-17
- **Impacto:** produto, persistência, hospedagem e colaboração

## Contexto

O editor precisa continuar disponível pelo navegador, funcionar sem conta e preservar a propriedade local do projeto. Hospedagem pública é desejável, mas não deve introduzir um backend central que armazene catálogos. A colaboração prevista é pequena, eventual e entre pessoas conhecidas; indisponibilidade dessa extensão não pode bloquear o editor individual.

## Decisão

1. O editor é publicado como aplicação estática por Git.
2. Documento, assets e histórico permanecem no navegador do usuário e em pacotes/snapshots exportados explicitamente.
3. IndexedDB é cache/sessão, não backup suficiente nem autoridade compartilhada.
4. Quem inicia uma sala é o **hoster** e mantém o projeto canônico em sua aba.
5. Só o hoster importa JSON, pacote, fonte semântica ou qualquer artefato que substitua/regenere o projeto inteiro.
6. Participantes entram como visualizadores; edição é desligada por padrão e concedida pelo hoster.
7. Colaboradores podem propor comandos, assets e objetos. O hoster valida, serializa e aceita/rejeita antes de publicar o novo estado.
8. A sala usa link, senha, limite de participantes, apelido ilustrativo e log por ID efêmero. Não existe login nem garantia de identidade.
9. O transporte ao vivo usa `RTCDataChannel` direto. Um serviço próprio de sinalização mantém somente estado efêmero de sala e negociação.
10. O protótipo não usa TURN. Conexões incompatíveis falham de forma explícita e recorrem a download/importação manual de snapshot.
11. Se o hoster sair, a sala termina; não há eleição automática nem transferência implícita de autoridade.

## Ordem de implementação

1. checkpoints, download e restauração de snapshots;
2. comparação/importação de propostas assíncronas;
3. protocolo versionado de comandos e permissões;
4. sinalização e sala WebRTC direta;
5. benchmark e decisão posterior sobre limites, autoaceite, retenção de log e eventual TURN.

## Consequências positivas

- o usuário conserva controle e portabilidade dos projetos;
- o host estático pode permanecer gratuito e substituível;
- uma falha de colaboração não ameaça edição, exportação ou recuperação;
- operações compostas, histórico e reflow continuam centralizados no store autoritativo;
- custos e manutenção de relay ficam fora do protótipo.

## Custos e limitações aceitos

- o hoster precisa manter a aba ativa;
- algumas redes não permitirão colaboração ao vivo sem TURN;
- não existe recuperação automática caso nenhum participante tenha exportado snapshot;
- senha de sala controla acesso, mas não impede cópia de tela ou redistribuição;
- edição concorrente do mesmo alvo precisa de fila ou conflito explícito;
- aliases do log não constituem auditoria de identidade.

## Não objetivos

- backend central de documentos;
- conta, login ou autenticação de identidade;
- sincronização automática entre dispositivos;
- CRDT no primeiro corte;
- armazenamento de catálogo no serviço de sinalização;
- paridade de colaboração em mobile;
- TURN antes de evidência operacional.

## Critérios para reconsiderar TURN

TURN somente volta à decisão se testes reais mostrarem taxa de falha P2P incompatível com o uso pretendido, e depois de medir conexões por navegador/rede, volume de bytes, duração de sala e custo operacional — sem coletar conteúdo de projeto.
