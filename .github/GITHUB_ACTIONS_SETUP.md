# GitHub Actions CI/CD Setup for Pipr

This document describes the GitHub Actions workflows configured for continuous integration and deployment of the Pipr application to Azure.

## Workflows

### 1. CI - Build and Test (`ci.yml`)

**Trigger**: Runs on every push and pull request to `main` and `develop` branches

**Purpose**: Validates code quality and ensures the application builds successfully

**Steps**:
1. Checkout code
2. Setup Node.js 18
3. Install npm dependencies
4. Generate Prisma client
5. Run ESLint for code quality checks
6. Build Next.js application
7. Upload build artifacts (for reference)

**No secrets required** - This workflow uses dummy values for environment variables during build.

---

### 2. CD - Deploy to Azure (`deploy-azure.yml`)

**Trigger**: 
- Automatically on push to `main` branch
- Manually via workflow_dispatch with environment selection

**Purpose**: Deploys the application to Azure App Service with infrastructure provisioning

**Steps**:
1. Checkout code
2. Setup Node.js and install dependencies
3. Build the application
4. Authenticate with Azure using OIDC (recommended) or service principal
5. Deploy infrastructure using Bicep (manual trigger only)
6. Package application files (excludes node_modules - Azure builds on deployment)
7. Deploy to Azure Web App
8. Run database migrations using Prisma
9. Display deployment summary

---

## Required Configuration

### GitHub Secrets

Configure these in your repository settings under **Settings → Secrets and variables → Actions → Secrets**:

| Secret Name | Description | Example/Notes |
|-------------|-------------|---------------|
| `AZURE_CLIENT_ID` | Azure Service Principal Client ID | From Azure AD app registration |
| `AZURE_TENANT_ID` | Azure Tenant ID | `bde74bc9-4965-4493-82d2-e198c85bc72d` |
| `AZURE_SUBSCRIPTION_ID` | Azure Subscription ID | `83d3232d-0cc9-45e3-bbf1-0fe9b89e30d8` |
| `AUTH_CLIENT_ID` | Entra External ID App Client ID | From External ID app registration |
| `AUTH_CLIENT_SECRET` | Entra External ID App Secret | From External ID app registration |
| `DB_ADMIN_PASSWORD` | PostgreSQL admin password | Auto-generated or set manually |
| `INVITE_TOKEN_SECRET` | Secret for invite tokens | Base64 encoded random string |
| `APP_BASE_URL` | Application base URL | `https://pipr-app.azurewebsites.net` |

### GitHub Variables

Configure these in your repository settings under **Settings → Secrets and variables → Actions → Variables**:

| Variable Name | Description | Default Value |
|---------------|-------------|---------------|
| `AZURE_RESOURCE_GROUP` | Azure Resource Group name | `PiprApp` |
| `AZURE_LOCATION` | Azure region | `eastus` |
| `AZURE_APP_NAME` | Azure Web App name | `pipr-app` |
| `POSTGRES_SERVER_NAME` | PostgreSQL server name | `piprappg` (derived from app name) |
| `DB_ADMIN_USER` | PostgreSQL admin username | `pipradmin` |
| `AUTH_ISSUER_URI` | Entra External ID issuer URI | `https://login.microsoftonline.com/bde74bc9-4965-4493-82d2-e198c85bc72d/v2.0` |

---

## Azure Setup for GitHub Actions

### Option 1: Using OpenID Connect (OIDC) - Recommended

OIDC provides secure authentication without storing long-lived credentials.

1. **Create Azure AD App Registration**:
   ```bash
   az ad app create --display-name "GitHub Actions - Pipr"
   ```

2. **Create Service Principal**:
   ```bash
   APP_ID=$(az ad app list --display-name "GitHub Actions - Pipr" --query [0].appId -o tsv)
   az ad sp create --id $APP_ID
   ```

3. **Configure Federated Credentials**:
   ```bash
   SP_OBJECT_ID=$(az ad sp list --display-name "GitHub Actions - Pipr" --query [0].id -o tsv)
   
   az ad app federated-credential create \
     --id $APP_ID \
     --parameters '{
       "name": "github-actions-main",
       "issuer": "https://token.actions.githubusercontent.com",
       "subject": "repo:qudarr/Pipr:ref:refs/heads/main",
       "audiences": ["api://AzureADTokenExchange"]
     }'
   ```

4. **Grant Permissions**:
   ```bash
   SUBSCRIPTION_ID="83d3232d-0cc9-45e3-bbf1-0fe9b89e30d8"
   
   az role assignment create \
     --assignee $APP_ID \
     --role Contributor \
     --scope /subscriptions/$SUBSCRIPTION_ID
   ```

5. **Set GitHub Secrets**:
   - `AZURE_CLIENT_ID`: The `appId` from step 1
   - `AZURE_TENANT_ID`: `bde74bc9-4965-4493-82d2-e198c85bc72d`
   - `AZURE_SUBSCRIPTION_ID`: `83d3232d-0cc9-45e3-bbf1-0fe9b89e30d8`

### Option 2: Using Service Principal with Secret

