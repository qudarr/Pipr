import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/context';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BabySchema = z.object({
  name: z.string().min(1).max(80),
  birthdate: z.string().optional()
});

export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx.membership) return NextResponse.json({ babies: [] });

    const babies = await prisma.baby.findMany({ where: { familySpaceId: ctx.membership.familySpaceId } });
    return NextResponse.json({ babies });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext();
    if (!ctx.membership) return NextResponse.json({ error: 'no_family' }, { status: 400 });

    const json = await req.json().catch(() => ({}));
    const parsed = BabySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_body', details: parsed.error.flatten() }, { status: 400 });
    }

    const baby = await prisma.baby.create({
      data: {
        name: parsed.data.name,
        birthdate: parsed.data.birthdate ? new Date(parsed.data.birthdate) : undefined,
        familySpaceId: ctx.membership.familySpaceId
      }
    });

    return NextResponse.json({ baby });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
