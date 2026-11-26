'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { formatShortDate, isLoanOverdue } from '@/lib/libraryUtils';
import type { ActiveLoanSummary, MemberItem } from '@/lib/types';

interface BookCirculationActionsProps {
  bookId: string;
  bookTitle: string;
  available: boolean;
  activeLoan: ActiveLoanSummary | null;
  members: MemberItem[];
}

export function BookCirculationActions({
  bookId,
  bookTitle,
  available,
  activeLoan,
  members,
}: BookCirculationActionsProps) {
  const router = useRouter();
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loanDays, setLoanDays] = useState(14);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleIssueSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setError('Please select a registered member before issuing this book.');
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          memberId: selectedMemberId,
          loanDays,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === 'string' ? payload.error : 'Unable to issue book.',
        );
      }

      setSelectedMemberId('');
      setSuccess(`Issued "${bookTitle}" to ${payload.loan?.memberName ?? 'member'}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to issue book.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async () => {
    if (!activeLoan) return;

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/loans/${encodeURIComponent(activeLoan.id)}/return`, {
        method: 'POST',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === 'string' ? payload.error : 'Unable to process return.',
        );
      }

      setSuccess(`Returned "${bookTitle}". Book is now available.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process return.');
    } finally {
      setSubmitting(false);
    }
  };

  const overdue = activeLoan ? isLoanOverdue(activeLoan.dueAt, null) : false;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"
        >
          {success}
        </div>
      )}

      {available ? (
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Issue to Member</h2>
            <p className="mt-1 text-xs text-slate-500">
              Assign this copy to a registered library member.
            </p>
          </div>

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
                if (error) setError(null);
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
            onClick={handleReturn}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Returning Book...' : 'Return Book'}
          </button>
        </div>
      ) : null}
    </section>
  );
}
