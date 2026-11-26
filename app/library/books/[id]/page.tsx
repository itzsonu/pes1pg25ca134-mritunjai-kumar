import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BookCirculationActions } from '@/components/BookCirculationActions';
import { getBookDetailById, listMembersWithStats } from '@/lib/libraryService';
import { formatShortDate } from '@/lib/libraryUtils';

export const dynamic = 'force-dynamic';

interface BookDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { id } = await params;

  let detail: Awaited<ReturnType<typeof getBookDetailById>> = null;
  let members: Awaited<ReturnType<typeof listMembersWithStats>> = [];
  let dbError: string | null = null;

  try {
    [detail, members] = await Promise.all([
      getBookDetailById(id),
      listMembersWithStats(),
    ]);
  } catch {
    dbError =
      'Unable to load book details from PostgreSQL. Verify DATABASE_URL and run database migrations.';
  }

  if (dbError) {
    return (
      <div className="space-y-4">
        <Link
          href="/library"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalogue
        </Link>
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {dbError}
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Book Not Found</h1>
        <p className="mt-2 text-sm text-slate-600">
          The requested book record does not exist or may have been removed from the catalogue.
        </p>
        <Link
          href="/library"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalogue
        </Link>
      </div>
    );
  }

  const { book, history } = detail;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/library"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalogue
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <section className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="text-xs font-medium text-slate-500">
                {book.category} · <span className="font-mono-tabular">{book.callNumber}</span>
              </div>
              <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                {book.title}
              </h1>
              <p className="mt-1 text-sm text-slate-600">by {book.author}</p>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-slate-500">Status</div>
              <div
                className={`mt-1 text-sm font-semibold ${
                  book.available ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {book.available ? 'Available' : 'Issued'}
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-slate-500">ISBN</dt>
              <dd className="mt-1 text-slate-900 font-mono-tabular">{book.isbn}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Publication Year</dt>
              <dd className="mt-1 text-slate-900 font-mono-tabular">{book.publishedYear}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Catalog ID</dt>
              <dd className="mt-1 text-slate-900 font-mono-tabular">{book.id}</dd>
            </div>
          </dl>
        </section>

        <BookCirculationActions
          bookId={book.id}
          bookTitle={book.title}
          available={book.available}
          activeLoan={book.activeLoan}
          members={members}
        />
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Circulation History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th scope="col" className="px-5 py-3">
                  Member
                </th>
                <th scope="col" className="px-4 py-3">
                  Issued
                </th>
                <th scope="col" className="px-4 py-3">
                  Due
                </th>
                <th scope="col" className="px-4 py-3">
                  Returned
                </th>
                <th scope="col" className="px-5 py-3 text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-500">
                    No loan transactions have been recorded for this book yet.
                  </td>
                </tr>
              ) : (
                history.map((loan) => (
                  <tr key={loan.id}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{loan.memberName}</div>
                      <div className="text-xs text-slate-500 font-mono-tabular">
                        {loan.memberCode}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-mono-tabular whitespace-nowrap">
                      {formatShortDate(loan.issuedAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-mono-tabular whitespace-nowrap">
                      {formatShortDate(loan.dueAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-mono-tabular whitespace-nowrap">
                      {formatShortDate(loan.returnedAt)}
                    </td>
                    <td className="px-5 py-3 text-right text-xs font-medium whitespace-nowrap">
                      {loan.returnedAt ? (
                        <span className="text-slate-600">Returned</span>
                      ) : (
                        <span className="text-amber-700">Active Loan</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
