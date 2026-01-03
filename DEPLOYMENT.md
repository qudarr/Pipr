# Azure Deployment Guide for Pipr

This guide provides step-by-step instructions for deploying the Pipr application to your Azure environment.

## Prerequisites

1. **Azure CLI**: Install the Azure CLI from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
2. **PowerShell**: Required for running the deployment script (available on Windows, macOS, and Linux)
3. **Azure Subscription**: Access to the target subscription
4. **Microsoft Entra External ID**: An External ID tenant with a configured app registration

## Azure Environment Details

- **Tenant**: Contoso (MngEnvMCAP299488.onmicrosoft.com)
- **Tenant ID**: bde74bc9-4965-4493-82d2-e198c85bc72d
- **Subscription ID**: 83d3232d-0cc9-45e3-bbf1-0fe9b89e30d8

## Pre-Deployment Setup

### 1. Set Up Microsoft Entra External ID

Before deploying the application, you need to configure authentication in your External ID tenant:

1. Go to the [Microsoft Entra Admin Center](https://entra.microsoft.com/)
2. Switch to your External tenant (MngEnvMCAP299488.onmicrosoft.com)
3. Create a **Sign up and sign in** user flow:
   - Navigate to **External Identities** > **User flows**
   - Select **Email one-time passcode** as the authentication method
4. Create an app registration for the web app:
   - Navigate to **App registrations** > **New registration**
   - Name: `Pipr Web App` (or your preferred name)
   - Supported account types: **Accounts in this organizational directory only**
   - Redirect URI: Leave blank for now (will be configured after deployment)
   - Click **Register**
5. Note the **Application (client) ID** from the Overview page
6. Create a client secret:
   - Navigate to **Certificates & secrets** > **New client secret**
   - Description: `Pipr Deployment Secret`
   - Expiration: Choose appropriate expiration (recommended: 24 months)
   - Click **Add**
   - **Copy the secret value immediately** (it won't be shown again)

### 2. Login to Azure

```powershell
# Login to Azure
az login

# Set the subscription
az account set --subscription 83d3232d-0cc9-45e3-bbf1-0fe9b89e30d8

# Verify you're on the correct subscription
az account show
```

## Deployment Steps

### 1. Navigate to the Infrastructure Directory

```powershell
cd infra
```

### 2. Run the Deployment Script

```powershell
./deploy.ps1 `
  -AppName "pipr-app" `
  -AuthClientId "<your-client-id-from-step-1>" `
  -AuthClientSecret "<your-client-secret-from-step-1>"
```

**Note**: The script already has the correct default values for:
- SubscriptionId: `83d3232d-0cc9-45e3-bbf1-0fe9b89e30d8`
- AuthIssuerUri: `https://login.microsoftonline.com/bde74bc9-4965-4493-82d2-e198c85bc72d/v2.0`
- ResourceGroup: `PiprApp`
- Location: `eastus`

If you want to use different values, you can override them:

```powershell
./deploy.ps1 `
  -AppName "pipr-app" `
  -ResourceGroup "MyCustomResourceGroup" `
  -Location "westus" `
  -AuthClientId "<your-client-id>" `
  -AuthClientSecret "<your-client-secret>"
```

### 3. What the Deployment Script Does

The deployment script will:
1. Create a resource group (default: `PiprApp` in `eastus`)
2. Deploy the following Azure resources:
   - **App Service Plan** (Linux, Premium P1v3)
   - **Web App** (Node.js 18 LTS)
   - **PostgreSQL Flexible Server** (with database named `pipr`)
   - **Key Vault** (for storing secrets)
   - **Application Insights** (for monitoring)
   - **Managed Identity** (for secure access to Key Vault)
3. Configure Easy Auth with your External ID tenant
4. Store secrets in Key Vault:
   - Database connection string
   - Invite token secret
   - Auth client secret

### 4. Complete the App Registration Configuration

After deployment completes, the script will output the Web App URL (e.g., `https://pipr-app.azurewebsites.net`).

1. Go back to your app registration in the Entra Admin Center
2. Navigate to **Authentication** > **Add a platform** > **Web**
3. Add the following redirect URIs:
   - `https://<your-app-name>.azurewebsites.net/.auth/login/aad/callback`
   - Example: `https://pipr-app.azurewebsites.net/.auth/login/aad/callback`
4. Save the configuration

### 5. Deploy the Application Code

The infrastructure is now ready. To deploy your application code:

#### Option A: Using Azure CLI (Recommended)

```bash
# Build and create a deployment package
npm install
npm run build

# Create a zip file of the required files
zip -r deploy.zip .next node_modules package.json package-lock.json public prisma next.config.js

# Deploy to Azure
az webapp deploy --resource-group PiprApp --name pipr-app --src-path deploy.zip --type zip
```

#### Option B: Using VS Code

1. Install the [Azure App Service extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azureappservice)
2. Right-click on your Web App in the Azure panel
3. Select **Deploy to Web App**

#### Option C: Using GitHub Actions (Continuous Deployment)

Set up GitHub Actions for automatic deployment on push. See [Azure App Service documentation](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions).

### 6. Run Database Migrations

After deploying the code, you need to run Prisma migrations:

```bash
# Get the database connection string from Key Vault
DATABASE_URL=$(az keyvault secret show --vault-name pipr-app-kv --name database-url --query value -o tsv)

# Run migrations
DATABASE_URL=$DATABASE_URL npx prisma migrate deploy
```

Alternatively, you can run migrations through the Azure Cloud Shell or use the Advanced Tools (Kudu) console in the Azure Portal.

## Post-Deployment Verification

1. **Access the Application**: Navigate to `https://pipr-app.azurewebsites.net`
2. **Check Authentication**: You should be redirected to the Microsoft login page
3. **Monitor Logs**: 
   - In Azure Portal, go to your Web App > **Log stream**
   - Or use: `az webapp log tail --resource-group PiprApp --name pipr-app`
4. **Check Application Insights**: Monitor telemetry in the Application Insights resource

## Troubleshooting

### Build Failures

If the build fails during deployment:

1. Check the deployment logs:
   ```bash
   az webapp log download --resource-group PiprApp --name pipr-app
   ```

2. Verify that devDependencies are being installed by checking the app settings:
   ```bash
   az webapp config appsettings list --resource-group PiprApp --name pipr-app
   ```

   Ensure `NPM_CONFIG_PRODUCTION` is set to `false`.

### Authentication Issues

If authentication isn't working:

1. Verify the redirect URI is correctly configured in your app registration
2. Check that the Easy Auth configuration is enabled:
   ```bash
   az webapp auth show --resource-group PiprApp --name pipr-app
   ```

### Database Connection Issues

1. Verify the database secret is accessible:
   ```bash
   az keyvault secret show --vault-name pipr-app-kv --name database-url
   ```

2. Check that the managed identity has access to Key Vault:
   ```bash
   az keyvault show --name pipr-app-kv --query properties.accessPolicies
   ```

## Updating the Application

To update the application after initial deployment:

1. Make your code changes
2. Rebuild the application:
   ```bash
   npm run build
   ```
3. Deploy using one of the deployment methods above

## Clean Up Resources

To remove all deployed resources:

```powershell
az group delete --name PiprApp --yes --no-wait
```

**Warning**: This will delete all resources in the resource group and cannot be undone.

## Security Notes

- Never commit the `.env` file or any secrets to version control
- Store the Database URL and Invite Token Secret output from the deployment script securely
- The Auth Client Secret is stored in Azure Key Vault and accessed via the Web App's managed identity
- Rotate the Auth Client Secret periodically in the Entra Admin Center and update the Key Vault secret
- **DevDependencies in Production**: The current configuration installs devDependencies during build (`NPM_CONFIG_PRODUCTION=false`). This is required for Next.js to build on Azure App Service but increases the deployed package size. For enhanced security:
  - Regularly audit devDependencies for vulnerabilities using `npm audit`
  - Consider using a CI/CD pipeline (GitHub Actions, Azure DevOps) to build the application separately and deploy only the production build artifacts
  - Monitor Application Insights for any unusual activity

## Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Microsoft Entra External ID Documentation](https://docs.microsoft.com/en-us/azure/active-directory/external-identities/)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Prisma Deployment Documentation](https://www.prisma.io/docs/guides/deployment)
