targetScope = 'resourceGroup'
param location string = resourceGroup().location
param environmentName string = 'carparts-env'
param acrName string = 'acrcarparts26179875'
@description('Digest da imagem real construída e enviada pelo Jenkins. Não use imagem de exemplo.')
param imageDigest string
@description('Client ID da identidade gerenciada com AcrPull no ACR; criada separadamente após autorização.')
param pullIdentityClientId string
param pullIdentityResourceId string

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: acrName
}

resource environment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: environmentName
  location: location
  properties: {
    appLogsConfiguration: { destination: 'none' }
    workloadProfiles: [{ name: 'Consumption', workloadProfileType: 'Consumption' }]
    zoneRedundant: false
  }
}

resource apps 'Microsoft.App/containerApps@2024-03-01' = [for name in ['carparts-staging', 'carparts-production']: {
  name: name
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${pullIdentityResourceId}': {} }
  }
  properties: {
    managedEnvironmentId: environment.id
    workloadProfileName: 'Consumption'
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        transport: 'auto'
        allowInsecure: false
      }
      registries: [{ server: acr.properties.loginServer, identity: pullIdentityResourceId }]
    }
    template: {
      containers: [{
        name: 'carparts'
        image: imageDigest
        resources: { cpu: json('0.25'), memory: '0.5Gi' }
        env: [{ name: 'AZURE_CLIENT_ID', value: pullIdentityClientId }]
        probes: [
          { type: 'Liveness', httpGet: { path: '/health', port: 3000 }, initialDelaySeconds: 10, periodSeconds: 30 }
          { type: 'Readiness', httpGet: { path: '/health', port: 3000 }, initialDelaySeconds: 5, periodSeconds: 10 }
        ]
      }]
      scale: { minReplicas: 0, maxReplicas: 1 }
    }
  }
}]

output stagingUrl string = 'https://${apps[0].properties.configuration.ingress.fqdn}'
output productionUrl string = 'https://${apps[1].properties.configuration.ingress.fqdn}'
