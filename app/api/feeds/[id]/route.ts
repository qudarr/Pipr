import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/context';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  notes: z.string().optional(),
  occurredAt: z.string().datetime().optional(),
  // Bottle fields
  amountMl: z.number().int().min(1).max(500).optional(),
  bottleType: z.enum(['Formula', 'BreastMilk', 'Mixed']).optional(),
  // Breast fields
  firstSide: z.enum(['Left', 'Right']).optional(),
  firstDurationSec: z.number().int().min(0).optional(),
  secondDurationSec: z.number().int().min(0).optional(),
  totalDurationSec: z.number().int().min(0).optional()
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getAuthContext();
    const feed = await prisma.feedEvent.findUnique({
      where: { id: params.id }
    });
    if (!feed || feed.familySpaceId !== ctx.membership?.familySpaceId) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    return NextResponse.json({ feed });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED')
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getAuthContext();
    const feed = await prisma.feedEvent.findUnique({
      where: { id: params.id }
    });
    if (!feed || feed.familySpaceId !== ctx.membership?.familySpaceId) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const json = await req.json().catch(() => ({}));
    const parsed = PatchSchema.safeParse(json);
    if (!parsed.success)
      return NextResponse.json(
        { error: 'invalid_body', details: parsed.error.flatten() },
        { status: 400 }
      );

    const {
      notes,
      occurredAt,
      amountMl,
      bottleType,
      firstSide,
      firstDurationSec,
      secondDurationSec,
      totalDurationSec
    } = parsed.data;

    const updated = await prisma.feedEvent.update({
      where: { id: params.id },
      data: {
        ...(notes !== undefined && { notes }),
        ...(occurredAt && { occurredAt: new Date(occurredAt) }),
        ...(amountMl !== undefined && { bottleAmountMl: amountMl }),
        ...(bottleType && { bottleType }),
        ...(firstSide && { firstSide }),
        ...(firstDurationSec !== undefined && { firstDurationSec }),
        ...(secondDurationSec !== undefined && { secondDurationSec }),
        ...(totalDurationSec !== undefined && { totalDurationSec })
      }
    });

    return NextResponse.json({ feed: updated });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED')
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getAuthContext();
    const feed = await prisma.feedEvent.findUnique({
      where: { id: params.id }
    });
    if (!feed || feed.familySpaceId !== ctx.membership?.familySpaceId) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    await prisma.feedEvent.delete({ where: { id: params.id } });
    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED')
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
