import { useState } from 'react';
import { formatShortDate, isLoanOverdue } from '../lib/libraryRules';
import type { LoanWithDetails } from '../types/library';

interface LoansViewProps {
  loans: LoanWithDetails[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenBook: (bookId: string) => void;
  onReturnLoan: (loanId: string, bookTitle: string) => Promise<void>;
  returningLoanId: string | null;
}

export function LoansView({
  loans,
  loading,
  error,
  onRetry,
  onOpenBook,
  onReturnLoan,
  returningLoanId,
}: LoansViewProps) {
  const [filter, setFilter] = useState<'active' | 'returned' | 'all'>('active');

  const visibleLoans = loans.filter((loan) => {
    if (filter === 'active') return loan.returnedAt === null;
    if (filter === 'returned') return loan.returnedAt !== null;
    return true;
  });

  const activeCount = loans.filter((l) => l.returnedAt === null).length;
  const returnedCount = loans.filter((l) => l.returnedAt !== null).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Circulation & Loans
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Track active book issues, due dates, and completed returns across the library.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Filter loans by status"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 self-start sm:self-auto"
        >
          {(
            [
              { id: 'active', label: `Active Loans (${activeCount})` },
              { id: 'returned', label: `Returned (${returnedCount})` },
              { id: 'all', label: `All (${loans.length})` },
            ] as const
          ).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th scope="col" className="px-5 py-3">
                  Book
                </th>
                <th scope="col" className="px-4 py-3">
                  Member
                </th>
                <th scope="col" className="px-4 py-3">
                  Issued
                </th>
                <th scope="col" className="px-4 py-3">
                  Due / Returned
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-5 py-3 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-3.5">
                      <div className="h-4 w-48 rounded bg-slate-200" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-32 rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-24 rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-24 rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-16 rounded bg-slate-100" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="ml-auto h-8 w-20 rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : visibleLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-sm font-medium text-slate-900">
                      {filter === 'active'
                        ? 'No active book loans right now.'
                        : 'No loan records match this filter.'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Issue an available book from the catalogue to create a circulation record.
                    </p>
                  </td>
                </tr>
              ) : (
                visibleLoans.map((loan) => {
                  const overdue = isLoanOverdue(loan);
                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <a
                          href={`/library/books/${loan.bookId}`}
                          onClick={(e) => {
                            e.preventDefault();
                            onOpenBook(loan.bookId);
                          }}
                          className="font-medium text-slate-900 hover:underline"
                        >
                          {loan.bookTitle}
                        </a>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {loan.bookAuthor} ·{' '}
                          <span className="font-mono-tabular">{loan.bookCallNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">{loan.memberName}</div>
                        <div className="text-xs text-slate-500 font-mono-tabular">
                          {loan.memberCode}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 font-mono-tabular whitespace-nowrap">
                        {formatShortDate(loan.issuedAt)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 font-mono-tabular whitespace-nowrap">
                        {loan.returnedAt
                          ? `Returned ${formatShortDate(loan.returnedAt)}`
                          : `Due ${formatShortDate(loan.dueAt)}`}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold whitespace-nowrap">
                        {loan.returnedAt ? (
                          <span className="text-slate-600">Returned</span>
                        ) : overdue ? (
                          <span className="text-red-700">Overdue</span>
                        ) : (
                          <span className="text-amber-700">Issued</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {loan.returnedAt === null ? (
                          <button
                            type="button"
                            disabled={returningLoanId === loan.id}
                            onClick={() => onReturnLoan(loan.id, loan.bookTitle)}
                            aria-label={`Return ${loan.bookTitle}`}
                            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                          >
                            {returningLoanId === loan.id ? 'Returning...' : 'Return Book'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
