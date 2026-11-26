export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  callNumber: string;
  publishedYear: number;
  available: boolean;
  createdAt: string;
}

export interface Member {
  id: string;
  memberCode: string;
  name: string;
  email: string;
  department: string;
  joinedAt: string;
}

export interface Loan {
  id: string;
  bookId: string;
  memberId: string;
  issuedAt: string;
  dueAt: string;
  returnedAt: string | null;
}

export interface ActiveLoanSummary {
  id: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  issuedAt: string;
  dueAt: string;
}

export interface BookWithLoan extends Book {
  activeLoan: ActiveLoanSummary | null;
}

export interface LoanWithDetails extends Loan {
  bookTitle: string;
  bookAuthor: string;
  bookCallNumber: string;
  memberName: string;
  memberCode: string;
}

export interface MemberWithStats extends Member {
  activeLoansCount: number;
  totalLoansCount: number;
}

export interface LibraryDatabase {
  books: Book[];
  members: Member[];
  loans: Loan[];
}

export type AvailabilityFilter = 'all' | 'available' | 'issued';
