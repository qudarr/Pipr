import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getAuthContext } from '@/lib/context';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authHeader = getAuthenticatedUser();
    const ctx = await getAuthContext();

    return NextResponse.json({
      user: ctx.user,
      membership: ctx.membership,
      emailClaim: authHeader?.email ?? null,
      devBypass: authHeader?.isDevBypass ?? false
    });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
