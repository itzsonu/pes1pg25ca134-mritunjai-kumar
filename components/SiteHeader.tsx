'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { AddBookModal } from './AddBookModal';

export function SiteHeader() {
  const pathname = usePathname() || '/library';
  const [addBookOpen, setAddBookOpen] = useState(false);

  const isLoans = pathname.startsWith('/library/loans');
  const isMembers = pathname.startsWith('/library/members');
  const isCatalogue = !isLoans && !isMembers;

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          <Link
            href="/library"
            className="text-lg font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            University Library
          </Link>

          <nav aria-label="Primary Navigation" className="flex items-center gap-6 text-sm font-medium">
            <Link
              href="/library"
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                isCatalogue
                  ? 'text-slate-900 underline underline-offset-8 decoration-2'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Catalogue
            </Link>
            <Link
              href="/library/loans"
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                isLoans
                  ? 'text-slate-900 underline underline-offset-8 decoration-2'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Loans
            </Link>
            <Link
              href="/library/members"
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                isMembers
                  ? 'text-slate-900 underline underline-offset-8 decoration-2'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Members
            </Link>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setAddBookOpen(true)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              Add Book
            </button>
          </div>
        </div>
      </header>

      <AddBookModal open={addBookOpen} onClose={() => setAddBookOpen(false)} />
    </>
  );
}
