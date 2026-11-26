'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatShortDate, isLoanOverdue } from '@/lib/libraryUtils';
import type { LoanItem } from '@/lib/types';

interface LoansClientProps {
  initialLoans: LoanItem[];
  initialError: string | null;
}

export function LoansClient({ initialLoans, initialError }: LoansClientProps) {
  const router = useRouter();
  const [loans, setLoans] = useState<LoanItem[]>(initialLoans);
  const [filter, setFilter] = useState<'active' | 'returned' | 'all'>('active');
  const [returningLoanId, setReturningLoanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError);
  const [banner, setBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    setLoans(initialLoans);
    setError(initialError);
  }, [initialLoans, initialError]);

  const handleReturn = async (loanId: string, bookTitle: string) => {
    setReturningLoanId(loanId);
    setBanner(null);
    try {
      const response = await fetch(`/api/loans/${encodeURIComponent(loanId)}/return`, {
        method: 'POST',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === 'string' ? payload.error : 'Unable to return book.',
        );
      }

      setLoans((prev) =>
        prev.map((loan) =>
          loan.id === loanId
            ? { ...loan, returnedAt: payload.loan?.returnedAt ?? new Date().toISOString() }
            : loan,
        ),
      );
      setBanner({
        type: 'success',
        message: `Returned "${bookTitle}" to the available shelf.`,
      });
      router.refresh();
    } catch (err) {
      setBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to return book.',
      });
    } finally {
      setReturningLoanId(null);
    }
  };

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

      {banner && (
        <div
          role={banner.type === 'error' ? 'alert' : 'status'}
          className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${
            banner.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <span>{banner.message}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-xs font-medium underline hover:no-underline whitespace-nowrap shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
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
              {visibleLoans.length === 0 ? (
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
                  const overdue = isLoanOverdue(loan.dueAt, loan.returnedAt);
                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/library/books/${loan.bookId}`}
                          className="font-medium text-slate-900 hover:underline"
                        >
                          {loan.bookTitle}
                        </Link>
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
                            onClick={() => handleReturn(loan.id, loan.bookTitle)}
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
