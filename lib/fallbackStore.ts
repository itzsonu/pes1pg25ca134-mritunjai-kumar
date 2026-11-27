import type { LibraryDbClient } from './libraryService';

interface StoredBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  callNumber: string;
  publishedYear: number;
  available: boolean;
  createdAt: Date;
}

interface StoredMember {
  id: string;
  memberCode: string;
  name: string;
  email: string;
  department: string;
  joinedAt: Date;
}

interface StoredLoan {
  id: string;
  bookId: string;
  memberId: string;
  issuedAt: Date;
  dueAt: Date;
  returnedAt: Date | null;
}

function createInitialData() {
  const books: StoredBook[] = [
    {
      id: 'book-1',
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      isbn: '978-1-4493-7332-0',
      category: 'Distributed Systems',
      callNumber: 'QA76.9.D3 K54',
      publishedYear: 2017,
      available: true,
      createdAt: new Date('2026-09-01T09:00:00.000Z'),
    },
    {
      id: 'book-2',
      title: 'Clean Architecture: A Craftsman Guide',
      author: 'Robert C. Martin',
      isbn: '978-0-1344-9416-6',
      category: 'Software Engineering',
      callNumber: 'QA76.758 M37',
      publishedYear: 2017,
      available: false,
      createdAt: new Date('2026-09-03T09:00:00.000Z'),
    },
    {
      id: 'book-3',
      title: 'Database Internals',
      author: 'Alex Petrov',
      isbn: '978-1-4920-4034-7',
      category: 'Databases',
      callNumber: 'QA76.9.D3 P48',
      publishedYear: 2019,
      available: true,
      createdAt: new Date('2026-09-05T09:00:00.000Z'),
    },
    {
      id: 'book-4',
      title: 'Introduction to Algorithms',
      author: 'Thomas H. Cormen',
      isbn: '978-0-2620-4630-5',
      category: 'Algorithms',
      callNumber: 'QA76.6 I58',
      publishedYear: 2022,
      available: false,
      createdAt: new Date('2026-09-07T09:00:00.000Z'),
    },
    {
      id: 'book-5',
      title: 'Structure and Interpretation of Computer Programs',
      author: 'Harold Abelson',
      isbn: '978-0-2625-1087-5',
      category: 'Programming Languages',
      callNumber: 'QA76.6 A25',
      publishedYear: 1996,
      available: true,
      createdAt: new Date('2026-09-09T09:00:00.000Z'),
    },
    {
      id: 'book-6',
      title: 'Operating Systems: Three Easy Pieces',
      author: 'Remzi H. Arpaci-Dusseau',
      isbn: '978-1-9850-8659-3',
      category: 'Systems',
      callNumber: 'QA76.76.O63 A77',
      publishedYear: 2018,
      available: true,
      createdAt: new Date('2026-09-11T09:00:00.000Z'),
    },
    {
      id: 'book-7',
      title: 'Computer Networking: A Top-Down Approach',
      author: 'James F. Kurose',
      isbn: '978-0-1366-8155-7',
      category: 'Networks',
      callNumber: 'TK5105.5 K87',
      publishedYear: 2020,
      available: true,
      createdAt: new Date('2026-09-12T09:00:00.000Z'),
    },
    {
      id: 'book-8',
      title: 'The Pragmatic Programmer',
      author: 'David Thomas & Andrew Hunt',
      isbn: '978-0-1359-5705-9',
      category: 'Software Engineering',
      callNumber: 'QA76.6 H85',
      publishedYear: 2019,
      available: true,
      createdAt: new Date('2026-09-14T09:00:00.000Z'),
    },
  ];

  const members: StoredMember[] = [
    {
      id: 'member-1',
      memberCode: 'LIB-101',
      name: 'Aarav Nair',
      email: 'aarav.nair@campus.edu',
      department: 'Computer Applications',
      joinedAt: new Date('2026-08-15T10:00:00.000Z'),
    },
    {
      id: 'member-2',
      memberCode: 'LIB-102',
      name: 'Meera Kulkarni',
      email: 'meera.kulkarni@campus.edu',
      department: 'Data Science',
      joinedAt: new Date('2026-08-18T11:30:00.000Z'),
    },
    {
      id: 'member-3',
      memberCode: 'LIB-103',
      name: 'Rohan Deshmukh',
      email: 'rohan.deshmukh@campus.edu',
      department: 'Software Systems',
      joinedAt: new Date('2026-08-22T14:15:00.000Z'),
    },
    {
      id: 'member-4',
      memberCode: 'LIB-104',
      name: 'Ananya Rao',
      email: 'ananya.rao@campus.edu',
      department: 'Artificial Intelligence',
      joinedAt: new Date('2026-09-02T09:45:00.000Z'),
    },
  ];

  const loans: StoredLoan[] = [
    {
      id: 'loan-1',
      bookId: 'book-2',
      memberId: 'member-1',
      issuedAt: new Date('2026-11-18T10:15:00.000Z'),
      dueAt: new Date('2026-12-02T10:15:00.000Z'),
      returnedAt: null,
    },
    {
      id: 'loan-2',
      bookId: 'book-4',
      memberId: 'member-2',
      issuedAt: new Date('2026-11-08T14:00:00.000Z'),
      dueAt: new Date('2026-11-22T14:00:00.000Z'),
      returnedAt: null,
    },
    {
      id: 'loan-3',
      bookId: 'book-1',
      memberId: 'member-3',
      issuedAt: new Date('2026-10-10T09:30:00.000Z'),
      dueAt: new Date('2026-10-24T09:30:00.000Z'),
      returnedAt: new Date('2026-10-21T16:20:00.000Z'),
    },
  ];

  return { books, members, loans };
}

