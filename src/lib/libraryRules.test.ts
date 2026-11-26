import test from 'node:test';
import assert from 'node:assert/strict';
import type { LibraryDatabase } from '../types/library';
import {
  createBookRecord,
  createMemberRecord,
  filterBooks,
  hydrateBooks,
  issueBookLoan,
  returnBookLoan,
} from './libraryRules';

function makeSeedDb(): LibraryDatabase {
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
        createdAt: '2026-01-10T09:00:00.000Z',
      },
      {
        id: 'book-2',
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        isbn: '978-0-1344-9416-6',
        category: 'Software Engineering',
        callNumber: 'QA76.758 M37',
        publishedYear: 2017,
        available: false,
        createdAt: '2026-01-12T09:00:00.000Z',
      },
    ],
    members: [
      {
        id: 'member-1',
        memberCode: 'LIB-101',
        name: 'Aarav Nair',
        email: 'aarav.nair@example.edu',
        department: 'Computer Applications',
        joinedAt: '2026-01-05T09:00:00.000Z',
      },
      {
        id: 'member-2',
        memberCode: 'LIB-102',
        name: 'Meera Kulkarni',
        email: 'meera.k@example.edu',
        department: 'Data Science',
        joinedAt: '2026-01-06T09:00:00.000Z',
      },
    ],
    loans: [
      {
        id: 'loan-1',
        bookId: 'book-2',
        memberId: 'member-1',
        issuedAt: '2026-11-10T10:00:00.000Z',
        dueAt: '2026-11-24T10:00:00.000Z',
        returnedAt: null,
      },
    ],
  };
}

test('filterBooks matches title, author, and availability status', () => {
  const db = makeSeedDb();
  const hydrated = hydrateBooks(db);

  assert.equal(filterBooks(hydrated, 'kleppmann', 'all').length, 1);
  assert.equal(filterBooks(hydrated, 'clean', 'issued').length, 1);
  assert.equal(filterBooks(hydrated, 'clean', 'available').length, 0);
  assert.equal(filterBooks(hydrated, 'nonexistent title', 'all').length, 0);
});

test('issueBookLoan validates missing IDs (400), unknown IDs (404), and unavailable books (409)', () => {
  const db = makeSeedDb();
  const now = new Date('2026-11-26T12:00:00.000Z');

  const missing = issueBookLoan(db, { bookId: '', memberId: 'member-1' }, now);
  assert.equal(missing.ok, false);
  assert.equal(missing.status, 400);

  const unknownBook = issueBookLoan(db, { bookId: 'book-999', memberId: 'member-1' }, now);
  assert.equal(unknownBook.ok, false);
  assert.equal(unknownBook.status, 404);

  const unknownMember = issueBookLoan(db, { bookId: 'book-1', memberId: 'member-999' }, now);
  assert.equal(unknownMember.ok, false);
  assert.equal(unknownMember.status, 404);

  const alreadyIssued = issueBookLoan(db, { bookId: 'book-2', memberId: 'member-2' }, now);
  assert.equal(alreadyIssued.ok, false);
  assert.equal(alreadyIssued.status, 409);

  const success = issueBookLoan(db, { bookId: 'book-1', memberId: 'member-2', loanDays: 7 }, now);
  assert.equal(success.ok, true);
  assert.equal(success.status, 201);
  assert.equal(db.books[0].available, false);
  assert.equal(success.data?.memberName, 'Meera Kulkarni');

  // Re-issuing immediately must fail with 409
  const secondIssue = issueBookLoan(db, { bookId: 'book-1', memberId: 'member-1' }, now);
  assert.equal(secondIssue.ok, false);
  assert.equal(secondIssue.status, 409);
});

test('returnBookLoan marks loan returned, restores book availability, and rejects duplicate returns safely', () => {
  const db = makeSeedDb();
  const now = new Date('2026-11-26T12:00:00.000Z');

  const unknownLoan = returnBookLoan(db, 'loan-999', now);
  assert.equal(unknownLoan.ok, false);
  assert.equal(unknownLoan.status, 404);

  const firstReturn = returnBookLoan(db, 'loan-1', now);
  assert.equal(firstReturn.ok, true);
  assert.equal(firstReturn.status, 200);
  assert.equal(firstReturn.data?.returnedAt, now.toISOString());
  assert.equal(db.books[1].available, true);

  // Repeated return is handled safely with 409 and preserves original returnedAt
  const later = new Date('2026-11-27T12:00:00.000Z');
  const duplicateReturn = returnBookLoan(db, 'loan-1', later);
  assert.equal(duplicateReturn.ok, false);
  assert.equal(duplicateReturn.status, 409);
  assert.equal(db.loans[0].returnedAt, now.toISOString());
  assert.equal(db.books[1].available, true);
});

test('createBookRecord and createMemberRecord validate inputs and prevent duplicate member email', () => {
  const db = makeSeedDb();

  const badBook = createBookRecord(db, { title: '   ', author: 'Someone' });
  assert.equal(badBook.ok, false);
  assert.equal(badBook.status, 400);

  const goodBook = createBookRecord(db, {
    title: 'Database Internals',
    author: 'Alex Petrov',
    category: 'Databases',
    publishedYear: 2019,
  });
  assert.equal(goodBook.ok, true);
  assert.equal(goodBook.status, 201);
  assert.equal(goodBook.data?.available, true);

  const dupMember = createMemberRecord(db, {
    name: 'Another Aarav',
    email: 'AARAV.NAIR@example.edu',
  });
  assert.equal(dupMember.ok, false);
  assert.equal(dupMember.status, 409);

  const goodMember = createMemberRecord(db, {
    name: 'Rohan Desai',
    email: 'rohan.desai@example.edu',
    department: 'Software Systems',
  });
  assert.equal(goodMember.ok, true);
  assert.equal(goodMember.status, 201);
});
