import { prisma } from './db';
import { getAuthenticatedUser } from './auth';
import { normalizeEmail } from './email';
import { MemberRole, User } from '@prisma/client';

export type AuthContext = {
  user: User;
  membership: { familySpaceId: string; role: MemberRole } | null;
};

export async function getAuthContext(): Promise<AuthContext> {
  const auth = getAuthenticatedUser();
  if (!auth) {
    throw new Error('UNAUTHENTICATED');
  }

  const email = auth.email ? normalizeEmail(auth.email) : null;

  const user = await prisma.user.upsert({
    where: { externalSubject: auth.externalSubject },
    update: { email },
    create: {
      externalSubject: auth.externalSubject,
      email,
      displayName: auth.displayName ?? email ?? 'New caregiver'
    }
  });

  const membership = await prisma.familyMembership.findFirst({
    where: { userId: user.id },
    select: { familySpaceId: true, role: true }
  });

  return { user, membership };
}
