# Incremento 05.28 — estabilização do fluxo Git

## Problema confirmado

O desenvolvimento estava correto, mas a publicação repetia descoberta de
worktrees históricos, tentativa de ferramentas ausentes e reconstrução manual
sem primeiro classificar o transporte disponível. O checkout canônico também
permanecia atrás dos commits integrados por squash.

## Contrato

- cada incremento parte do `origin/development` integrado em worktree limpa;
- branches de publicação usam o prefixo `agent/`;
- um pré-voo único verifica base, ancestralidade, sujeira e acesso remoto;
- push autenticado usa Git direto;
- ausência de credencial local seleciona o conector, sem ser confundida com
  falha de rede ou nova exigência de autorização;
- divergência remota ou identidade não comprovada continuam bloqueantes.

## Evidência reproduzida

- leitura HTTPS de `development` disponível;
- `git push --dry-run` falha por ausência de usuário/token local;
- autenticação do conector permanece independente;
- SSH não é uma alternativa confiável neste runtime;
- worktrees históricos são preservados como evidência, mas não são pesquisados
  novamente para iniciar novos incrementos.

## Limite técnico

O repositório não pode transferir a credencial privada do conector para o
executável `git`. Eliminar também o fallback exige uma credencial Git fornecida
pelo ambiente; enquanto isso, o pré-voo torna a seleção determinística.
