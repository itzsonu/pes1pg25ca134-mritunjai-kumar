import type { PrismaClient } from '@prisma/client';
import prisma from './prisma';
import { getFallbackDb } from './fallbackStore';
import { isValidEmail, normalizeText } from './libraryUtils';
import type {
  AvailabilityFilter,
  BookItem,
  CatalogueSummary,
  LoanItem,
  MemberItem,
  ServiceResult,
} from './types';

export type LibraryDbClient = Pick<
  PrismaClient,
  'book' | 'member' | 'loan' | '$transaction'
>;

let prismaUnavailableUntil = 0;

function isConnectionOrMissingTableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const code =
    typeof (error as { code?: unknown })?.code === 'string'
      ? (error as { code: string }).code
      : '';

  return (
    code === 'P1001' ||
    code === 'P1002' ||
    code === 'P1003' ||
    code === 'P2021' ||
    message.includes("Can't reach database server") ||
    message.includes('ECONNREFUSED') ||
    message.includes('Environment variable not found: DATABASE_URL') ||
    message.includes('does not exist in the current database')
  );
}

async function runWithFallback<T>(
  db: LibraryDbClient,
  operation: (activeDb: LibraryDbClient) => Promise<T>,
): Promise<T> {
  if (db !== prisma) {
    return operation(db);
  }

  if (Date.now() < prismaUnavailableUntil) {
    return operation(getFallbackDb());
  }

  try {
    return await operation(prisma);
  } catch (error) {
    if (isConnectionOrMissingTableError(error)) {
      prismaUnavailableUntil = Date.now() + 30_000;
      return operation(getFallbackDb());
    }
    throw error;
  }
}

type BookRowWithActiveLoans = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  callNumber: string;
  publishedYear: number;
  available: boolean;
  createdAt: Date;
  loans: Array<{
    id: string;
    memberId: string;
    issuedAt: Date;
    dueAt: Date;
    member: {
      name: string;
      memberCode: string;
    };
  }>;
};

type LoanRowWithRelations = {
  id: string;
  bookId: string;
  memberId: string;
  issuedAt: Date;
  dueAt: Date;
  returnedAt: Date | null;
  book: {
    title: string;
    author: string;
    callNumber: string;
  };
  member: {
    name: string;
    memberCode: string;
  };
};

function mapBookItem(row: BookRowWithActiveLoans): BookItem {
  const active = row.loans[0] ?? null;
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    isbn: row.isbn,
    category: row.category,
    callNumber: row.callNumber,
    publishedYear: row.publishedYear,
    available: active ? false : row.available,
    createdAt: row.createdAt.toISOString(),
    activeLoan: active
      ? {
          id: active.id,
          memberId: active.memberId,
          memberName: active.member.name,
          memberCode: active.member.memberCode,
          issuedAt: active.issuedAt.toISOString(),
          dueAt: active.dueAt.toISOString(),
        }
      : null,
  };
}

function mapLoanItem(row: LoanRowWithRelations): LoanItem {
  return {
    id: row.id,
    bookId: row.bookId,
    memberId: row.memberId,
    bookTitle: row.book.title,
    bookAuthor: row.book.author,
    bookCallNumber: row.book.callNumber,
    memberName: row.member.name,
    memberCode: row.member.memberCode,
    issuedAt: row.issuedAt.toISOString(),
    dueAt: row.dueAt.toISOString(),
    returnedAt: row.returnedAt ? row.returnedAt.toISOString() : null,
  };
}

export async function listBooksWithSummary(
  options: { query?: string; status?: AvailabilityFilter } = {},
  db: LibraryDbClient = prisma,
): Promise<{ books: BookItem[]; summary: CatalogueSummary }> {
  const query = normalizeText(options.query);
  const status: AvailabilityFilter =
    options.status === 'available' || options.status === 'issued'
      ? options.status
      : 'all';

  const where: Record<string, unknown> = {};
  if (status === 'available') {
    where.available = true;
  } else if (status === 'issued') {
    where.available = false;
  }

  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { author: { contains: query, mode: 'insensitive' } },
      { isbn: { contains: query, mode: 'insensitive' } },
      { callNumber: { contains: query, mode: 'insensitive' } },
    ];
  }

  return runWithFallback(db, async (activeDb) => {
    const [rows, totalBooks, availableBooks, issuedBooks, totalMembers] = await Promise.all([
      activeDb.book.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          loans: {
            where: { returnedAt: null },
            take: 1,
            orderBy: { issuedAt: 'desc' },
            include: {
              member: {
                select: { name: true, memberCode: true },
              },
            },
          },
        },
      }),
      activeDb.book.count(),
      activeDb.book.count({ where: { available: true } }),
      activeDb.book.count({ where: { available: false } }),
      activeDb.member.count(),
    ]);

    return {
      books: (rows as BookRowWithActiveLoans[]).map(mapBookItem),
      summary: {
        totalBooks,
        availableBooks,
        issuedBooks,
        totalMembers,
      },
    };
  });
}

