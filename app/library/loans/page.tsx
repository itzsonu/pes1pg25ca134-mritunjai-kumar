import { LoansClient } from '@/components/LoansClient';
import { listLoansWithDetails } from '@/lib/libraryService';
import type { LoanItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function LoansPage() {
  let loans: LoanItem[] = [];
  let error: string | null = null;

  try {
    loans = await listLoansWithDetails('all');
  } catch {
    error =
      'Unable to load loans from PostgreSQL. Verify DATABASE_URL in .env.local and run migrations.';
  }

  return <LoansClient initialLoans={loans} initialError={error} />;
}
