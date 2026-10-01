# Execução da prática E2–E6

## O que foi feito

- Grupo Azure `rg-carparts-devops`, East US 2.
- ACR `acrcarparts26179875`, Basic, provisionamento Succeeded.
- Host confirmado: `acrcarparts26179875-fjh0d9bcetgwgvaw.azurecr.io`.
- API Node 24 demonstrativa e testes HTTP reais locais; saída JUnit gerada.
- Dockerfile da aplicação, imagem customizada do controller, plugins e JCasC.
- Jenkinsfile preparado com qualidade, publicação por commit/build, homologação, smoke com verificação de commit, aprovação e promoção do mesmo digest.

Os arquivos de Jenkins/Docker/Bicep ainda precisam de execução real. Teste local da API não comprova deploy Azure nem execução Jenkins.

## E2 — Jenkins

1. Instalar Docker Desktop pelo site oficial no Windows e habilitar Linux containers/WSL 2; concluir licenciamento e eventual reinicialização pessoalmente. Alternativa: Ubuntu 24.04 com Docker Engine.
2. Copiar `jenkins/.env.example` para `jenkins/.env` e definir senha local forte. Arquivo ignorado pelo Git.
3. Executar `docker compose -f jenkins/compose.yaml --env-file jenkins/.env up -d --build`.
4. Entrar em http://localhost:8080 com usuário `admin`; salvar evidência de inicialização e tela mostrando zero executores no controller.
5. Preparar agente Linux dedicado usando `jenkins/agent-setup.sh` e Docker oficial. Abrir o nó `linux-docker-azure` e usar o comando inbound WebSocket fornecido pelo próprio Jenkins. Nunca versionar seu segredo. Ajustar remoteFS se necessário.
6. As tags LTS e plugins seguem canais oficiais, mas precisam ser fixados em versões/digests após a primeira inicialização validada para reproduzir exatamente o ambiente.

## E4 — Azure e permissões

Concessões ainda não efetuadas. Criar uma identidade do Jenkins com **AcrPush somente no ACR** e **Container Apps Contributor somente no grupo do laboratório**. Sem Owner nem Contributor da assinatura. Criar uma identidade gerenciada separada para os apps, com **AcrPull somente no ACR**. Nenhuma chave de administrador do ACR é necessária.

Se o tenant escolar proibir registro de aplicativos, o administrador deverá permitir/criar a identidade; não ampliar permissões para contornar a regra. Credencial do Jenkins com validade curta e rotação; guardar segredo apenas em Jenkins Credentials, IDs:

| ID | Tipo |
|---|---|
| `azure-client-id` | Secret text |
| `azure-client-secret` | Secret text |
| `azure-tenant-id` | Secret text |
| `azure-subscription-id` | Secret text |

Antes do primeiro pipeline completo, construir/publicar a imagem inicial com o mesmo Dockerfile e registrar seu digest. Provisionar os apps com `infra/apps.bicep`, digest real e identidade AcrPull autorizada. Usar `az deployment group what-if` antes de aplicar. Apps são demos públicas HTTPS, sem dados de clientes; acesso público e novos recursos dependem de autorização.

O template usa Consumption, 0–1 réplica, 0.25 vCPU/0.5 GiB e sem Log Analytics automático. Bicep ainda não foi compilado/aplicado neste computador. A franquia gratuita é compartilhada pela assinatura e não garante custo zero; controlar requisições e crédito disponível.

## E3 e E5 — Pipeline e GitHub

1. Criar job **Multibranch Pipeline** com origem `6lucassilvaaa/CarpartsJenkins`, Jenkinsfile na raiz, descoberta de main e PRs.
2. Configurar credencial GitHub com escopo mínimo para status/checks; não reutilizar token amplo no repositório. Para PRs desconhecidas, agente isolado sem Docker privilegiado e sem credenciais cloud.
3. Habilitar Scan Multibranch periódico enquanto Jenkins estiver local. Webhook somente após endpoint HTTPS seguro e secret de validação.
4. Rodar main. Aprovação está limitada ao usuário local `admin`, registrada com horário, commit, digest e build. Trocar por usuários/grupo identificados em uso compartilhado. Se aprovação expirar, produção não é executada.
5. Após existir check real de Jenkins, proteger main com PR obrigatória e check obrigatório; verificar disponibilidade dessas regras no plano GitHub.
6. Salvar JUnit, logs, digest, smoke de staging e produção, aprovação e status GitHub. Uma falha de qualidade impede build/deploy.

## E6 — Evidências e métricas

Preencher `docs/execucoes.csv` com **pelo menos 10 execuções reais**. Incluir falha controlada de teste, correção, rejeição/expiração da aprovação e promoção aprovada. Não fabricar execuções ou horários.

Calcular lead time como `deploy_at - commit_at`; comparar baseline de 11 dias (264 horas) com meta de até 48 horas em dois meses. Frequência: deploys aprovados por período. Change failure rate: deploys de produção que causaram falha / deploys de produção. Tempo de recuperação: `recovered_at - incident_at`. Falha de teste antes de produção é falha de pipeline, não change failure de produção.

ACR Basic em East US 2 foi cotado no portal oficial em US$0.167/dia (~US$5.01 em 30 dias), com adicionais de armazenamento/rede. Registrar custo **real** em Cost Management após atualizar a cobrança. Orçamento do enunciado US$150/mês não deve ser gasto automaticamente. Criar alerta de custo e remover recursos do laboratório ao encerrar, após salvar evidências e confirmar a exclusão.
