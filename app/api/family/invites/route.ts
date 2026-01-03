import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/context';
import { prisma } from '@/lib/db';
import { generateInviteToken, findPendingInviteByEmail } from '@/lib/invite';
import { normalizeEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({ email: z.string().email() });
const INVITE_TTL_HOURS = 72;

export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext();
    if (!ctx.membership) {
      return NextResponse.json({ error: 'no_family' }, { status: 400 });
    }
    if (ctx.membership.role !== 'owner') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const json = await req.json().catch(() => ({}));
    const body = BodySchema.safeParse(json);
    if (!body.success) {
      return NextResponse.json({ error: 'invalid_body', details: body.error.flatten() }, { status: 400 });
    }

    const emailNormalized = normalizeEmail(body.data.email);

    const existing = await findPendingInviteByEmail(emailNormalized);
    if (existing && existing.familySpaceId === ctx.membership.familySpaceId) {
      return NextResponse.json({ invite: existing, token: 'already-sent' });
    }

    const { token, hash } = generateInviteToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);

    const invite = await prisma.invite.create({
      data: {
        familySpaceId: ctx.membership.familySpaceId,
        emailNormalized,
        tokenHash: hash,
        status: 'pending',
        expiresAt
      }
    });

    // Token is returned so caller can email or display placeholder link.
    return NextResponse.json({ inviteId: invite.id, token, expiresAt });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
