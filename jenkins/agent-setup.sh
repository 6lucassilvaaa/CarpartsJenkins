#!/usr/bin/env bash
# Execute no host/agente Ubuntu 24.04 dedicado, depois de instalar Docker
# pela documentação oficial. O acesso ao daemon é equivalente a root:
# este agente não deve guardar dados reais de ERP nem executar PRs desconhecidas.
set -euo pipefail
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg openjdk-21-jre-headless git
# NodeSource e Microsoft: repositórios oficiais, sem executar curl | bash.
sudo install -d -m 0755 /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
echo 'deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_24.x nodistro main' | sudo tee /etc/apt/sources.list.d/nodesource.list >/dev/null
curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | sudo gpg --dearmor --yes -o /etc/apt/keyrings/microsoft.gpg
echo 'deb [arch=amd64 signed-by=/etc/apt/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/azure-cli/ noble main' | sudo tee /etc/apt/sources.list.d/azure-cli.list >/dev/null
sudo apt-get update
sudo apt-get install -y nodejs azure-cli
az extension add --name containerapp --upgrade
node --version
npm --version
docker --version
az version
# Baixe agent.jar e use o comando WebSocket mostrado na página do nó Jenkins.
# Guarde o segredo do agente em arquivo local protegido, nunca neste repositório.
