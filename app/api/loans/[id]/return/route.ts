import { NextRequest, NextResponse } from 'next/server';
import { returnLoanInDb } from '@/lib/libraryService';

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const result = await returnLoanInDb(id);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, loan: result.data },
        { status: result.status },
      );
    }

    return NextResponse.json({ loan: result.data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Unable to process book return.' },
      { status: 500 },
    );
  }
}
