# GitHub Actions Configuration Quick Reference

This file provides a quick reference for setting up GitHub Actions secrets and variables for the Pipr deployment.

## Required GitHub Secrets

Go to: **Settings → Secrets and variables → Actions → Secrets → New repository secret**

1. **AZURE_CLIENT_ID**
   - Description: Azure Service Principal Client ID (for OIDC authentication)
   - How to get: See GITHUB_ACTIONS_SETUP.md for OIDC setup instructions

2. **AZURE_TENANT_ID**
   - Value: `bde74bc9-4965-4493-82d2-e198c85bc72d`

3. **AZURE_SUBSCRIPTION_ID**
   - Value: `83d3232d-0cc9-45e3-bbf1-0fe9b89e30d8`

4. **AUTH_CLIENT_ID**
   - Description: Microsoft Entra External ID Application (client) ID
   - How to get: From Entra External ID app registration

5. **AUTH_CLIENT_SECRET**
   - Description: Microsoft Entra External ID client secret
   - How to get: From Entra External ID app registration → Certificates & secrets

6. **DB_ADMIN_PASSWORD**
   - Description: PostgreSQL admin password
   - Recommendation: Generate a strong password (20+ characters)
   - Example generation: `openssl rand -base64 32`

7. **INVITE_TOKEN_SECRET**
   - Description: Secret for signing invite tokens
   - Recommendation: Generate a random base64 string
   - Example generation: `openssl rand -base64 32`

8. **APP_BASE_URL**
   - Value: `https://pipr-app.azurewebsites.net` (or your custom domain)

## Required GitHub Variables

Go to: **Settings → Secrets and variables → Actions → Variables → New repository variable**

1. **AZURE_RESOURCE_GROUP**
   - Value: `PiprApp`

2. **AZURE_LOCATION**
   - Value: `eastus`

3. **AZURE_APP_NAME**
   - Value: `pipr-app` (must be globally unique across Azure)

4. **POSTGRES_SERVER_NAME**
   - Value: `piprappg` (derived from app name, no hyphens)

5. **DB_ADMIN_USER**
   - Value: `pipradmin`

6. **AUTH_ISSUER_URI**
   - Value: `https://login.microsoftonline.com/bde74bc9-4965-4493-82d2-e198c85bc72d/v2.0`

## Setup Checklist

- [ ] Create Azure Service Principal with OIDC or secret-based authentication
- [ ] Add all required secrets to GitHub repository
- [ ] Add all required variables to GitHub repository
- [ ] Set up Microsoft Entra External ID app registration
- [ ] Test deployment by manually triggering workflow
- [ ] Configure redirect URI in Entra External ID after first deployment

## Quick Commands

Generate random secrets:
```bash
# Generate DB_ADMIN_PASSWORD
openssl rand -base64 32

# Generate INVITE_TOKEN_SECRET
openssl rand -base64 32
```

Create Azure Service Principal (OIDC - Recommended):
```bash
# See detailed instructions in GITHUB_ACTIONS_SETUP.md
az ad sp create-for-rbac --name "GitHub Actions - Pipr"
```

## Notes

- **Never commit secrets** to the repository
- Use OIDC authentication (recommended) instead of storing long-lived credentials
- Rotate secrets regularly (every 6-12 months)
- For production, set up GitHub Environments with required reviewers
- Enable branch protection on `main` branch

## Troubleshooting

If deployment fails:
1. Verify all secrets and variables are set correctly
2. Check workflow logs in Actions tab
3. Ensure Azure Service Principal has Contributor role
4. For OIDC: Verify federated credential is configured correctly

For detailed setup instructions, see [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)
