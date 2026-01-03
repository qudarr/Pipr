import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/context';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  familyName: z.string().min(1).max(80).optional(),
  babyName: z.string().min(1).max(80).optional(),
  babyBirthdate: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext();
    if (ctx.membership) {
      const family = await prisma.familySpace.findUnique({ where: { id: ctx.membership.familySpaceId } });
      return NextResponse.json({ family, membership: ctx.membership });
    }

    const json = await req.json().catch(() => ({}));
    const body = BodySchema.safeParse(json);
    if (!body.success) {
      return NextResponse.json({ error: 'invalid_body', details: body.error.flatten() }, { status: 400 });
    }

    const family = await prisma.familySpace.create({
      data: {
        name: body.data.familyName ?? 'Family Space',
        memberships: {
          create: {
            userId: ctx.user.id,
            role: 'owner'
          }
        }
      }
    });

    if (body.data.babyName) {
      await prisma.baby.create({
        data: {
          name: body.data.babyName,
          birthdate: body.data.babyBirthdate ? new Date(body.data.babyBirthdate) : undefined,
          familySpaceId: family.id
        }
      });
    }

    return NextResponse.json({ family, membership: { familySpaceId: family.id, role: 'owner' } });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
