import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/context';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreateNappySchema = z.object({
  babyId: z.string(),
  type: z.enum(['wet', 'dirty', 'both']),
  occurredAt: z.string().optional(),
  notes: z.string().optional()
});

const QuerySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  type: z.enum(['wet', 'dirty', 'both']).optional(),
  babyId: z.string().optional()
});

export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext();
    if (!ctx.membership) return NextResponse.json({ nappies: [] });

    const { searchParams } = new URL(req.url);
    const query = QuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );
    if (!query.success) {
      return NextResponse.json(
        { error: 'invalid_query', details: query.error.flatten() },
        { status: 400 }
      );
    }

    const where: any = {
      familySpaceId: ctx.membership.familySpaceId
    };

    if (query.data.babyId) where.babyId = query.data.babyId;
    if (query.data.type) where.type = query.data.type;
    if (query.data.start || query.data.end) {
      where.occurredAt = {};
      if (query.data.start) where.occurredAt.gte = new Date(query.data.start);
      if (query.data.end) where.occurredAt.lte = new Date(query.data.end);
    }

    const nappies = await prisma.nappyEvent.findMany({
      where,
      orderBy: { occurredAt: 'desc' }
    });

    const mappedNappies = nappies.map((n) => ({
      id: n.id,
      babyId: n.babyId,
      occurredAt: n.occurredAt.toISOString(),
      type: n.type,
      notes: n.notes
    }));

    return NextResponse.json({ nappies: mappedNappies });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED')
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext();
    if (!ctx.membership)
      return NextResponse.json({ error: 'no_family' }, { status: 400 });

    const json = await req.json().catch(() => ({}));
    const parsed = CreateNappySchema.safeParse(json);
    if (!parsed.success)
      return NextResponse.json(
        { error: 'invalid_body', details: parsed.error.flatten() },
        { status: 400 }
      );

    const baby = await prisma.baby.findUnique({
      where: { id: parsed.data.babyId }
    });
    if (!baby || baby.familySpaceId !== ctx.membership.familySpaceId) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const occurredAt = parsed.data.occurredAt
      ? new Date(parsed.data.occurredAt)
      : new Date();

    const nappy = await prisma.nappyEvent.create({
      data: {
        familySpaceId: ctx.membership.familySpaceId,
        babyId: parsed.data.babyId,
        occurredAt,
        type: parsed.data.type,
        createdByUserId: ctx.user.id,
        notes: parsed.data.notes
      }
    });

    return NextResponse.json({ nappy });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED')
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
