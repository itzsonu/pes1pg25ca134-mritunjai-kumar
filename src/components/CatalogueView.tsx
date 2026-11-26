import { Search, X } from 'lucide-react';
import { formatShortDate } from '../lib/libraryRules';
import type { AvailabilityFilter, BookWithLoan } from '../types/library';

interface CatalogueViewProps {
  books: BookWithLoan[];
  summary: {
    totalBooks: number;
    availableBooks: number;
    issuedBooks: number;
    totalMembers: number;
  };
  searchQuery: string;
  onSearchChange: (value: string) => void;
  availabilityFilter: AvailabilityFilter;
  onFilterChange: (value: AvailabilityFilter) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenBook: (bookId: string) => void;
  onQuickReturn: (loanId: string, bookTitle: string) => Promise<void>;
  returningLoanId: string | null;
  onOpenAddBook: () => void;
}

export function CatalogueView({
  books,
  summary,
  searchQuery,
  onSearchChange,
  availabilityFilter,
  onFilterChange,
  loading,
  error,
  onRetry,
  onOpenBook,
  onQuickReturn,
  returningLoanId,
  onOpenAddBook,
}: CatalogueViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Library Catalogue
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Search holdings by title or author, check real-time shelf availability, and process issue or return transactions.
          </p>
        </div>
      </div>

      {/* Summary KPI strip */}
      <section
        aria-label="Catalogue Summary"
        className="grid grid-cols-2 border border-slate-200 bg-white sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 rounded-lg"
      >
        <div className="px-5 py-4">
          <div className="text-xs font-medium text-slate-500">Total Books</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 font-mono-tabular">
            {summary.totalBooks}
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="text-xs font-medium text-slate-500">Available Books</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-700 font-mono-tabular">
            {summary.availableBooks}
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="text-xs font-medium text-slate-500">Issued Books</div>
          <div className="mt-1 text-2xl font-semibold text-amber-700 font-mono-tabular">
            {summary.issuedBooks}
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="text-xs font-medium text-slate-500">Registered Members</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 font-mono-tabular">
            {summary.totalMembers}
          </div>
        </div>
      </section>

      {/* Search and Availability Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <label htmlFor="catalogue-search" className="sr-only">
            Search books by title or author
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            id="catalogue-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search books by title, author, or call number..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div
          role="tablist"
          aria-label="Filter catalogue by availability"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 self-start sm:self-auto"
        >
          {(
            [
              { id: 'all', label: 'All Books' },
              { id: 'available', label: 'Available Books' },
              { id: 'issued', label: 'Issued Books' },
            ] as const
          ).map((tab) => {
            const active = availabilityFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFilterChange(tab.id)}
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
            className="rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-100 whitespace-nowrap shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Catalogue Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th scope="col" className="px-5 py-3">
                  Book
                </th>
                <th scope="col" className="px-4 py-3">
                  Call No.
                </th>
                <th scope="col" className="px-4 py-3">
                  Availability
                </th>
                <th scope="col" className="px-4 py-3">
                  Borrower / Due
                </th>
                <th scope="col" className="px-5 py-3 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-5 py-3.5">
                      <div className="h-4 w-56 rounded bg-slate-200" />
                      <div className="mt-1.5 h-3 w-36 rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-24 rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-20 rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-28 rounded bg-slate-100" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="ml-auto h-8 w-20 rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-sm font-medium text-slate-900">
                      {searchQuery.trim()
                        ? `No books matched "${searchQuery.trim()}".`
                        : 'No books match the selected availability filter.'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {searchQuery.trim()
                        ? 'Try searching by a different title, author name, or clear your filters.'
                        : 'Switch filter tabs or add a new book to the library catalogue.'}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-3">
                      {(searchQuery.trim() || availabilityFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            onSearchChange('');
                            onFilterChange('all');
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Clear Filters
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={onOpenAddBook}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
                      >
                        Add Book
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <a
                        href={`/library/books/${book.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onOpenBook(book.id);
                        }}
                        className="font-medium text-slate-900 hover:text-slate-700 hover:underline focus-visible:outline-none focus-visible:underline"
                      >
                        {book.title}
                      </a>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span>{book.author}</span>
                        <span aria-hidden="true">·</span>
                        <span>{book.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">{book.publishedYear}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 font-mono-tabular whitespace-nowrap">
                      {book.callNumber}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {book.available ? (
                        <span className="text-xs font-semibold text-emerald-700">Available</span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-700">Issued</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      {book.activeLoan ? (
                        <div>
                          <div className="font-medium text-slate-800">
                            {book.activeLoan.memberName}
                          </div>
                          <div className="text-slate-500 font-mono-tabular">
                            Due {formatShortDate(book.activeLoan.dueAt)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">On shelf</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {book.available ? (
                        <button
                          type="button"
                          onClick={() => onOpenBook(book.id)}
                          aria-label={`Issue ${book.title}`}
                          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                        >
                          Issue
                        </button>
                      ) : book.activeLoan ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenBook(book.id)}
                            aria-label={`View details for ${book.title}`}
                            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            disabled={returningLoanId === book.activeLoan.id}
                            onClick={() => onQuickReturn(book.activeLoan!.id, book.title)}
                            aria-label={`Return ${book.title}`}
                            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
                          >
                            {returningLoanId === book.activeLoan.id ? 'Returning...' : 'Return'}
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
