import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/context';
import { prisma } from '@/lib/db';
import { hashInviteToken } from '@/lib/invite';
import { normalizeEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({ token: z.string().min(10).optional() });

export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext();
    const json = await req.json().catch(() => ({}));
    const body = BodySchema.safeParse(json);
    if (!body.success) {
      return NextResponse.json({ error: 'invalid_body', details: body.error.flatten() }, { status: 400 });
    }

    if (!ctx.user.email) {
      return NextResponse.json(
        {
          error: 'missing_email_claim',
          message: 'Your identity did not provide an email address; please sign in with email OTP.'
        },
        { status: 400 }
      );
    }

    if (ctx.membership && ctx.membership.familySpaceId) {
      return NextResponse.json({ error: 'already_member', familySpaceId: ctx.membership.familySpaceId }, { status: 400 });
    }

    const emailNormalized = normalizeEmail(ctx.user.email);

    let invite = null;
    if (body.data.token) {
      const hashed = hashInviteToken(body.data.token);
      invite = await prisma.invite.findFirst({
        where: {
          tokenHash: hashed,
          emailNormalized,
          status: 'pending',
          expiresAt: { gt: new Date() }
        }
      });
    }

    if (!invite) {
      invite = await prisma.invite.findFirst({
        where: {
          emailNormalized,
          status: 'pending',
          expiresAt: { gt: new Date() }
        }
      });
    }

    if (!invite) {
      return NextResponse.json({ error: 'invite_not_found' }, { status: 404 });
    }

    const membership = await prisma.familyMembership.create({
      data: {
        userId: ctx.user.id,
        familySpaceId: invite.familySpaceId,
        role: 'member'
      }
    });

    await prisma.invite.update({
      where: { id: invite.id },
      data: { status: 'accepted' }
    });

    return NextResponse.json({ accepted: true, familySpaceId: invite.familySpaceId, membership });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'already_member' }, { status: 400 });
    }
    if (err?.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