1. **Create Service Principal**:
   ```bash
   az ad sp create-for-rbac \
     --name "github-actions-pipr" \
     --role Contributor \
     --scopes /subscriptions/83d3232d-0cc9-45e3-bbf1-0fe9b89e30d8 \
     --sdk-auth
   ```

2. **Modify workflow**: Replace the Azure Login step with:
   ```yaml
   - name: Azure Login
     uses: azure/login@v2
     with:
       creds: ${{ secrets.AZURE_CREDENTIALS }}
   ```

3. **Set GitHub Secret**:
   - `AZURE_CREDENTIALS`: The entire JSON output from step 1

---

## Initial Deployment

Before using the automated deployment:

1. **Set up all required secrets and variables** in GitHub repository settings

2. **Run infrastructure deployment manually** (first time only):
   - Go to **Actions** tab in GitHub
   - Select **CD - Deploy to Azure** workflow
   - Click **Run workflow**
   - Select environment: `production`
   - This will create all Azure resources using Bicep

3. **Complete Entra External ID configuration**:
   - Add redirect URI: `https://pipr-app.azurewebsites.net/.auth/login/aad/callback`
   - Configure user flow for Email OTP

4. **Subsequent deployments**:
   - Push to `main` branch triggers automatic deployment
   - Infrastructure step is skipped (only manual trigger)
   - Only application code and migrations are deployed

---

## Manual Deployment Trigger

You can manually trigger a deployment:

1. Go to **Actions** tab in your repository
2. Select **CD - Deploy to Azure** workflow
3. Click **Run workflow**
4. Choose environment (production/staging)
5. Click **Run workflow**

---

## Deployment Package Contents

The workflow creates a deployment package containing:
- Application source code (`app/`, `src/`)
- Configuration files (`package.json`, `next.config.js`, etc.)
- Prisma schema and migrations
- Static assets (`public/`)

**Excluded from package**:
- `node_modules` - Azure installs dependencies during deployment
- `.next` build output - Azure builds the app with Oryx
- Development files and logs

---

## Environment Variables in Azure

The Bicep template configures these app settings:

- `DATABASE_URL` - From Key Vault
- `INVITE_TOKEN_SECRET` - From Key Vault
- `AUTH_CLIENT_SECRET` - From Key Vault
- `NODE_ENV` - Set to `production`
- `NPM_CONFIG_PRODUCTION` - Set to `false` (installs devDependencies for build)
- `SCM_DO_BUILD_DURING_DEPLOYMENT` - Set to `true`
- `ENABLE_ORYX_BUILD` - Set to `true`

---

## Monitoring Deployments

### GitHub Actions
- View workflow runs in the **Actions** tab
- Check deployment summary in workflow run details
- Download logs for troubleshooting

### Azure Portal
- Monitor in **App Service → Deployment Center**
- View logs in **App Service → Log stream**
- Check metrics in **Application Insights**

### Azure CLI
```bash
# View deployment logs
az webapp log tail --resource-group PiprApp --name pipr-app

# Check deployment status
az webapp deployment list --resource-group PiprApp --name pipr-app

# View app settings
az webapp config appsettings list --resource-group PiprApp --name pipr-app
```

---

## Troubleshooting

### Build Failures

**Issue**: Build fails during CI
- Check Node.js version matches (18)
- Verify all dependencies are in `package.json`
- Check ESLint configuration

**Issue**: Build fails during deployment
- Verify `NPM_CONFIG_PRODUCTION=false` in app settings
- Check Azure deployment logs
- Ensure Prisma schema is included in deployment package

### Authentication Errors

**Issue**: Azure login fails in GitHub Actions
- Verify service principal credentials are correct
- Check role assignments have Contributor access
- For OIDC: Verify federated credential subject matches repository

### Migration Failures

**Issue**: Database migrations fail
- Verify Key Vault access policy for Web App managed identity
- Check PostgreSQL server firewall rules allow Azure services
- Ensure database connection string is correct in Key Vault

### Deployment Package Issues

**Issue**: Missing files in deployment
- Check zip command includes all necessary directories
- Verify .gitignore doesn't exclude required files
- Review deployment package contents in workflow logs

---

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use OIDC** instead of long-lived service principal secrets
3. **Rotate secrets regularly**:
   - Auth client secret (every 6-12 months)
   - Database password (as needed)
   - Invite token secret (if compromised)
4. **Use GitHub Environments** for production deployments with required reviewers
5. **Enable branch protection** on `main` branch
6. **Monitor Application Insights** for security anomalies
7. **Use Key Vault references** for all sensitive app settings (already configured)

---

## Next Steps

1. Set up GitHub environments for staging and production with required reviewers
2. Configure branch protection rules for `main` branch
3. Set up notifications for deployment failures (GitHub Actions, email, Slack, etc.)
4. Create additional workflows for:
   - Database backup before deployment
   - Rollback procedures
   - Performance testing
5. Document rollback procedures
6. Set up monitoring alerts in Application Insights

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure App Service Deployment](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions)
- [Azure Bicep Documentation](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [OIDC with Azure](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-azure)
