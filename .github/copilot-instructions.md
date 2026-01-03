# Copilot Instructions for Pipr

## Project Overview
Pipr is a mobile-first newborn feed tracker web application built with Next.js, TypeScript, and Tailwind CSS, deployed on Azure App Service (Linux). The application uses Microsoft Entra External ID for passwordless authentication and Azure Database for PostgreSQL for data storage.

## Technology Stack
- **Frontend**: Next.js 14.x with React 18.x, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: Microsoft Entra External ID with App Service Easy Auth (no in-app login UI)
- **Cloud**: Azure (App Service, PostgreSQL Flexible Server, Key Vault, Application Insights)

## Key Architectural Patterns

### Authentication & Authorization
- Authentication is handled by Azure App Service Easy Auth (External ID with Email OTP)
- The backend reads the `X-MS-CLIENT-PRINCIPAL` header (Base64 encoded JSON) to identify users
- User claims of interest: `sub`/`nameidentifier` for stable ID, `email`/`emails` for invite matching
- For local development only, `DEV_AUTH_BYPASS=true` can inject a fake user (NEVER enable in production)
- All API endpoints should enforce per-family authorization based on family_memberships

### Database & ORM
- Use Prisma for all database operations
- Schema: users, family_spaces, family_memberships, invites, babies, feed_events
- Always enforce per-family authorization in queries
- Generate Prisma client: `npx prisma generate`
- Run migrations: `npx prisma migrate dev --name <name>`

### API Structure
- All API routes are in `/app/api` directory
- Key endpoints:
  - `/api/me` - Current user info
  - `/api/family/*` - Family management
  - `/api/babies/*` - Baby management
  - `/api/feeds/*` - Feed event management
- Invite acceptance matches by email claim (case-insensitive)

## Development Workflow

### Setup
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `INVITE_TOKEN_SECRET` - Secret for invite tokens
- `APP_BASE_URL` - Application base URL
- `DEV_AUTH_BYPASS` - Local dev bypass only (never in production)

### Build and Lint
- Build: `npm run build`
- Lint: `npm run lint`
- Dev server: `npm run dev`

### Database Commands
- Generate client: `npm run prisma:generate`
- Dev migrations: `npm run prisma:migrate`
- Deploy migrations: `npm run prisma:deploy`

## Coding Standards

### TypeScript
- Use strict TypeScript with proper typing
- Avoid `any` types where possible
- Define interfaces for API responses and database models

### React/Next.js
- Use functional components with hooks
- Follow Next.js 14 App Router conventions
- Place client components in `/src/components`
- Place API routes in `/app/api`
- Use Server Components by default, add 'use client' only when necessary

### Styling
- Use Tailwind CSS for styling
- Follow mobile-first responsive design
- Use class-variance-authority for component variants

### Security
- NEVER hardcode tenant IDs, subscription IDs, or secrets in code
- Use environment variables and Azure Key Vault for sensitive data
- Always validate and sanitize user inputs
- Enforce authorization checks on all API endpoints
- Use Zod for input validation

### Code Organization
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use meaningful variable and function names
- Follow existing patterns in the codebase

## Azure Deployment
- Deployment is managed via PowerShell scripts in `/infra`
- Infrastructure as Code using Bicep templates
- Resources deployed to resource group `PiprApp` in `eastus` region
- Never commit secrets or sensitive configuration

## Best Practices
1. Test API endpoints thoroughly, especially authorization logic
2. Follow the existing code structure and patterns
3. Document complex logic with comments
4. Use Prisma transactions for operations that modify multiple tables
5. Handle errors gracefully with appropriate HTTP status codes
6. Keep the README.md updated with architectural changes
