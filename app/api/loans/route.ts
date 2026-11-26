import { NextRequest, NextResponse } from 'next/server';
import { issueBookInDb, listLoansWithDetails } from '@/lib/libraryService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawStatus = searchParams.get('status') ?? 'all';
    const status =
      rawStatus === 'active' || rawStatus === 'returned' ? rawStatus : 'all';

    const loans = await listLoansWithDetails(status);
    return NextResponse.json({ loans }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load loan records.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { error: 'Invalid JSON request body.' },
      { status: 400 },
    );
  }

  try {
    const result = await issueBookInDb(body as Record<string, unknown>);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ loan: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Unable to issue book.' },
      { status: 500 },
    );
  }
}
