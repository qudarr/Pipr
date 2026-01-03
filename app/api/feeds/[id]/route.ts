import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/context';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  notes: z.string().optional()
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getAuthContext();
    const feed = await prisma.feedEvent.findUnique({ where: { id: params.id } });
    if (!feed || feed.familySpaceId !== ctx.membership?.familySpaceId) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    return NextResponse.json({ feed });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getAuthContext();
    const feed = await prisma.feedEvent.findUnique({ where: { id: params.id } });
    if (!feed || feed.familySpaceId !== ctx.membership?.familySpaceId) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const json = await req.json().catch(() => ({}));
    const parsed = PatchSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: 'invalid_body', details: parsed.error.flatten() }, { status: 400 });

    const updated = await prisma.feedEvent.update({
      where: { id: params.id },
      data: { notes: parsed.data.notes }
    });

    return NextResponse.json({ feed: updated });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getAuthContext();
    const feed = await prisma.feedEvent.findUnique({ where: { id: params.id } });
    if (!feed || feed.familySpaceId !== ctx.membership?.familySpaceId) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    await prisma.feedEvent.delete({ where: { id: params.id } });
    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
