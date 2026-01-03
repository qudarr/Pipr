param location string = resourceGroup().location
param appName string
param postgresServerName string
param dbAdminUser string
@secure()
param dbAdminPassword string
param dbName string = 'pipr'
@secure()
param inviteTokenSecret string
param appServicePlanSku string = 'P1v3'
param authClientId string
@secure()
param authClientSecret string
param authIssuerUri string // e.g. https://login.microsoftonline.com/<tenant-id>/v2.0

var kvName = '${appName}-kv'
var appInsightsName = '${appName}-ai'
var planName = '${appName}-plan'
var webAppName = appName
var postgresDbConn = 'postgresql://${dbAdminUser}:${dbAdminPassword}@${postgresServerName}.postgres.database.azure.com:5432/${dbName}?sslmode=require'

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
  }
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: kvName
  location: location
  properties: {
    tenantId: subscription().tenantId
    enableSoftDelete: true
    enablePurgeProtection: true
    sku: {
      family: 'A'
      name: 'standard'
    }
    accessPolicies: []
  }
}

resource secretDb 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  name: 'database-url'
  parent: keyVault
  properties: {
    value: postgresDbConn
  }
}

resource secretInvite 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  name: 'invite-token-secret'
  parent: keyVault
  properties: {
    value: inviteTokenSecret
  }
}

resource secretAuthClient 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  name: 'auth-client-secret'
  parent: keyVault
  properties: {
    value: authClientSecret
  }
}

resource serverFarm 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: location
  sku: {
    name: appServicePlanSku
    tier: 'PremiumV3'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: serverFarm.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      appSettings: [
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
        {
          name: 'DATABASE_URL'
          value: '@Microsoft.KeyVault(SecretUri=${secretDb.properties.secretUriWithVersion})'
        }
        {
          name: 'INVITE_TOKEN_SECRET'
          value: '@Microsoft.KeyVault(SecretUri=${secretInvite.properties.secretUriWithVersion})'
        }
        {
          name: 'AUTH_CLIENT_SECRET'
          value: '@Microsoft.KeyVault(SecretUri=${secretAuthClient.properties.secretUriWithVersion})'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsights.properties.InstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'NODE_ENV'
          value: 'production'
        }
      ]
    }
  }
}

resource webAppAuth 'Microsoft.Web/sites/config@2023-12-01' = {
  name: 'authsettingsV2'
  parent: webApp
  properties: {
    platform: {
      enabled: true
      runtimeVersion: 'v2'
    }
    globalValidation: {
      requireAuthentication: true
      unauthenticatedClientAction: 'RedirectToLoginPage'
      redirectToProvider: 'azureactivedirectory'
    }
    identityProviders: {
      azureActiveDirectory: {
        enabled: true
        login: {
          loginParameters: []
        }
        registration: {
          clientId: authClientId
          clientSecretSettingName: 'AUTH_CLIENT_SECRET'
          openIdIssuer: authIssuerUri
        }
        validation: {
          allowedAudiences: [
            authClientId
          ]
        }
      }
    }
  }
}

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: postgresServerName
  location: location
  sku: {
    name: 'Standard_D2s_v3'
    tier: 'GeneralPurpose'
  }
  properties: {
    administratorLogin: dbAdminUser
    administratorLoginPassword: dbAdminPassword
    version: '16'
    storage: {
      storageSizeGB: 64
    }
  }
}

resource postgresDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  name: dbName
  parent: postgres
  properties: {}
}

resource kvAccess 'Microsoft.KeyVault/vaults/accessPolicies@2023-02-01' = {
  name: 'add'
  parent: keyVault
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: webApp.identity.principalId
        permissions: {
          secrets: ['get', 'list']
        }
      }
    ]
  }
}

output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
