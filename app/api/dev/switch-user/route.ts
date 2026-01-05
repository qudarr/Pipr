import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const DEV_USER_COOKIE = 'dev-user-id';

/**
 * Dev-only endpoint to switch between simulated users.
 * Only works when DEV_AUTH_BYPASS=true.
 *
 * POST /api/dev/switch-user
 * Body: { "userId": "dev-user-2" }
 *
 * GET /api/dev/switch-user
 * Returns current dev user ID
 */

export async function GET() {
  if (process.env.DEV_AUTH_BYPASS !== 'true') {
    return NextResponse.json(
      { error: 'Dev bypass not enabled' },
      { status: 403 }
    );
  }

  const cookieStore = cookies();
  const currentUser = cookieStore.get(DEV_USER_COOKIE)?.value ?? 'dev-user-1';

  return NextResponse.json({ userId: currentUser });
}

export async function POST(request: NextRequest) {
  if (process.env.DEV_AUTH_BYPASS !== 'true') {
    return NextResponse.json(
      { error: 'Dev bypass not enabled' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const userId = body.userId;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Sanitize userId to prevent issues
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9-_]/g, '');
    if (!sanitizedUserId) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    const cookieStore = cookies();
    cookieStore.set(DEV_USER_COOKIE, sanitizedUserId, {
      httpOnly: true,
      secure: false, // Dev only, no HTTPS required
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return NextResponse.json({
      userId: sanitizedUserId,
      message: `Switched to user: ${sanitizedUserId}`
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  if (process.env.DEV_AUTH_BYPASS !== 'true') {
    return NextResponse.json(
      { error: 'Dev bypass not enabled' },
      { status: 403 }
    );
  }

  const cookieStore = cookies();
  cookieStore.delete(DEV_USER_COOKIE);

  return NextResponse.json({
    userId: 'dev-user-1',
    message: 'Reset to default dev user'
  });
}
