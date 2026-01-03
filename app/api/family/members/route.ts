import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/context';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx.membership) {
      return NextResponse.json({ error: 'no_family' }, { status: 400 });
    }

    const members = await prisma.familyMembership.findMany({
      where: { familySpaceId: ctx.membership.familySpaceId },
      include: { user: true }
    });

    return NextResponse.json({ members });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
