import crypto from 'crypto';
import { normalizeEmail } from './email';
import { prisma } from './db';

const tokenSecret = () => process.env.INVITE_TOKEN_SECRET || 'dev-secret';

export function generateInviteToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(24).toString('hex');
  const hash = crypto.createHmac('sha256', tokenSecret()).update(token).digest('hex');
  return { token, hash };
}

export function hashInviteToken(token: string): string {
  return crypto.createHmac('sha256', tokenSecret()).update(token).digest('hex');
}

export async function findPendingInviteByEmail(email: string) {
  return prisma.invite.findFirst({
    where: {
      emailNormalized: normalizeEmail(email),
      status: 'pending',
      expiresAt: { gt: new Date() }
    }
  });
}
