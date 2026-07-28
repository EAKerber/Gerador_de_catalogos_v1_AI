# Incremento 05.40 — Confirmação determinística de referências Git

## Causa

O helper de publicação exigia SHA no acknowledgement de toda escrita. O
conector `create_branch`, porém, confirma a referência pelo nome e deixa a
identidade do commit para a leitura posterior da branch. Três respostas válidas
foram, por isso, classificadas como `acknowledgement-incompleto`.

## Correção

- selecionar explicitamente a identidade esperada de cada acknowledgement;
- aceitar nome ou `refs/heads/...` como identidade da criação de branch;
- normalizar o SHA nas formas reais de readback `commit.sha` e `object.sha`;
- continuar exigindo o SHA esperado no readback independente;
- classificar nome ausente ou divergente sem repetir a escrita;
- bloquear readback sem SHA verificável ou com SHA divergente.

## Fora do escopo

- alterações no editor, schema, tipos, capacidades ou referências visuais;
- relaxamento da confirmação remota;
- modificação do conector externo.

## Gates

- contrato Node para acknowledgement por SHA e por nome de branch;
- suíte Node completa;
- pré-voo e publicação real usando a política por referência.
