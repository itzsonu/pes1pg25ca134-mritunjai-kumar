import fs from 'node:fs/promises';
import path from 'node:path';
import type { LibraryDatabase } from '../src/types/library';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'library.json');

function createSeedDatabase(): LibraryDatabase {
  return {
    books: [
      {
        id: 'book-1',
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        isbn: '978-1-4493-7332-0',
        category: 'Distributed Systems',
        callNumber: 'QA76.9.D3 K54',
        publishedYear: 2017,
        available: true,
        createdAt: '2026-09-01T09:00:00.000Z',
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
        createdAt: '2026-09-03T09:00:00.000Z',
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
        createdAt: '2026-09-05T09:00:00.000Z',
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
        createdAt: '2026-09-07T09:00:00.000Z',
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
        createdAt: '2026-09-09T09:00:00.000Z',
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
        createdAt: '2026-09-11T09:00:00.000Z',
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
        createdAt: '2026-09-12T09:00:00.000Z',
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
        createdAt: '2026-09-14T09:00:00.000Z',
      },
    ],
    members: [
      {
        id: 'member-1',
        memberCode: 'LIB-101',
        name: 'Aarav Nair',
        email: 'aarav.nair@campus.edu',
        department: 'Computer Applications',
        joinedAt: '2026-08-15T10:00:00.000Z',
      },
      {
        id: 'member-2',
        memberCode: 'LIB-102',
        name: 'Meera Kulkarni',
        email: 'meera.kulkarni@campus.edu',
        department: 'Data Science',
        joinedAt: '2026-08-18T11:30:00.000Z',
      },
      {
        id: 'member-3',
        memberCode: 'LIB-103',
        name: 'Rohan Deshmukh',
        email: 'rohan.deshmukh@campus.edu',
        department: 'Software Systems',
        joinedAt: '2026-08-22T14:15:00.000Z',
      },
      {
        id: 'member-4',
        memberCode: 'LIB-104',
        name: 'Ananya Rao',
        email: 'ananya.rao@campus.edu',
        department: 'Artificial Intelligence',
        joinedAt: '2026-09-02T09:45:00.000Z',
      },
    ],
    loans: [
      {
        id: 'loan-1',
        bookId: 'book-2',
        memberId: 'member-1',
        issuedAt: '2026-11-18T10:15:00.000Z',
        dueAt: '2026-12-02T10:15:00.000Z',
        returnedAt: null,
      },
      {
        id: 'loan-2',
        bookId: 'book-4',
        memberId: 'member-2',
        issuedAt: '2026-11-08T14:00:00.000Z',
        dueAt: '2026-11-22T14:00:00.000Z',
        returnedAt: null,
      },
      {
        id: 'loan-3',
        bookId: 'book-1',
        memberId: 'member-3',
        issuedAt: '2026-10-10T09:30:00.000Z',
        dueAt: '2026-10-24T09:30:00.000Z',
        returnedAt: '2026-10-21T16:20:00.000Z',
      },
    ],
  };
}

let writeQueue: Promise<unknown> = Promise.resolve();

async function ensureDatabaseFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    const seed = createSeedDatabase();
    await fs.writeFile(DATA_FILE, JSON.stringify(seed, null, 2), 'utf8');
  }
}

export async function readDatabase(): Promise<LibraryDatabase> {
  await ensureDatabaseFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw) as LibraryDatabase;
}

export function mutateDatabase<T>(
  mutator: (db: LibraryDatabase) => T | Promise<T>,
): Promise<T> {
  const run = async (): Promise<T> => {
    const db = await readDatabase();
    const result = await mutator(db);
    await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
    return result;
  };

  const next = writeQueue.then(run, run);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}
