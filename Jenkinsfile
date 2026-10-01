pipeline {
  agent none
  options {
    skipDefaultCheckout(true)
    disableConcurrentBuilds()
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '30'))
    timeout(time: 45, unit: 'MINUTES')
  }
  environment {
    RESOURCE_GROUP = 'rg-carparts-devops'
    ACR_NAME = 'acrcarparts26179875'
    ACR_SERVER = 'acrcarparts26179875-fjh0d9bcetgwgvaw.azurecr.io'
    STAGING_APP = 'carparts-staging'
    PRODUCTION_APP = 'carparts-production'
  }
  stages {
    stage('Qualidade') {
      agent { label 'linux && docker && azure' }
      steps {
        checkout scm
        script { env.GIT_COMMIT = sh(script: 'git rev-parse HEAD', returnStdout: true).trim() }
        sh 'npm ci --ignore-scripts && npm run lint && npm run test:ci'
        stash name: 'source', includes: '**/*,.dockerignore', excludes: '.git/**,node_modules/**,reports/**'
      }
      post { always { junit 'reports/junit.xml' } }
    }
    stage('Imagem e homologação') {
      when { beforeAgent true; branch 'main' }
      agent { label 'linux && docker && azure' }
      steps {
        deleteDir()
        unstash 'source'
        withCredentials([
          string(credentialsId: 'azure-client-id', variable: 'AZ_CLIENT_ID'),
          string(credentialsId: 'azure-client-secret', variable: 'AZ_CLIENT_SECRET'),
          string(credentialsId: 'azure-tenant-id', variable: 'AZ_TENANT_ID'),
          string(credentialsId: 'azure-subscription-id', variable: 'AZ_SUBSCRIPTION_ID')
        ]) {
          sh '''#!/usr/bin/env bash
set -euo pipefail
set +x
export AZURE_CONFIG_DIR=$(mktemp -d)
export DOCKER_CONFIG=$(mktemp -d)
trap 'az logout >/dev/null 2>&1 || true; rm -rf "$AZURE_CONFIG_DIR" "$DOCKER_CONFIG"' EXIT
bash scripts/azure-login.sh
az acr login --name "$ACR_NAME" --output none
tag="$ACR_SERVER/carparts:$GIT_COMMIT-$BUILD_NUMBER"
docker build --build-arg APP_COMMIT="$GIT_COMMIT" --tag "$tag" .
docker push "$tag"
mkdir -p evidence
docker inspect --format='{{index .RepoDigests 0}}' "$tag" > evidence/image.txt
export IMAGE_DIGEST=$(cat evidence/image.txt)
export APP_NAME="$STAGING_APP"
bash scripts/deploy.sh > evidence/staging-smoke.json
'''
        }
        script { env.IMAGE_DIGEST = readFile('evidence/image.txt').trim() }
        stash name: 'release', includes: '**/*,.dockerignore', excludes: 'node_modules/**,.git/**'
        archiveArtifacts artifacts: 'evidence/*', fingerprint: true
      }
    }
    stage('Aprovação de produção') {
      when { branch 'main' }
      steps {
        timeout(time: 15, unit: 'MINUTES') {
          script {
            env.APPROVED_BY = input(message: "Promover ${env.IMAGE_DIGEST} (commit ${env.GIT_COMMIT})?", ok: 'Promover', submitter: 'admin', submitterParameter: 'APPROVER')
            env.APPROVED_AT = java.time.Instant.now().toString()
          }
        }
      }
    }
    stage('Produção: mesmo digest') {
      when { beforeAgent true; branch 'main' }
      agent { label 'linux && docker && azure' }
      steps {
        deleteDir()
        unstash 'release'
        script {
          writeFile file: 'evidence/approval.txt', text: "commit=${env.GIT_COMMIT}\nimage=${env.IMAGE_DIGEST}\napprover=${env.APPROVED_BY}\napprovedAt=${env.APPROVED_AT}\nbuild=${env.BUILD_URL}\n"
        }
        // Registra aprovação antes do deploy, inclusive se o deploy falhar.
        archiveArtifacts artifacts: 'evidence/approval.txt', fingerprint: true
        withCredentials([
          string(credentialsId: 'azure-client-id', variable: 'AZ_CLIENT_ID'),
          string(credentialsId: 'azure-client-secret', variable: 'AZ_CLIENT_SECRET'),
          string(credentialsId: 'azure-tenant-id', variable: 'AZ_TENANT_ID'),
          string(credentialsId: 'azure-subscription-id', variable: 'AZ_SUBSCRIPTION_ID')
        ]) {
          sh '''#!/usr/bin/env bash
set -euo pipefail
set +x
export AZURE_CONFIG_DIR=$(mktemp -d)
trap 'az logout >/dev/null 2>&1 || true; rm -rf "$AZURE_CONFIG_DIR"' EXIT
bash scripts/azure-login.sh
export APP_NAME="$PRODUCTION_APP"
bash scripts/deploy.sh > evidence/production-smoke.json
'''
        }
      }
      post { always { archiveArtifacts artifacts: 'evidence/*', fingerprint: true } }
    }
  }
  post {
    success { echo "Pipeline concluído: ${env.BUILD_URL}" }
    failure { echo "Pipeline falhou; consulte o estágio e os artefatos: ${env.BUILD_URL}" }
    aborted { echo 'Execução interrompida; nenhuma aprovação automática de produção.' }
  }
}
