import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBookInDb,
  createMemberInDb,
  getBookDetailById,
  issueBookInDb,
  listBooksWithSummary,
  listLoansWithDetails,
  listMembersWithStats,
  returnLoanInDb,
  type LibraryDbClient,
} from './libraryService';

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

function createInMemoryPrismaMock(): LibraryDbClient {
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
  ];

  const client = {
    book: {
      findMany: async (args?: { where?: Record<string, unknown> }) => {
        const where = args?.where ?? {};
        const filtered = books.filter((b) => {
          if (typeof where.available === 'boolean' && b.available !== where.available) {
            return false;
          }
          if (Array.isArray(where.OR)) {
            const matches = where.OR.some((clause: Record<string, { contains?: string }>) => {
              const [field, condition] = Object.entries(clause)[0];
              const q = (condition?.contains ?? '').toLowerCase();
              const val = String((b as unknown as Record<string, unknown>)[field] ?? '').toLowerCase();
              return val.includes(q);
            });
            if (!matches) return false;
          }
          return true;
        });

        return [...filtered]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .map((b) => ({
            ...b,
            loans: loans
              .filter((l) => l.bookId === b.id && l.returnedAt === null)
              .map((l) => {
                const m = members.find((mem) => mem.id === l.memberId)!;
                return { ...l, member: { name: m.name, memberCode: m.memberCode } };
              }),
          }));
      },
      count: async (args?: { where?: { available?: boolean } }) => {
        if (typeof args?.where?.available === 'boolean') {
          return books.filter((b) => b.available === args.where!.available).length;
        }
        return books.length;
      },
      findUnique: async (args: { where: { id?: string; isbn?: string }; include?: unknown }) => {
        const found = books.find(
          (b) =>
            (args.where.id && b.id === args.where.id) ||
            (args.where.isbn && b.isbn === args.where.isbn),
        );
        if (!found) return null;
        return {
          ...found,
          loans: loans
            .filter((l) => l.bookId === found.id && l.returnedAt === null)
            .map((l) => {
              const m = members.find((mem) => mem.id === l.memberId)!;
              return { ...l, member: { name: m.name, memberCode: m.memberCode } };
            }),
        };
      },
      create: async (args: {
        data: Omit<StoredBook, 'id' | 'createdAt'>;
      }) => {
        const created: StoredBook = {
          id: `book-${books.length + 1}`,
          createdAt: new Date(),
          ...args.data,
        };
        books.push(created);
        return created;
      },
      update: async (args: { where: { id: string }; data: Partial<StoredBook> }) => {
        const idx = books.findIndex((b) => b.id === args.where.id);
        books[idx] = { ...books[idx], ...args.data };
        return books[idx];
      },
    },
    member: {
      findMany: async () => {
        return members.map((m) => ({
          ...m,
          loans: loans
            .filter((l) => l.memberId === m.id)
            .map((l) => ({ returnedAt: l.returnedAt })),
        }));
      },
      findUnique: async (args: {
        where: { id?: string; email?: string; memberCode?: string };
      }) => {
        return (
          members.find(
            (m) =>
              (args.where.id && m.id === args.where.id) ||
              (args.where.email && m.email === args.where.email) ||
              (args.where.memberCode && m.memberCode === args.where.memberCode),
          ) ?? null
        );
      },
      count: async () => members.length,
      create: async (args: { data: Omit<StoredMember, 'id' | 'joinedAt'> }) => {
        const created: StoredMember = {
          id: `member-${members.length + 1}`,
          joinedAt: new Date(),
          ...args.data,
        };
        members.push(created);
        return created;
      },
    },
    loan: {
      findMany: async (args?: { where?: { bookId?: string; returnedAt?: null; NOT?: { returnedAt: null } } }) => {
        const filtered = loans.filter((l) => {
          if (args?.where?.bookId && l.bookId !== args.where.bookId) return false;
          if (args?.where && 'returnedAt' in args.where && args.where.returnedAt === null) {
            return l.returnedAt === null;
          }
          if (args?.where?.NOT?.returnedAt === null) {
            return l.returnedAt !== null;
          }
          return true;
        });

        return [...filtered]
          .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime())
          .map((l) => {
            const b = books.find((bk) => bk.id === l.bookId)!;
            const m = members.find((mem) => mem.id === l.memberId)!;
            return {
              ...l,
              book: { title: b.title, author: b.author, callNumber: b.callNumber },
              member: { name: m.name, memberCode: m.memberCode },
            };
          });
      },
      findFirst: async (args: {
        where: { bookId?: string; id?: { not: string }; returnedAt?: null };
      }) => {
        return (
          loans.find(
            (l) =>
              (!args.where.bookId || l.bookId === args.where.bookId) &&
              (!args.where.id?.not || l.id !== args.where.id.not) &&
              (args.where.returnedAt === undefined || l.returnedAt === args.where.returnedAt),
          ) ?? null
        );
      },
      findUnique: async (args: { where: { id: string } }) => {
        const l = loans.find((item) => item.id === args.where.id);
        if (!l) return null;
        const b = books.find((bk) => bk.id === l.bookId)!;
        const m = members.find((mem) => mem.id === l.memberId)!;
        return {
          ...l,
          book: { title: b.title, author: b.author, callNumber: b.callNumber },
          member: { name: m.name, memberCode: m.memberCode },
        };
      },
      create: async (args: { data: Omit<StoredLoan, 'id'> }) => {
        const created: StoredLoan = {
          id: `loan-${loans.length + 1}`,
          ...args.data,
        };
        loans.push(created);
        const b = books.find((bk) => bk.id === created.bookId)!;
        const m = members.find((mem) => mem.id === created.memberId)!;
        return {
          ...created,
          book: { title: b.title, author: b.author, callNumber: b.callNumber },
          member: { name: m.name, memberCode: m.memberCode },
        };
      },
      update: async (args: { where: { id: string }; data: Partial<StoredLoan> }) => {
        const idx = loans.findIndex((l) => l.id === args.where.id);
        loans[idx] = { ...loans[idx], ...args.data };
        const l = loans[idx];
        const b = books.find((bk) => bk.id === l.bookId)!;
        const m = members.find((mem) => mem.id === l.memberId)!;
        return {
          ...l,
          book: { title: b.title, author: b.author, callNumber: b.callNumber },
          member: { name: m.name, memberCode: m.memberCode },
        };
      },
    },
    $transaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => {
      return fn(client);
    },
  };

  return client as unknown as LibraryDbClient;
}

