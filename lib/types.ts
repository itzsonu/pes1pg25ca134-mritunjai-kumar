export type AvailabilityFilter = 'all' | 'available' | 'issued';

export interface ActiveLoanSummary {
  id: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  issuedAt: string;
  dueAt: string;
}

export interface BookItem {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  callNumber: string;
  publishedYear: number;
  available: boolean;
  createdAt: string;
  activeLoan: ActiveLoanSummary | null;
}

export interface CatalogueSummary {
  totalBooks: number;
  availableBooks: number;
  issuedBooks: number;
  totalMembers: number;
}

export interface MemberItem {
  id: string;
  memberCode: string;
  name: string;
  email: string;
  department: string;
  joinedAt: string;
  activeLoansCount: number;
  totalLoansCount: number;
}

export interface LoanItem {
  id: string;
  bookId: string;
  memberId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCallNumber: string;
  memberName: string;
  memberCode: string;
  issuedAt: string;
  dueAt: string;
  returnedAt: string | null;
}

export interface ServiceResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}
