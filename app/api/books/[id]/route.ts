import { NextRequest, NextResponse } from 'next/server';
import { getBookDetailById } from '@/lib/libraryService';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const detail = await getBookDetailById(id);

    if (!detail) {
      return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    }

    return NextResponse.json(detail, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load book details.' },
      { status: 500 },
    );
  }
}
