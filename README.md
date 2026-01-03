# Pipr – Newborn Feed Tracker (Azure managed-first)

## Overview
- Mobile-first web app (Next.js + TypeScript + Tailwind) running on Azure App Service (Linux).
- Authentication via Microsoft Entra External ID (passwordless Email OTP) using App Service built-in auth (Easy Auth). No in-app login UI.
- Data stored in Azure Database for PostgreSQL Flexible Server.
- Secrets in Azure Key Vault, accessed via Web App managed identity. Application Insights for telemetry.

## Auth: External ID + Easy Auth
1. In Microsoft Entra admin center (External tenants): create a **Sign up and sign in** user flow using **Email one-time passcode**.
2. Create an app registration for the web app in the External tenant. Note the **Application (client) ID** and create a **client secret**.
3. App Service auth settings use **External configuration tenant** with issuer URL like:
   - `https://login.microsoftonline.com/<external-tenant-id>/v2.0`
4. App Service injects identity to the app via `X-MS-CLIENT-PRINCIPAL` header. The backend decodes this Base64 JSON to identify the user.

## Local development
```bash
npm install
npm run dev
```
- Env file: `.env` (already ignored). Set `DATABASE_URL`, `INVITE_TOKEN_SECRET`, `APP_BASE_URL`. For local prototyping you can set `DEV_AUTH_BYPASS=true` to inject a fake user (never enable in production).
- Prisma:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

## API surface (MVP)
- `GET /api/me` — current user + email claim.
- Family: `POST /api/family/bootstrap`, `GET /api/family`, `POST /api/family/invites`, `POST /api/family/invites/accept`, `GET /api/family/members`.
- Babies: `GET/POST /api/babies`, `PATCH /api/babies/:id`.
- Feeds: `GET/POST /api/feeds`, `GET/PATCH/DELETE /api/feeds/:id`.
- Invite acceptance matches by **email claim** (case-insensitive) and requires email to be present.

## Database schema (Prisma)
Tables: users, family_spaces, family_memberships, invites, babies, feed_events with per-family authorization enforced by queries.

## Azure deployment (managed-first)
Resources: App Service Plan (Linux), Web App, Postgres Flexible Server + DB, Key Vault, Managed Identity, Application Insights, Easy Auth (External ID).

**For complete deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

### Deployment Options

#### Option 1: GitHub Actions (Recommended for Production)
Automated CI/CD with GitHub Actions provides continuous deployment on every push to `main`:
- Automated builds, linting, and testing
- Infrastructure deployment using Bicep
- Automatic database migrations
- Secure OIDC authentication with Azure

See [GitHub Actions Setup Guide](.github/GITHUB_ACTIONS_SETUP.md) for configuration details.

#### Option 2: PowerShell Script (Quick Manual Deployment)
Quick deployment with PowerShell:
```powershell
# Requires az CLI and logged in to subscription
cd infra
./deploy.ps1 -AppName pipr-app -AuthClientId <client-id> -AuthClientSecret <secret>
```
The script:
- Creates RG `PiprApp` (default) in `eastus`.
- Deploys infra via `main.bicep`.
- Stores DB URL and invite secret in Key Vault.
- Enables Easy Auth with the provided External ID app registration.
- Configures build settings to install all dependencies (including devDependencies).

## Auth header decoding
The backend reads `X-MS-CLIENT-PRINCIPAL` (Base64 JSON). Claims of interest:
- `sub` / `nameidentifier` — stable external subject key.
- `email` / `emails` — used for invite matching.

## Extensibility
- Theme preference stored per user (system/light/dark) ready for future persistence.
- “Growth (Coming soon)” can be added under settings/stats later.

## Notes
- Do **not** hardcode tenant or subscription IDs in app code. Use environment/app settings and Key Vault.
- No username/password auth is implemented or needed.
