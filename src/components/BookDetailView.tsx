import { useState, type FormEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { formatShortDate, isLoanOverdue } from '../lib/libraryRules';
import type { BookWithLoan, LoanWithDetails, MemberWithStats } from '../types/library';

interface BookDetailViewProps {
  book: BookWithLoan | null;
  history: LoanWithDetails[];
  members: MemberWithStats[];
  loading: boolean;
  error: string | null;
  notFound: boolean;
  onBack: () => void;
  onIssueBook: (bookId: string, memberId: string, loanDays: number) => Promise<void>;
  onReturnLoan: (loanId: string) => Promise<void>;
  submitting: boolean;
}

export function BookDetailView({
  book,
  history,
  members,
  loading,
  error,
  notFound,
  onBack,
  onIssueBook,
  onReturnLoan,
  submitting,
}: BookDetailViewProps) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loanDays, setLoanDays] = useState(14);
  const [formError, setFormError] = useState<string | null>(null);

  const handleIssueSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!book) return;
    if (!selectedMemberId) {
      setFormError('Please select a registered member before issuing this book.');
      return;
    }
    setFormError(null);
    try {
      await onIssueBook(book.id, selectedMemberId, loanDays);
      setSelectedMemberId('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to issue book.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-5 w-40 rounded bg-slate-200" />
        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
          <div className="h-7 w-2/3 rounded bg-slate-200" />
          <div className="h-4 w-1/3 rounded bg-slate-100" />
          <div className="h-24 w-full rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (notFound || (!book && !error)) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Book Not Found</h1>
        <p className="mt-2 text-sm text-slate-600">
          The requested book record does not exist or may have been removed from the catalogue.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalogue
        </button>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalogue
        </button>
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error || 'Unable to load book details.'}
        </div>
      </div>
    );
  }

  const activeLoan = book.activeLoan;
  const overdue = activeLoan
    ? isLoanOverdue({ dueAt: activeLoan.dueAt, returnedAt: null })
    : false;

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalogue
        </button>
      </div>

      {/* Primary Book Record + Issue / Return Panel */}
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

        {/* Circulation Action Panel */}
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          {book.available ? (
            <form onSubmit={handleIssueSubmit} className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Issue to Member</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Assign this copy to a registered library member.
                </p>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
                >
                  {formError}
                </div>
              )}

              <div>
                <label
                  htmlFor="issue-member-select"
                  className="block text-xs font-medium text-slate-700"
                >
                  Member
                </label>
                <select
                  id="issue-member-select"
                  value={selectedMemberId}
                  onChange={(e) => {
                    setSelectedMemberId(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                >
                  <option value="">Select a member...</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.memberCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="issue-duration-select"
                  className="block text-xs font-medium text-slate-700"
                >
                  Loan Duration
                </label>
                <select
                  id="issue-duration-select"
                  value={loanDays}
                  onChange={(e) => setLoanDays(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days (Standard)</option>
                  <option value={21}>21 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Issuing Book...' : 'Issue Book'}
              </button>
            </form>
          ) : activeLoan ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Active Loan</h2>
                <p className="mt-1 text-xs text-slate-500">
                  This book is currently checked out.
                </p>
              </div>

              <dl className="space-y-2.5 border-y border-slate-200 py-3.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-xs text-slate-500">Borrower</dt>
                  <dd className="font-medium text-slate-900">{activeLoan.memberName}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-xs text-slate-500">Member Code</dt>
                  <dd className="text-slate-700 font-mono-tabular">{activeLoan.memberCode}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-xs text-slate-500">Issued Date</dt>
                  <dd className="text-slate-700 font-mono-tabular">
                    {formatShortDate(activeLoan.issuedAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-xs text-slate-500">Due Date</dt>
                  <dd
                    className={`font-mono-tabular font-medium ${
                      overdue ? 'text-red-700' : 'text-slate-900'
                    }`}
                  >
                    {formatShortDate(activeLoan.dueAt)}
                    {overdue ? ' (Overdue)' : ''}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                disabled={submitting}
                onClick={() => onReturnLoan(activeLoan.id)}
                className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Returning Book...' : 'Return Book'}
              </button>
            </div>
          ) : null}
        </section>
      </div>

      {/* Circulation History */}
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
