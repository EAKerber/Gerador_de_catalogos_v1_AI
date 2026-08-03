# Ledger de PRs, CI e refs da V1

## Autoridade e limite

Este ledger foi reconstruído por leitura remota do GitHub em 2 de agosto de
2026. O checkout local é raso e não é autoridade para a ancestralidade completa
anterior ao checkpoint. SHAs de heads preservam identidade histórica; PRs
integradas por squash não precisam ser ancestrais diretas do head atual.

## Inventário de PRs

- 48 PRs numeradas de `#1` a `#48`;
- 44 integradas;
- 4 encerradas sem merge;
- 47 tiveram base `development`;
- somente a `#28` promoveu `development` para `main`.

### Fases

| Faixa | Papel histórico | Resultado |
| --- | --- | --- |
| #1–#2 | auditoria externa 05.18 e integração curada 05.20 | #1 não mesclada por desenho; #2 integrou 50 commits selecionados |
| #3–#27 | expansão e consolidação do editor/kit | integradas em `development` |
| #28–#30 | primeira promoção a `main`, CI de promoção e reabertura prática | #28 promoveu; #30 iniciou a fase pós-promoção |
| #31–#39 | resposta ao ensaio prático e guia visual | integradas; PRs operacionais de poda posteriores foram fechadas |
| #40–#47 | integridade textual/factual, enquadramento e kit 1.7.2 | mudanças funcionais #41, #43, #45–#47 integradas |
| #48 | congelamento e governança forense | integrado; nenhum código funcional alterado |

### PRs que sustentam decisões da autópsia

| PR | Título | Head preservado | Resultado |
| ---: | --- | --- | --- |
| #1 | Auditoria — não mesclar — Developer B 05.18 | `deec36ab49c14f480294b14192016df409294e43` | encerrada sem merge; 489 commits brutos não foram promovidos |
| #2 | 05.20 — integrar linguagem promocional com gates completos | `6ecd9b70b897a18020676fb28344f454e399a704` | integrada; seleção curada de 50 commits |
| #28 | V1 — consolidar development em main | `f29e79c855399b985e04332893550e053b95e112` | única promoção a `main`; 41 commits declarados na PR |
| #30 | 05.47 — reabrir validação prática da V1 | `5491fcd7b7b098a0cdd8bd23980499fb56341e28` | reabriu investigação depois da promoção |
| #35 | 05.52 — preservar fixture do ensaio real | `5aac8c6900a8fd37804c9d9b3ac2271f8e5450cb` | fixture externa versionada |
| #41 | 05.56 — detectar integridade textual renderizada | `53973f70532b0646e3b5e0bceb8972f45bea5ce9` | gate DOM introduzido |
| #43 | 05.57 — integridade factual e footer declarativo | `eecf33181d3d71426f88fc6da6d9e1eb7f519b9f` | defaults comerciais/footer saneados |
| #45 | 05.59 — enquadrar artes por instância | `8124ffcfd22c421597dc058f6024d57f78a5ccc5` | capacidade do editor introduzida |
| #46 | 05.59B — executar ensaio causal de enquadramento | `8fe866b186565e5013b4b6d72e7b0ede0bad1567` | evidência causal integrada |
| #47 | 05.60 — publicar Authoring Kit 1.7.2 | `ba2e05cb361bfb23c2859c0c8f82e74891c9bbc3` | último incremento funcional |
| #48 | 05.61 — iniciar transição forense da V1 | `dcd7c04804c2a247bdaf8903763c9caeee81b4df` | entrada documental urgente integrada |

### PRs encerradas sem merge

| PR | Motivo verificável | Head |
| ---: | --- | --- |
| #1 | declarada auditoria e “não mesclar”; integração ocorreu de forma curada na #2 | `deec36ab49c14f480294b14192016df409294e43` |
| #38 | PR operacional de poda de branches já integradas | `976ef8bcac654cbcf4c2c8386ccb52c485756db6` |
| #40 | PR operacional de poda da branch 05.55 | `03e7810239190a4e8ae9aa188fa6fe5e495d8aa6` |
| #42 | PR operacional de poda da branch 05.56 | `bb7aa2c92df2c4e1547af4130b8c86b78eebbb57` |

Encerrada sem merge não significa trabalho funcional abandonado para #38, #40
e #42: eram operações de higiene, enquanto as PRs funcionais correspondentes
já haviam sido integradas.

## CI com identidade preservada

| Marco | Execução | Resultado registrado |
| --- | --- | --- |
| PR #2 / 05.20 | Actions `30053295259` | 86 contratos Node + 63 Chromium na descrição da integração |
| PR #43 / 05.57 | Actions `30723805650` | gate oficial aprovado |
| PR #46 / 05.59B | Catalog Integration `#158` | Node/schema/build e 4/4 shards Chromium |
| PR #47 / 05.60 | Actions `30732107645` / Catalog Integration `#160` | Node/schema/build e 4/4 shards Chromium; 116 contratos Node após ajuste determinístico de teste |
| PR #48 / 05.61 | Actions `30780133606` / Catalog Integration `#161` | Node/schema/build e 4/4 shards Chromium |

Ausência de run ID nesta tabela não significa ausência de CI histórica; apenas
indica que o identificador não foi consolidado nesta unidade. Não se deve
inventá-lo a partir do número da PR.

## Refs remotas no corte

| Ref | SHA | Classificação |
| --- | --- | --- |
| `main` | `050589347e55613182a00ed1e22f6efd2f1a2540` | promoção anterior; 16 commits atrás de `development`, 0 à frente |
| `development` | `efe9c063404910e902b109f340ff2dab7358876e` | controle transitório após PR #48 |
| `agent/integridade-footer-05.57` | `eecf33181d3d71426f88fc6da6d9e1eb7f519b9f` | head da PR #43 integrada |
| `agent/handover-atualizado-05.58` | `32f7dca01bac06575e9eea90c6af93cf813c7724` | head da PR #44 integrada |
| `agent/enquadramento-art-05.59` | `8124ffcfd22c421597dc058f6024d57f78a5ccc5` | head da PR #45 integrada |
| `agent/ensaio-causal-art-05.59b` | `8fe866b186565e5013b4b6d72e7b0ede0bad1567` | head da PR #46 integrada |
| `agent/authoring-kit-1.7.2` | `ba2e05cb361bfb23c2859c0c8f82e74891c9bbc3` | head da PR #47 integrada |
| `agent/transicao-forense-v1` | `dcd7c04804c2a247bdaf8903763c9caeee81b4df` | head da PR #48 integrada |

Não havia tags remotas no corte. `archive/v1` e `v1.0.0-prototype` continuam
planejadas, não criadas.

## Regra de poda

As seis refs `agent/*` listadas são candidatas futuras porque suas PRs estão
integradas. Elas não foram apagadas porque o snapshot final ainda não existe.
A poda somente será autorizada depois de:

1. aprovação dos gates analíticos;
2. promoção formal do estado final;
3. criação e readback de `archive/v1` e da tag anotada
   `v1.0.0-prototype`;
4. confirmação de que nenhuma PR aberta depende da ref literal;
5. verificação individual pelo histórico da PR, sem depender apenas de
   ancestralidade após squash.

