import { CatalogueClient } from '@/components/CatalogueClient';
import { listBooksWithSummary } from '@/lib/libraryService';
import type { AvailabilityFilter, BookItem, CatalogueSummary } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface LibraryPageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q : '';
  const status: AvailabilityFilter =
    params.status === 'available' || params.status === 'issued'
      ? params.status
      : 'all';

  let books: BookItem[] = [];
  let summary: CatalogueSummary = {
    totalBooks: 0,
    availableBooks: 0,
    issuedBooks: 0,
    totalMembers: 0,
  };
  let error: string | null = null;

  try {
    const data = await listBooksWithSummary({ query, status });
    books = data.books;
    summary = data.summary;
  } catch {
    error =
      'Unable to connect to the PostgreSQL database. Check DATABASE_URL in .env.local and run migrations.';
  }

  return (
    <CatalogueClient
      initialBooks={books}
      initialSummary={summary}
      initialQuery={query}
      initialStatus={status}
      initialError={error}
    />
  );
}