export function createInMemoryLibraryDb(): LibraryDbClient {
  const { books, members, loans } = createInitialData();

  const attachActiveLoans = (book: StoredBook) => ({
    ...book,
    loans: loans
      .filter((loan) => loan.bookId === book.id && loan.returnedAt === null)
      .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime())
      .slice(0, 1)
      .map((loan) => {
        const member = members.find((m) => m.id === loan.memberId);
        return {
          ...loan,
          member: {
            name: member?.name ?? 'Unknown Member',
            memberCode: member?.memberCode ?? 'N/A',
          },
        };
      }),
  });

  const attachLoanRelations = (loan: StoredLoan) => {
    const book = books.find((b) => b.id === loan.bookId);
    const member = members.find((m) => m.id === loan.memberId);
    return {
      ...loan,
      book: {
        title: book?.title ?? 'Unknown Book',
        author: book?.author ?? 'Unknown Author',
        callNumber: book?.callNumber ?? '—',
      },
      member: {
        name: member?.name ?? 'Unknown Member',
        memberCode: member?.memberCode ?? 'N/A',
      },
    };
  };

  const client = {
    book: {
      findMany: async (args?: { where?: Record<string, unknown> }) => {
        const where = args?.where ?? {};
        const filtered = books.filter((book) => {
          if (typeof where.available === 'boolean' && book.available !== where.available) {
            return false;
          }
          if (Array.isArray(where.OR)) {
            const matches = where.OR.some((clause: Record<string, { contains?: string }>) => {
              const [field, condition] = Object.entries(clause)[0];
              const q = (condition?.contains ?? '').toLowerCase();
              const val = String(
                (book as unknown as Record<string, unknown>)[field] ?? '',
              ).toLowerCase();
              return val.includes(q);
            });
            if (!matches) return false;
          }
          return true;
        });

        return [...filtered]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .map(attachActiveLoans);
      },
      count: async (args?: { where?: { available?: boolean } }) => {
        if (typeof args?.where?.available === 'boolean') {
          return books.filter((b) => b.available === args.where!.available).length;
        }
        return books.length;
      },
      findUnique: async (args: { where: { id?: string; isbn?: string } }) => {
        const found = books.find(
          (b) =>
            (args.where.id && b.id === args.where.id) ||
            (args.where.isbn && b.isbn === args.where.isbn),
        );
        return found ? attachActiveLoans(found) : null;
      },
      create: async (args: {
        data: {
          title: string;
          author: string;
          isbn: string;
          category?: string;
          callNumber: string;
          publishedYear: number;
          available?: boolean;
        };
      }) => {
        const created: StoredBook = {
          id: `book-${Date.now().toString(36)}-${books.length + 1}`,
          title: args.data.title,
          author: args.data.author,
          isbn: args.data.isbn,
          category: args.data.category ?? 'General Collection',
          callNumber: args.data.callNumber,
          publishedYear: args.data.publishedYear,
          available: args.data.available ?? true,
          createdAt: new Date(),
        };
        books.unshift(created);
        return created;
      },
      update: async (args: { where: { id: string }; data: Partial<StoredBook> }) => {
        const index = books.findIndex((b) => b.id === args.where.id);
        books[index] = { ...books[index], ...args.data };
        return books[index];
      },
    },
    member: {
      findMany: async () =>
        [...members]
          .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())
          .map((member) => ({
            ...member,
            loans: loans
              .filter((loan) => loan.memberId === member.id)
              .map((loan) => ({ returnedAt: loan.returnedAt })),
          })),
      findUnique: async (args: {
        where: { id?: string; email?: string; memberCode?: string };
      }) =>
        members.find(
          (m) =>
            (args.where.id && m.id === args.where.id) ||
            (args.where.email && m.email === args.where.email) ||
            (args.where.memberCode && m.memberCode === args.where.memberCode),
        ) ?? null,
      count: async () => members.length,
      create: async (args: {
        data: {
          memberCode: string;
          name: string;
          email: string;
          department?: string;
        };
      }) => {
        const created: StoredMember = {
          id: `member-${Date.now().toString(36)}-${members.length + 1}`,
          memberCode: args.data.memberCode,
          name: args.data.name,
          email: args.data.email,
          department: args.data.department ?? 'Computer Applications',
          joinedAt: new Date(),
        };
        members.push(created);
        return created;
      },
    },
    loan: {
      findMany: async (args?: {
        where?: { bookId?: string; returnedAt?: null; NOT?: { returnedAt: null } };
      }) => {
        const filtered = loans.filter((loan) => {
          if (args?.where?.bookId && loan.bookId !== args.where.bookId) return false;
          if (args?.where && 'returnedAt' in args.where && args.where.returnedAt === null) {
            return loan.returnedAt === null;
          }
          if (args?.where?.NOT?.returnedAt === null) {
            return loan.returnedAt !== null;
          }
          return true;
        });

        return [...filtered]
          .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime())
          .map(attachLoanRelations);
      },
      findFirst: async (args: {
        where: { bookId?: string; id?: { not: string }; returnedAt?: null };
      }) =>
        loans.find(
          (loan) =>
            (!args.where.bookId || loan.bookId === args.where.bookId) &&
            (!args.where.id?.not || loan.id !== args.where.id.not) &&
            (args.where.returnedAt === undefined || loan.returnedAt === args.where.returnedAt),
        ) ?? null,
      findUnique: async (args: { where: { id: string } }) => {
        const found = loans.find((loan) => loan.id === args.where.id);
        return found ? attachLoanRelations(found) : null;
      },
      create: async (args: {
        data: {
          bookId: string;
          memberId: string;
          issuedAt?: Date;
          dueAt: Date;
          returnedAt?: Date | null;
        };
      }) => {
        const created: StoredLoan = {
          id: `loan-${Date.now().toString(36)}-${loans.length + 1}`,
          bookId: args.data.bookId,
          memberId: args.data.memberId,
          issuedAt: args.data.issuedAt ?? new Date(),
          dueAt: args.data.dueAt,
          returnedAt: args.data.returnedAt ?? null,
        };
        loans.unshift(created);
        return attachLoanRelations(created);
      },
      update: async (args: { where: { id: string }; data: Partial<StoredLoan> }) => {
        const index = loans.findIndex((loan) => loan.id === args.where.id);
        loans[index] = { ...loans[index], ...args.data };
        return attachLoanRelations(loans[index]);
      },
    },
    $transaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => {
      return fn(client);
    },
  };

  return client as unknown as LibraryDbClient;
}

const globalForFallback = globalThis as unknown as {
  fallbackLibraryDb: LibraryDbClient | undefined;
};

export function getFallbackDb(): LibraryDbClient {
  if (!globalForFallback.fallbackLibraryDb) {
    globalForFallback.fallbackLibraryDb = createInMemoryLibraryDb();
  }
  return globalForFallback.fallbackLibraryDb;
}
