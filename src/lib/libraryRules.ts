import type {
  AvailabilityFilter,
  Book,
  BookWithLoan,
  LibraryDatabase,
  Loan,
  LoanWithDetails,
  Member,
  MemberWithStats,
} from '../types/library';

export interface DomainResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function filterBooks(
  books: BookWithLoan[],
  query: string,
  availability: AvailabilityFilter = 'all',
): BookWithLoan[] {
  const q = query.trim().toLowerCase();

  return books.filter((book) => {
    if (availability === 'available' && !book.available) {
      return false;
    }
    if (availability === 'issued' && book.available) {
      return false;
    }
    if (!q) {
      return true;
    }
    return (
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      book.isbn.toLowerCase().includes(q) ||
      book.callNumber.toLowerCase().includes(q)
    );
  });
}

export function hydrateBooks(db: LibraryDatabase): BookWithLoan[] {
  const memberById = new Map(db.members.map((m) => [m.id, m]));
  const activeLoanByBookId = new Map<string, Loan>();

  for (const loan of db.loans) {
    if (loan.returnedAt === null) {
      activeLoanByBookId.set(loan.bookId, loan);
    }
  }

  return db.books.map((book) => {
    const activeLoan = activeLoanByBookId.get(book.id);
    if (!activeLoan) {
      return { ...book, activeLoan: null };
    }
    const member = memberById.get(activeLoan.memberId);
    return {
      ...book,
      available: false,
      activeLoan: {
        id: activeLoan.id,
        memberId: activeLoan.memberId,
        memberName: member?.name ?? 'Unknown Member',
        memberCode: member?.memberCode ?? 'N/A',
        issuedAt: activeLoan.issuedAt,
        dueAt: activeLoan.dueAt,
      },
    };
  });
}

export function hydrateLoans(db: LibraryDatabase): LoanWithDetails[] {
  const bookById = new Map(db.books.map((b) => [b.id, b]));
  const memberById = new Map(db.members.map((m) => [m.id, m]));

  return [...db.loans]
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
    .map((loan) => {
      const book = bookById.get(loan.bookId);
      const member = memberById.get(loan.memberId);
      return {
        ...loan,
        bookTitle: book?.title ?? 'Unknown Book',
        bookAuthor: book?.author ?? 'Unknown Author',
        bookCallNumber: book?.callNumber ?? '—',
        memberName: member?.name ?? 'Unknown Member',
        memberCode: member?.memberCode ?? 'N/A',
      };
    });
}

export function hydrateMembers(db: LibraryDatabase): MemberWithStats[] {
  return db.members.map((member) => {
    const memberLoans = db.loans.filter((loan) => loan.memberId === member.id);
    const activeLoansCount = memberLoans.filter((loan) => loan.returnedAt === null).length;
    return {
      ...member,
      activeLoansCount,
      totalLoansCount: memberLoans.length,
    };
  });
}

export function createBookRecord(
  db: LibraryDatabase,
  input: {
    title?: unknown;
    author?: unknown;
    isbn?: unknown;
    category?: unknown;
    callNumber?: unknown;
    publishedYear?: unknown;
  },
  now = new Date(),
): DomainResult<Book> {
  const title = normalizeText(input.title);
  const author = normalizeText(input.author);
  const isbn = normalizeText(input.isbn) || `978-0-${Math.floor(100000 + Math.random() * 900000)}-0`;
  const category = normalizeText(input.category) || 'General Collection';
  const callNumber =
    normalizeText(input.callNumber) ||
    `QA${Math.floor(10 + Math.random() * 89)}.${title.slice(0, 2).toUpperCase() || 'BK'}`;
  const rawYear = Number(input.publishedYear);
  const publishedYear =
    Number.isInteger(rawYear) && rawYear >= 1450 && rawYear <= now.getUTCFullYear() + 1
      ? rawYear
      : now.getUTCFullYear();

  if (!title || !author) {
    return {
      ok: false,
      status: 400,
      error: 'Both title and author are required.',
    };
  }

  const nextNum = db.books.length + 1;
  const book: Book = {
    id: `book-${Date.now().toString(36)}-${nextNum}`,
    title,
    author,
    isbn,
    category,
    callNumber,
    publishedYear,
    available: true,
    createdAt: now.toISOString(),
  };

  db.books.unshift(book);
  return { ok: true, status: 201, data: book };
}

