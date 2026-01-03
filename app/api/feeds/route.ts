import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/context';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreateFeedSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('bottle'),
    occurredAt: z.string().optional(),
    babyId: z.string(),
    amountMl: z.number().int().min(1),
    bottleType: z.enum(['Formula', 'Breastmilk']),
    notes: z.string().optional()
  }),
  z.object({
    type: z.literal('breast'),
    occurredAt: z.string().optional(),
    babyId: z.string(),
    firstSide: z.enum(['Left', 'Right']),
    firstDurationSec: z.number().int().min(0),
    secondDurationSec: z.number().int().min(0).optional(),
    totalDurationSec: z.number().int().min(0),
    autoSwitchUsed: z.boolean().optional(),
    autoStopUsed: z.boolean().optional(),
    notes: z.string().optional()
  })
]);

const QuerySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  type: z.enum(['bottle', 'breast']).optional(),
  babyId: z.string().optional()
});

export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext();
    if (!ctx.membership) return NextResponse.json({ feeds: [] });

    const { searchParams } = new URL(req.url);
    const query = QuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!query.success) {
      return NextResponse.json({ error: 'invalid_query', details: query.error.flatten() }, { status: 400 });
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

    const feeds = await prisma.feedEvent.findMany({
      where,
      orderBy: { occurredAt: 'desc' }
    });

    return NextResponse.json({ feeds });
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
    const parsed = CreateFeedSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: 'invalid_body', details: parsed.error.flatten() }, { status: 400 });

    const baby = await prisma.baby.findUnique({ where: { id: parsed.data.babyId } });
    if (!baby || baby.familySpaceId !== ctx.membership.familySpaceId) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const occurredAt = parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : new Date();

    const base = {
      familySpaceId: ctx.membership.familySpaceId,
      babyId: parsed.data.babyId,
      occurredAt,
      createdByUserId: ctx.user.id,
      notes: parsed.data.notes
    };

    const feed = await prisma.feedEvent.create({
      data:
        parsed.data.type === 'bottle'
          ? {
              ...base,
              type: 'bottle',
              bottleAmountMl: parsed.data.amountMl,
              bottleType: parsed.data.bottleType
            }
          : {
              ...base,
              type: 'breast',
              firstSide: parsed.data.firstSide,
              firstDurationSec: parsed.data.firstDurationSec,
              secondDurationSec: parsed.data.secondDurationSec ?? null,
              totalDurationSec: parsed.data.totalDurationSec,
              autoSwitchUsed: parsed.data.autoSwitchUsed ?? false,
              autoStopUsed: parsed.data.autoStopUsed ?? false
            }
    });

    return NextResponse.json({ feed });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