export async function getBookDetailById(
  bookIdInput: string,
  db: LibraryDbClient = prisma,
): Promise<{ book: BookItem; history: LoanItem[] } | null> {
  const bookId = normalizeText(bookIdInput);
  if (!bookId) return null;

  return runWithFallback(db, async (activeDb) => {
    const bookRow = await activeDb.book.findUnique({
      where: { id: bookId },
      include: {
        loans: {
          where: { returnedAt: null },
          take: 1,
          orderBy: { issuedAt: 'desc' },
          include: {
            member: {
              select: { name: true, memberCode: true },
            },
          },
        },
      },
    });

    if (!bookRow) return null;

    const historyRows = await activeDb.loan.findMany({
      where: { bookId },
      orderBy: { issuedAt: 'desc' },
      include: {
        book: { select: { title: true, author: true, callNumber: true } },
        member: { select: { name: true, memberCode: true } },
      },
    });

    return {
      book: mapBookItem(bookRow as BookRowWithActiveLoans),
      history: (historyRows as LoanRowWithRelations[]).map(mapLoanItem),
    };
  });
}

export async function createBookInDb(
  input: {
    title?: unknown;
    author?: unknown;
    isbn?: unknown;
    category?: unknown;
    callNumber?: unknown;
    publishedYear?: unknown;
  },
  db: LibraryDbClient = prisma,
): Promise<ServiceResult<BookItem>> {
  const title = normalizeText(input.title);
  const author = normalizeText(input.author);
  const category = normalizeText(input.category) || 'General Collection';
  const providedIsbn = normalizeText(input.isbn);
  const isbn =
    providedIsbn ||
    `978-0-${Math.floor(100000 + Math.random() * 900000)}-${Math.floor(Math.random() * 9)}`;
  const callNumber =
    normalizeText(input.callNumber) ||
    `QA${Math.floor(10 + Math.random() * 89)}.${title.slice(0, 2).toUpperCase() || 'BK'}`;

  if (!title || !author) {
    return {
      ok: false,
      status: 400,
      error: 'Both title and author are required.',
    };
  }

  const currentYear = new Date().getUTCFullYear();
  const parsedYear = Number(input.publishedYear);
  const publishedYear =
    Number.isInteger(parsedYear) && parsedYear >= 1450 && parsedYear <= currentYear + 1
      ? parsedYear
      : currentYear;

  return runWithFallback(db, async (activeDb) => {
    const duplicateIsbn = await activeDb.book.findUnique({ where: { isbn } });
    if (duplicateIsbn) {
      return {
        ok: false,
        status: 409,
        error: 'A book with this ISBN already exists in the catalogue.',
      };
    }

    const created = await activeDb.book.create({
      data: {
        title,
        author,
        isbn,
        category,
        callNumber,
        publishedYear,
        available: true,
      },
    });

    return {
      ok: true,
      status: 201,
      data: {
        id: created.id,
        title: created.title,
        author: created.author,
        isbn: created.isbn,
        category: created.category,
        callNumber: created.callNumber,
        publishedYear: created.publishedYear,
        available: created.available,
        createdAt: created.createdAt.toISOString(),
        activeLoan: null,
      },
    };
  });
}

export async function listMembersWithStats(
  db: LibraryDbClient = prisma,
): Promise<MemberItem[]> {
  return runWithFallback(db, async (activeDb) => {
    const members = await activeDb.member.findMany({
      orderBy: { joinedAt: 'asc' },
      include: {
        loans: {
          select: { returnedAt: true },
        },
      },
    });

    return members.map((member) => ({
      id: member.id,
      memberCode: member.memberCode,
      name: member.name,
      email: member.email,
      department: member.department,
      joinedAt: member.joinedAt.toISOString(),
      activeLoansCount: member.loans.filter((loan) => loan.returnedAt === null).length,
      totalLoansCount: member.loans.length,
    }));
  });
}

export async function createMemberInDb(
  input: {
    name?: unknown;
    email?: unknown;
    department?: unknown;
  },
  db: LibraryDbClient = prisma,
): Promise<ServiceResult<MemberItem>> {
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

  if (!isValidEmail(email)) {
    return {
      ok: false,
      status: 400,
      error: 'Please enter a valid email address.',
    };
  }

  return runWithFallback(db, async (activeDb) => {
    const existing = await activeDb.member.findUnique({ where: { email } });
    if (existing) {
      return {
        ok: false,
        status: 409,
        error: 'A member with this email address already exists.',
      };
    }

    const totalMembers = await activeDb.member.count();
    let codeNumber = 101 + totalMembers;
    let memberCode = `LIB-${codeNumber}`;
    while (await activeDb.member.findUnique({ where: { memberCode } })) {
      codeNumber += 1;
      memberCode = `LIB-${codeNumber}`;
    }

    const created = await activeDb.member.create({
      data: {
        memberCode,
        name,
        email,
        department,
      },
    });

    return {
      ok: true,
      status: 201,
      data: {
        id: created.id,
        memberCode: created.memberCode,
        name: created.name,
        email: created.email,
        department: created.department,
        joinedAt: created.joinedAt.toISOString(),
        activeLoansCount: 0,
        totalLoansCount: 0,
      },
    };
  });
}

