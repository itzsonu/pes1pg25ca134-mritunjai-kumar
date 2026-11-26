import type {
  AvailabilityFilter,
  Book,
  BookWithLoan,
  LoanWithDetails,
  Member,
  MemberWithStats,
} from '../types/library';

export interface CatalogueResponse {
  books: BookWithLoan[];
  summary: {
    totalBooks: number;
    availableBooks: number;
    issuedBooks: number;
    totalMembers: number;
  };
}

export interface BookDetailResponse {
  book: BookWithLoan;
  history: LoanWithDetails[];
}

async function parseJson<T>(res: Response): Promise<T> {
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof payload?.error === 'string'
        ? payload.error
        : `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return payload as T;
}

export async function fetchBooks(
  query = '',
  status: AvailabilityFilter = 'all',
): Promise<CatalogueResponse> {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  if (status !== 'all') params.set('status', status);
  const qs = params.toString();
  const res = await fetch(`/api/books${qs ? `?${qs}` : ''}`);
  return parseJson<CatalogueResponse>(res);
}

export async function fetchBookDetail(bookId: string): Promise<BookDetailResponse> {
  const res = await fetch(`/api/books/${encodeURIComponent(bookId)}`);
  return parseJson<BookDetailResponse>(res);
}

export async function createBook(input: {
  title: string;
  author: string;
  isbn?: string;
  category?: string;
  callNumber?: string;
  publishedYear?: number;
}): Promise<{ book: Book }> {
  const res = await fetch('/api/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJson<{ book: Book }>(res);
}

export async function fetchMembers(): Promise<{ members: MemberWithStats[] }> {
  const res = await fetch('/api/members');
  return parseJson<{ members: MemberWithStats[] }>(res);
}

export async function createMember(input: {
  name: string;
  email: string;
  department: string;
}): Promise<{ member: Member }> {
  const res = await fetch('/api/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJson<{ member: Member }>(res);
}

export async function fetchLoans(
  status: 'all' | 'active' | 'returned' = 'all',
): Promise<{ loans: LoanWithDetails[] }> {
  const params = new URLSearchParams();
  if (status !== 'all') params.set('status', status);
  const qs = params.toString();
  const res = await fetch(`/api/loans${qs ? `?${qs}` : ''}`);
  return parseJson<{ loans: LoanWithDetails[] }>(res);
}

export async function issueBook(input: {
  bookId: string;
  memberId: string;
  loanDays?: number;
}): Promise<{ loan: LoanWithDetails }> {
  const res = await fetch('/api/loans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJson<{ loan: LoanWithDetails }>(res);
}

export async function returnLoan(loanId: string): Promise<{ loan: LoanWithDetails }> {
  const res = await fetch(`/api/loans/${encodeURIComponent(loanId)}/return`, {
    method: 'POST',
  });
  return parseJson<{ loan: LoanWithDetails }>(res);
}
