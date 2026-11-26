import { useCallback, useEffect, useState } from 'react';
import { AddBookModal } from './components/AddBookModal';
import { BookDetailView } from './components/BookDetailView';
import { CatalogueView } from './components/CatalogueView';
import { LoansView } from './components/LoansView';
import { MembersView } from './components/MembersView';
import {
  createBook,
  createMember,
  fetchBookDetail,
  fetchBooks,
  fetchLoans,
  fetchMembers,
  issueBook,
  returnLoan,
} from './lib/api';
import type {
  AvailabilityFilter,
  BookWithLoan,
  LoanWithDetails,
  MemberWithStats,
} from './types/library';

type AppRoute =
  | { view: 'catalogue' }
  | { view: 'book'; bookId: string }
  | { view: 'loans' }
  | { view: 'members' };

function parseRoute(pathname: string): AppRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const bookMatch = clean.match(/^\/library\/books\/([^/]+)$/);
  if (bookMatch) {
    return { view: 'book', bookId: decodeURIComponent(bookMatch[1]) };
  }
  if (clean === '/library/loans') {
    return { view: 'loans' };
  }
  if (clean === '/library/members') {
    return { view: 'members' };
  }
  return { view: 'catalogue' };
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute(window.location.pathname));

  // Catalogue state
  const [books, setBooks] = useState<BookWithLoan[]>([]);
  const [summary, setSummary] = useState({
    totalBooks: 0,
    availableBooks: 0,
    issuedBooks: 0,
    totalMembers: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);

  // Book detail state
  const [selectedBook, setSelectedBook] = useState<BookWithLoan | null>(null);
  const [bookHistory, setBookHistory] = useState<LoanWithDetails[]>([]);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [bookNotFound, setBookNotFound] = useState(false);
  const [bookActionSubmitting, setBookActionSubmitting] = useState(false);

  // Members & Loans state
  const [members, setMembers] = useState<MemberWithStats[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const [loans, setLoans] = useState<LoanWithDetails[]>([]);
  const [loansLoading, setLoansLoading] = useState(false);
  const [loansError, setLoansError] = useState<string | null>(null);

  const [returningLoanId, setReturningLoanId] = useState<string | null>(null);
  const [addBookOpen, setAddBookOpen] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const navigate = useCallback((to: string) => {
    if (window.location.pathname !== to) {
      window.history.pushState(null, '', to);
    }
    setRoute(parseRoute(to));
    setFeedbackBanner(null);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setRoute(parseRoute(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const loadCatalogue = useCallback(async () => {
    setCatalogueLoading(true);
    setCatalogueError(null);
    try {
      const data = await fetchBooks(searchQuery, availabilityFilter);
      setBooks(data.books);
      setSummary(data.summary);
    } catch (err) {
      setCatalogueError(err instanceof Error ? err.message : 'Unable to load library catalogue.');
    } finally {
      setCatalogueLoading(false);
    }
  }, [searchQuery, availabilityFilter]);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    setMembersError(null);
    try {
      const data = await fetchMembers();
      setMembers(data.members);
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Unable to load members.');
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const loadLoans = useCallback(async () => {
    setLoansLoading(true);
    setLoansError(null);
    try {
      const data = await fetchLoans('all');
      setLoans(data.loans);
    } catch (err) {
      setLoansError(err instanceof Error ? err.message : 'Unable to load loans.');
    } finally {
      setLoansLoading(false);
    }
  }, []);

  const loadBookDetail = useCallback(async (bookId: string) => {
    setBookLoading(true);
    setBookError(null);
    setBookNotFound(false);
    try {
      const data = await fetchBookDetail(bookId);
      setSelectedBook(data.book);
      setBookHistory(data.history);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to load book details.';
      if (msg.toLowerCase().includes('not found')) {
        setBookNotFound(true);
        setSelectedBook(null);
      } else {
        setBookError(msg);
      }
    } finally {
      setBookLoading(false);
    }
  }, []);

  useEffect(() => {
    if (route.view === 'catalogue') {
      loadCatalogue();
    } else if (route.view === 'book') {
      loadBookDetail(route.bookId);
      loadMembers();
    } else if (route.view === 'loans') {
      loadLoans();
    } else if (route.view === 'members') {
      loadMembers();
    }
  }, [route, loadCatalogue, loadBookDetail, loadLoans, loadMembers]);

  const handleQuickReturn = async (loanId: string, bookTitle: string) => {
    setReturningLoanId(loanId);
    setFeedbackBanner(null);
    try {
      await returnLoan(loanId);
      setFeedbackBanner({
        type: 'success',
        message: `Returned "${bookTitle}" to the available shelf.`,
      });
      if (route.view === 'catalogue') await loadCatalogue();
      if (route.view === 'loans') await loadLoans();
    } catch (err) {
      setFeedbackBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to return book.',
      });
    } finally {
      setReturningLoanId(null);
    }
  };

  const handleIssueFromDetail = async (bookId: string, memberId: string, loanDays: number) => {
    setBookActionSubmitting(true);
    setFeedbackBanner(null);
    try {
      const { loan } = await issueBook({ bookId, memberId, loanDays });
      setFeedbackBanner({
        type: 'success',
        message: `Issued "${loan.bookTitle}" to ${loan.memberName}.`,
      });
      await Promise.all([loadBookDetail(bookId), loadMembers()]);
    } finally {
      setBookActionSubmitting(false);
    }
  };

  const handleReturnFromDetail = async (loanId: string) => {
    if (route.view !== 'book') return;
    setBookActionSubmitting(true);
    setFeedbackBanner(null);
    try {
      const { loan } = await returnLoan(loanId);
      setFeedbackBanner({
        type: 'success',
        message: `Returned "${loan.bookTitle}". Book is now available.`,
      });
      await Promise.all([loadBookDetail(route.bookId), loadMembers()]);
    } catch (err) {
      setFeedbackBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to process return.',
      });
    } finally {
      setBookActionSubmitting(false);
    }
  };

  const handleAddBook = async (input: {
    title: string;
    author: string;
    isbn: string;
    category: string;
    callNumber: string;
    publishedYear: number;
  }) => {
    const { book } = await createBook(input);
    setFeedbackBanner({
      type: 'success',
      message: `Added "${book.title}" to the library catalogue.`,
    });
    if (route.view === 'catalogue') {
      await loadCatalogue();
    } else {
      navigate('/library');
    }
  };

  const handleCreateMember = async (input: {
    name: string;
    email: string;
    department: string;
  }) => {
    await createMember(input);
    await loadMembers();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Three-Zone Top Bar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          <a
            href="/library"
            onClick={(e) => {
              e.preventDefault();
              navigate('/library');
            }}
            className="text-lg font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            University Library
          </a>

          <nav aria-label="Primary Navigation" className="flex items-center gap-6 text-sm font-medium">
            <a
              href="/library"
              onClick={(e) => {
                e.preventDefault();
                navigate('/library');
              }}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                route.view === 'catalogue' || route.view === 'book'
                  ? 'text-slate-900 underline underline-offset-8 decoration-2'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Catalogue
            </a>
            <a
              href="/library/loans"
              onClick={(e) => {
                e.preventDefault();
                navigate('/library/loans');
              }}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                route.view === 'loans'
                  ? 'text-slate-900 underline underline-offset-8 decoration-2'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Loans
            </a>
            <a
              href="/library/members"
              onClick={(e) => {
                e.preventDefault();
                navigate('/library/members');
              }}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                route.view === 'members'
                  ? 'text-slate-900 underline underline-offset-8 decoration-2'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Members
            </a>
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

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {feedbackBanner && (
          <div
            role={feedbackBanner.type === 'error' ? 'alert' : 'status'}
            className={`mb-6 flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${
              feedbackBanner.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            <span>{feedbackBanner.message}</span>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="text-xs font-medium underline hover:no-underline whitespace-nowrap shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {route.view === 'catalogue' && (
          <CatalogueView
            books={books}
            summary={summary}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            availabilityFilter={availabilityFilter}
            onFilterChange={setAvailabilityFilter}
            loading={catalogueLoading}
            error={catalogueError}
            onRetry={loadCatalogue}
            onOpenBook={(bookId) => navigate(`/library/books/${encodeURIComponent(bookId)}`)}
            onQuickReturn={handleQuickReturn}
            returningLoanId={returningLoanId}
            onOpenAddBook={() => setAddBookOpen(true)}
          />
        )}

        {route.view === 'book' && (
          <BookDetailView
            book={selectedBook}
            history={bookHistory}
            members={members}
            loading={bookLoading}
            error={bookError}
            notFound={bookNotFound}
            onBack={() => navigate('/library')}
            onIssueBook={handleIssueFromDetail}
            onReturnLoan={handleReturnFromDetail}
            submitting={bookActionSubmitting}
          />
        )}

        {route.view === 'loans' && (
          <LoansView
            loans={loans}
            loading={loansLoading}
            error={loansError}
            onRetry={loadLoans}
            onOpenBook={(bookId) => navigate(`/library/books/${encodeURIComponent(bookId)}`)}
            onReturnLoan={handleQuickReturn}
            returningLoanId={returningLoanId}
          />
        )}

        {route.view === 'members' && (
          <MembersView
            members={members}
            loading={membersLoading}
            error={membersError}
            onRetry={loadMembers}
            onCreateMember={handleCreateMember}
          />
        )}
      </main>

      <AddBookModal
        open={addBookOpen}
        onClose={() => setAddBookOpen(false)}
        onAddBook={handleAddBook}
      />
    </div>
  );
}
