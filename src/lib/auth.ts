import { headers } from 'next/headers';
import crypto from 'crypto';

export type ClientPrincipal = {
  userId: string;
  identityProvider?: string;
  userDetails?: string;
  userRoles?: string[];
  claims?: { typ: string; val: string }[];
};

export type AuthenticatedUser = {
  externalSubject: string;
  email?: string;
  displayName?: string;
  isDevBypass: boolean;
};

const DEV_BYPASS_ENV = 'DEV_AUTH_BYPASS';

const getClaim = (principal: ClientPrincipal | null, type: string): string | undefined => {
  return principal?.claims?.find((c) => c.typ.toLowerCase() === type.toLowerCase())?.val;
};

const parsePrincipal = (encoded: string | null): ClientPrincipal | null => {
  if (!encoded) return null;
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    return JSON.parse(decoded) as ClientPrincipal;
  } catch (err) {
    console.error('Failed to parse X-MS-CLIENT-PRINCIPAL', err);
    return null;
  }
};

export const getClientPrincipal = (): ClientPrincipal | null => {
  const hdrs = headers();
  const principalHeader = hdrs.get('x-ms-client-principal');
  return parsePrincipal(principalHeader);
};

export const getAuthenticatedUser = (): AuthenticatedUser | null => {
  const principal = getClientPrincipal();
  const devBypass = process.env[DEV_BYPASS_ENV] === 'true';

  if (devBypass && !principal) {
    const devSub = 'dev-user-' + crypto.randomUUID();
    return {
      externalSubject: devSub,
      email: 'dev@example.com',
      displayName: 'Dev User',
      isDevBypass: true
    };
  }

  if (!principal) return null;

  const subject = getClaim(principal, 'sub') || getClaim(principal, 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier');
  const email = getClaim(principal, 'emails') || getClaim(principal, 'email');
  const name = principal.userDetails;

  if (!subject) return null;

  return {
    externalSubject: subject,
    email,
    displayName: name,
    isDevBypass: devBypass
  };
};
