import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/context';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  name: z.string().min(1).max(80).optional(),
  birthdate: z.string().optional()
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (!ctx.membership) return NextResponse.json({ error: 'no_family' }, { status: 400 });

    const baby = await prisma.baby.findUnique({ where: { id: params.id } });
    if (!baby || baby.familySpaceId !== ctx.membership.familySpaceId) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: 'invalid_body', details: parsed.error.flatten() }, { status: 400 });

    const updated = await prisma.baby.update({
      where: { id: params.id },
      data: {
        name: parsed.data.name ?? baby.name,
        birthdate: parsed.data.birthdate ? new Date(parsed.data.birthdate) : baby.birthdate
      }
    });

    return NextResponse.json({ baby: updated });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