export async function listLoansWithDetails(
  status: 'all' | 'active' | 'returned' = 'all',
  db: LibraryDbClient = prisma,
): Promise<LoanItem[]> {
  const where =
    status === 'active'
      ? { returnedAt: null }
      : status === 'returned'
        ? { NOT: { returnedAt: null } }
        : {};

  return runWithFallback(db, async (activeDb) => {
    const rows = await activeDb.loan.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
      include: {
        book: { select: { title: true, author: true, callNumber: true } },
        member: { select: { name: true, memberCode: true } },
      },
    });

    return (rows as LoanRowWithRelations[]).map(mapLoanItem);
  });
}

export async function issueBookInDb(
  input: {
    bookId?: unknown;
    memberId?: unknown;
    loanDays?: unknown;
  },
  db: LibraryDbClient = prisma,
  now = new Date(),
): Promise<ServiceResult<LoanItem>> {
  const bookId = normalizeText(input.bookId);
  const memberId = normalizeText(input.memberId);

  if (!bookId || !memberId) {
    return {
      ok: false,
      status: 400,
      error: 'Both bookId and memberId are required.',
    };
  }

  const parsedDays = Number(input.loanDays);
  const loanDays =
    Number.isInteger(parsedDays) && parsedDays >= 1 && parsedDays <= 60 ? parsedDays : 14;
  const dueAt = new Date(now.getTime() + loanDays * 24 * 60 * 60 * 1000);

  return runWithFallback(db, (activeDb) =>
    activeDb.$transaction(async (tx) => {
      const book = await tx.book.findUnique({ where: { id: bookId } });
      if (!book) {
        return {
          ok: false,
          status: 404,
          error: `Book "${bookId}" was not found.`,
        };
      }

      const member = await tx.member.findUnique({ where: { id: memberId } });
      if (!member) {
        return {
          ok: false,
          status: 404,
          error: `Member "${memberId}" was not found.`,
        };
      }

      const activeLoan = await tx.loan.findFirst({
        where: { bookId: book.id, returnedAt: null },
      });

      if (!book.available || activeLoan) {
        return {
          ok: false,
          status: 409,
          error: `"${book.title}" is currently issued and unavailable.`,
        };
      }

      const createdLoan = await tx.loan.create({
        data: {
          bookId: book.id,
          memberId: member.id,
          issuedAt: now,
          dueAt,
          returnedAt: null,
        },
        include: {
          book: { select: { title: true, author: true, callNumber: true } },
          member: { select: { name: true, memberCode: true } },
        },
      });

      await tx.book.update({
        where: { id: book.id },
        data: { available: false },
      });

      return {
        ok: true,
        status: 201,
        data: mapLoanItem(createdLoan as LoanRowWithRelations),
      };
    }),
  );
}

export async function returnLoanInDb(
  loanIdInput: unknown,
  db: LibraryDbClient = prisma,
  now = new Date(),
): Promise<ServiceResult<LoanItem>> {
  const loanId = normalizeText(loanIdInput);
  if (!loanId) {
    return {
      ok: false,
      status: 400,
      error: 'Loan ID is required.',
    };
  }

  return runWithFallback(db, (activeDb) =>
    activeDb.$transaction(async (tx) => {
      const existing = await tx.loan.findUnique({
        where: { id: loanId },
        include: {
          book: { select: { title: true, author: true, callNumber: true } },
          member: { select: { name: true, memberCode: true } },
        },
      });

      if (!existing) {
        return {
          ok: false,
          status: 404,
          error: `Loan "${loanId}" was not found.`,
        };
      }

      if (existing.returnedAt !== null) {
        return {
          ok: false,
          status: 409,
          error: 'This loan has already been returned.',
          data: mapLoanItem(existing as LoanRowWithRelations),
        };
      }

      const updatedLoan = await tx.loan.update({
        where: { id: existing.id },
        data: { returnedAt: now },
        include: {
          book: { select: { title: true, author: true, callNumber: true } },
          member: { select: { name: true, memberCode: true } },
        },
      });

      const otherActiveLoan = await tx.loan.findFirst({
        where: {
          bookId: existing.bookId,
          id: { not: existing.id },
          returnedAt: null,
        },
      });

      if (!otherActiveLoan) {
        await tx.book.update({
          where: { id: existing.bookId },
          data: { available: true },
        });
      }

      return {
        ok: true,
        status: 200,
        data: mapLoanItem(updatedLoan as LoanRowWithRelations),
      };
    }),
  );
}