test('search by title, author, availability, and empty search state', async () => {
  const db = createInMemoryPrismaMock();

  const byAuthor = await listBooksWithSummary({ query: 'Kleppmann' }, db);
  assert.equal(byAuthor.books.length, 1);
  assert.equal(byAuthor.books[0].id, 'book-1');
  assert.equal(byAuthor.summary.totalBooks, 2);

  const byTitleIssued = await listBooksWithSummary({ query: 'Clean', status: 'issued' }, db);
  assert.equal(byTitleIssued.books.length, 1);
  assert.equal(byTitleIssued.books[0].activeLoan?.memberName, 'Aarav Nair');

  const noMatch = await listBooksWithSummary({ query: 'nonexistent-query' }, db);
  assert.equal(noMatch.books.length, 0);
});

test('issueBookInDb enforces 400/404/409 and rejects duplicate issues', async () => {
  const db = createInMemoryPrismaMock();
  const now = new Date('2026-11-26T12:00:00.000Z');

  const missing = await issueBookInDb({ bookId: '', memberId: 'member-1' }, db, now);
  assert.equal(missing.status, 400);

  const unknownBook = await issueBookInDb({ bookId: 'unknown-book', memberId: 'member-1' }, db, now);
  assert.equal(unknownBook.status, 404);

  const unknownMember = await issueBookInDb({ bookId: 'book-1', memberId: 'unknown-member' }, db, now);
  assert.equal(unknownMember.status, 404);

  const unavailable = await issueBookInDb({ bookId: 'book-2', memberId: 'member-2' }, db, now);
  assert.equal(unavailable.status, 409);

  const issued = await issueBookInDb({ bookId: 'book-1', memberId: 'member-2', loanDays: 14 }, db, now);
  assert.equal(issued.ok, true);
  assert.equal(issued.status, 201);
  assert.equal(issued.data?.memberName, 'Meera Kulkarni');

  const detail = await getBookDetailById('book-1', db);
  assert.equal(detail?.book.available, false);
  assert.equal(detail?.book.activeLoan?.memberId, 'member-2');

  // Re-issuing immediately must fail with 409
  const duplicate = await issueBookInDb({ bookId: 'book-1', memberId: 'member-1' }, db, now);
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.status, 409);
});

test('returnLoanInDb restores availability and handles duplicate returns safely', async () => {
  const db = createInMemoryPrismaMock();
  const firstTime = new Date('2026-11-26T14:00:00.000Z');

  const unknown = await returnLoanInDb('loan-missing', db, firstTime);
  assert.equal(unknown.status, 404);

  const returned = await returnLoanInDb('loan-1', db, firstTime);
  assert.equal(returned.ok, true);
  assert.equal(returned.status, 200);
  assert.equal(returned.data?.returnedAt, firstTime.toISOString());

  const detail = await getBookDetailById('book-2', db);
  assert.equal(detail?.book.available, true);
  assert.equal(detail?.book.activeLoan, null);

  // Second return attempt must be rejected safely with 409 and preserve original return timestamp
  const secondTime = new Date('2026-11-27T09:00:00.000Z');
  const duplicateReturn = await returnLoanInDb('loan-1', db, secondTime);
  assert.equal(duplicateReturn.ok, false);
  assert.equal(duplicateReturn.status, 409);
  assert.equal(duplicateReturn.data?.returnedAt, firstTime.toISOString());
});

test('createBookInDb and createMemberInDb validate inputs and return stats', async () => {
  const db = createInMemoryPrismaMock();

  const badBook = await createBookInDb({ title: '', author: 'Author' }, db);
  assert.equal(badBook.status, 400);

  const goodBook = await createBookInDb(
    { title: 'Database Internals', author: 'Alex Petrov', isbn: '978-1-4920-4034-7' },
    db,
  );
  assert.equal(goodBook.status, 201);

  const dupEmail = await createMemberInDb(
    { name: 'Duplicate', email: 'AARAV.NAIR@campus.edu' },
    db,
  );
  assert.equal(dupEmail.status, 409);

  const goodMember = await createMemberInDb(
    { name: 'Rohan Deshmukh', email: 'rohan@campus.edu', department: 'Software Systems' },
    db,
  );
  assert.equal(goodMember.status, 201);
  assert.equal(goodMember.data?.memberCode, 'LIB-103');

  const members = await listMembersWithStats(db);
  assert.equal(members.length, 3);

  const activeLoans = await listLoansWithDetails('active', db);
  assert.equal(activeLoans.length, 1);
});
