param(
  [string]$SubscriptionId = "83d3232d-0cc9-45e3-bbf1-0fe9b89e30d8",
  [string]$ResourceGroup = "PiprApp",
  [string]$Location = "eastus",
  [string]$AppName = "pipr-app",
  [string]$AuthClientId,
  [string]$AuthClientSecret,
  [string]$AuthIssuerUri = "https://login.microsoftonline.com/bde74bc9-4965-4493-82d2-e198c85bc72d/v2.0"
)

if (-not $AuthClientId -or -not $AuthClientSecret) {
  Write-Error "AuthClientId and AuthClientSecret are required (from Entra External ID app registration)." -ErrorAction Stop
}

$PostgresServerName = "$($AppName.Replace('-', ''))-pg"
$DbAdminUser = "pipradmin"
$DbAdminPassword = [System.Web.Security.Membership]::GeneratePassword(20,3)
$InviteTokenSecret = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([Guid]::NewGuid().ToString()))

Write-Host "Setting subscription to $SubscriptionId"
az account set --subscription $SubscriptionId

Write-Host "Creating resource group $ResourceGroup in $Location"
az group create --name $ResourceGroup --location $Location | Out-Null

Write-Host "Deploying infrastructure (App Service, Postgres Flexible Server, Key Vault, App Insights, Easy Auth)"
az deployment group create `
  --resource-group $ResourceGroup `
  --template-file "$(Join-Path $PSScriptRoot 'main.bicep')" `
  --parameters `
    location=$Location `
    appName=$AppName `
    postgresServerName=$PostgresServerName `
    dbAdminUser=$DbAdminUser `
    dbAdminPassword=$DbAdminPassword `
    inviteTokenSecret=$InviteTokenSecret `
    authClientId=$AuthClientId `
    authClientSecret=$AuthClientSecret `
    authIssuerUri=$AuthIssuerUri

Write-Host "Deployment complete. App URL:" (az deployment group show --resource-group $ResourceGroup --name main --query "properties.outputs.webAppUrl.value" -o tsv)
Write-Host "Store these for local dev (do NOT commit):"
Write-Host "DATABASE_URL=postgresql://$DbAdminUser:$DbAdminPassword@$PostgresServerName.postgres.database.azure.com:5432/pipr?sslmode=require"
Write-Host "INVITE_TOKEN_SECRET=$InviteTokenSecret"
