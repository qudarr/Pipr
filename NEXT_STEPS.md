# Next Steps for Deployment

The repository is now configured for deployment to your Azure environment. Here's what you need to do:

## Prerequisites Completed ✓
- Azure infrastructure configuration (Bicep template) updated
- Build configuration fixed to install devDependencies
- Deployment documentation created
- All changes committed to the branch

## What You Need to Do

### 1. Set Up External ID App Registration (One-time setup)

Before deploying, you need to create an app registration in your External ID tenant:

1. Go to [Microsoft Entra Admin Center](https://entra.microsoft.com/)
2. Switch to your External tenant: **MngEnvMCAP299488.onmicrosoft.com**
3. Create a Sign-up and Sign-in user flow with Email OTP
4. Create an app registration named "Pipr Web App"
5. Note the **Client ID** and create a **Client Secret**

See detailed instructions in [DEPLOYMENT.md](./DEPLOYMENT.md#1-set-up-microsoft-entra-external-id)

### 2. Login to Azure

```bash
az login
az account set --subscription 83d3232d-0cc9-45e3-bbf1-0fe9b89e30d8
```

### 3. Deploy Infrastructure

```powershell
cd infra
./deploy.ps1 -AppName pipr-app -AuthClientId <YOUR_CLIENT_ID> -AuthClientSecret <YOUR_CLIENT_SECRET>
```

### 4. Complete App Registration

After deployment, add the redirect URI to your app registration:
- `https://pipr-app.azurewebsites.net/.auth/login/aad/callback`

### 5. Deploy Application Code

```bash
# Create deployment package (from repository root)
zip -r deploy.zip .next package.json package-lock.json public prisma next.config.js app src

# Deploy to Azure
az webapp deploy --resource-group PiprApp --name pipr-app --src-path deploy.zip --type zip
```

### 6. Run Database Migrations

```bash
DATABASE_URL=$(az keyvault secret show --vault-name pipr-app-kv --name database-url --query value -o tsv)
DATABASE_URL=$DATABASE_URL npx prisma migrate deploy
```

## What Was Fixed

The previous deployment failed because:
- Azure wasn't installing devDependencies (tailwindcss, TypeScript, etc.)
- This caused the Next.js build to fail with "Cannot find module 'tailwindcss'"

The fix:
- Added `NPM_CONFIG_PRODUCTION=false` to the bicep template
- This ensures all dependencies are installed during build
- Added `postinstall` script to generate Prisma client automatically

## Complete Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step instructions, troubleshooting guide, and security notes.

## Questions?

If you encounter any issues during deployment, check the troubleshooting section in DEPLOYMENT.md or review the deployment logs:

```bash
az webapp log download --resource-group PiprApp --name pipr-app
```
