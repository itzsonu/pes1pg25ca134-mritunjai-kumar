'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { formatShortDate } from '@/lib/libraryUtils';
import type { MemberItem } from '@/lib/types';

interface MembersClientProps {
  initialMembers: MemberItem[];
  initialError: string | null;
}

export function MembersClient({ initialMembers, initialError }: MembersClientProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Computer Applications');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFormError('Please provide both full name and email address.');
      return;
    }

    setFormError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          department: department.trim() || 'Computer Applications',
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === 'string'
            ? payload.error
            : 'Unable to register member.',
        );
      }

      setSuccessMessage(`Registered ${name.trim()} to the library directory.`);
      setName('');
      setEmail('');
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to register member.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Library Members
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Register new borrowers and review active loan counts per member.
        </p>
      </div>

      {initialError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {initialError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Member Registration Form */}
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Register Member</h2>
          <p className="mt-1 text-xs text-slate-500">
            New members receive an institutional library code automatically.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {formError && (
              <div
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
              >
                {formError}
              </div>
            )}
            {successMessage && (
              <div
                role="status"
                className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"
              >
                {successMessage}
              </div>
            )}

            <div>
              <label htmlFor="member-name" className="block text-xs font-medium text-slate-700">
                Full Name
              </label>
              <input
                id="member-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="member-email" className="block text-xs font-medium text-slate-700">
                Institutional Email
              </label>
              <input
                id="member-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya.sharma@campus.edu"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="member-department"
                className="block text-xs font-medium text-slate-700"
              >
                Department
              </label>
              <input
                id="member-department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Computer Applications"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Registering...' : 'Add Member'}
            </button>
          </form>
        </section>

        {/* Member Directory Table */}
        <section className="lg:col-span-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Member Directory</h2>
            <span className="text-xs text-slate-500 font-mono-tabular">
              {initialMembers.length} registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th scope="col" className="px-5 py-3">
                    Code
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Member
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Department
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Active Loans
                  </th>
                  <th scope="col" className="px-5 py-3 text-right">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {initialMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-xs text-slate-500">
                      No members registered yet.
                    </td>
                  </tr>
                ) : (
                  initialMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 text-xs font-medium text-slate-700 font-mono-tabular whitespace-nowrap">
                        {member.memberCode}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-900">{member.name}</div>
                        <div className="text-xs text-slate-500">{member.email}</div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">{member.department}</td>
                      <td className="px-4 py-3.5 text-right font-mono-tabular">
                        <span
                          className={`text-xs font-semibold ${
                            member.activeLoansCount > 0 ? 'text-amber-700' : 'text-slate-500'
                          }`}
                        >
                          {member.activeLoansCount}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-slate-500 font-mono-tabular whitespace-nowrap">
                        {formatShortDate(member.joinedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