export function createMemberRecord(
  db: LibraryDatabase,
  input: {
    name?: unknown;
    email?: unknown;
    department?: unknown;
  },
  now = new Date(),
): DomainResult<Member> {
  const name = normalizeText(input.name);
  const email = normalizeText(input.email).toLowerCase();
  const department = normalizeText(input.department) || 'Computer Applications';

  if (!name || !email) {
    return {
      ok: false,
      status: 400,
      error: 'Member name and email address are required.',
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      ok: false,
      status: 400,
      error: 'Please enter a valid email address.',
    };
  }

  const duplicate = db.members.some((m) => m.email.toLowerCase() === email);
  if (duplicate) {
    return {
      ok: false,
      status: 409,
      error: 'A member with this email address already exists.',
    };
  }

  const nextIndex = db.members.length + 101;
  const member: Member = {
    id: `member-${Date.now().toString(36)}-${nextIndex}`,
    memberCode: `LIB-${nextIndex}`,
    name,
    email,
    department,
    joinedAt: now.toISOString(),
  };

  db.members.push(member);
  return { ok: true, status: 201, data: member };
}

export function issueBookLoan(
  db: LibraryDatabase,
  input: {
    bookId?: unknown;
    memberId?: unknown;
    loanDays?: unknown;
  },
  now = new Date(),
): DomainResult<LoanWithDetails> {
  const bookId = normalizeText(input.bookId);
  const memberId = normalizeText(input.memberId);

  if (!bookId || !memberId) {
    return {
      ok: false,
      status: 400,
      error: 'Both bookId and memberId are required.',
    };
  }

  const book = db.books.find((b) => b.id === bookId);
  if (!book) {
    return {
      ok: false,
      status: 404,
      error: `Book "${bookId}" was not found.`,
    };
  }

  const member = db.members.find((m) => m.id === memberId);
  if (!member) {
    return {
      ok: false,
      status: 404,
      error: `Member "${memberId}" was not found.`,
    };
  }

  const existingActiveLoan = db.loans.find(
    (loan) => loan.bookId === book.id && loan.returnedAt === null,
  );
  if (!book.available || existingActiveLoan) {
    return {
      ok: false,
      status: 409,
      error: `"${book.title}" is currently issued and unavailable.`,
    };
  }

  const parsedDays = Number(input.loanDays);
  const loanDays =
    Number.isInteger(parsedDays) && parsedDays >= 1 && parsedDays <= 60 ? parsedDays : 14;
  const dueDate = new Date(now.getTime() + loanDays * 24 * 60 * 60 * 1000);

  const loan: Loan = {
    id: `loan-${Date.now().toString(36)}-${db.loans.length + 1}`,
    bookId: book.id,
    memberId: member.id,
    issuedAt: now.toISOString(),
    dueAt: dueDate.toISOString(),
    returnedAt: null,
  };

  book.available = false;
  db.loans.unshift(loan);

  return {
    ok: true,
    status: 201,
    data: {
      ...loan,
      bookTitle: book.title,
      bookAuthor: book.author,
      bookCallNumber: book.callNumber,
      memberName: member.name,
      memberCode: member.memberCode,
    },
  };
}

export function returnBookLoan(
  db: LibraryDatabase,
  loanIdInput: unknown,
  now = new Date(),
): DomainResult<LoanWithDetails> {
  const loanId = normalizeText(loanIdInput);
  if (!loanId) {
    return {
      ok: false,
      status: 400,
      error: 'Loan ID is required.',
    };
  }

  const loan = db.loans.find((l) => l.id === loanId);
  if (!loan) {
    return {
      ok: false,
      status: 404,
      error: `Loan "${loanId}" was not found.`,
    };
  }

  const book = db.books.find((b) => b.id === loan.bookId);
  const member = db.members.find((m) => m.id === loan.memberId);

  if (loan.returnedAt !== null) {
    return {
      ok: false,
      status: 409,
      error: 'This loan has already been returned.',
      data: {
        ...loan,
        bookTitle: book?.title ?? 'Unknown Book',
        bookAuthor: book?.author ?? 'Unknown Author',
        bookCallNumber: book?.callNumber ?? '—',
        memberName: member?.name ?? 'Unknown Member',
        memberCode: member?.memberCode ?? 'N/A',
      },
    };
  }

  loan.returnedAt = now.toISOString();
  if (book) {
    const anotherActive = db.loans.some(
      (other) => other.bookId === book.id && other.id !== loan.id && other.returnedAt === null,
    );
    book.available = !anotherActive;
  }

  return {
    ok: true,
    status: 200,
    data: {
      ...loan,
      bookTitle: book?.title ?? 'Unknown Book',
      bookAuthor: book?.author ?? 'Unknown Author',
      bookCallNumber: book?.callNumber ?? '—',
      memberName: member?.name ?? 'Unknown Member',
      memberCode: member?.memberCode ?? 'N/A',
    },
  };
}

export function formatShortDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isLoanOverdue(loan: Pick<Loan, 'dueAt' | 'returnedAt'>, now = new Date()): boolean {
  if (loan.returnedAt !== null) return false;
  return new Date(loan.dueAt).getTime() < now.getTime();
}
