import { NextRequest, NextResponse } from 'next/server';
import { createBookInDb, listBooksWithSummary } from '@/lib/libraryService';
import type { AvailabilityFilter } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') ?? '';
    const rawStatus = searchParams.get('status') ?? 'all';
    const status: AvailabilityFilter =
      rawStatus === 'available' || rawStatus === 'issued' ? rawStatus : 'all';

    const data = await listBooksWithSummary({ query, status });
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load library catalogue from database.' },
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
    const result = await createBookInDb(body as Record<string, unknown>);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ book: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Unable to add book to catalogue.' },
      { status: 500 },
    );
  }
}
