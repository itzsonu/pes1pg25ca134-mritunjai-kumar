import { NextRequest, NextResponse } from 'next/server';
import { createMemberInDb, listMembersWithStats } from '@/lib/libraryService';

export async function GET() {
  try {
    const members = await listMembersWithStats();
    return NextResponse.json({ members }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load library members.' },
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
    const result = await createMemberInDb(body as Record<string, unknown>);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ member: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Unable to register library member.' },
      { status: 500 },
    );
  }
}
