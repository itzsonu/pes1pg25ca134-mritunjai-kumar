import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { mutateDatabase, readDatabase } from './server/store';
import {
  createBookRecord,
  createMemberRecord,
  filterBooks,
  hydrateBooks,
  hydrateLoans,
  hydrateMembers,
  issueBookLoan,
  returnBookLoan,
} from './src/lib/libraryRules';
import type { AvailabilityFilter } from './src/types/library';

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // GET /api/books?q=...&status=all|available|issued
  app.get('/api/books', async (req, res) => {
    try {
      const db = await readDatabase();
      const query = typeof req.query.q === 'string' ? req.query.q : '';
      const rawStatus = typeof req.query.status === 'string' ? req.query.status : 'all';
      const status: AvailabilityFilter =
        rawStatus === 'available' || rawStatus === 'issued' ? rawStatus : 'all';

      const allBooks = hydrateBooks(db);
      const filtered = filterBooks(allBooks, query, status);

      res.json({
        books: filtered,
        summary: {
          totalBooks: allBooks.length,
          availableBooks: allBooks.filter((b) => b.available).length,
          issuedBooks: allBooks.filter((b) => !b.available).length,
          totalMembers: db.members.length,
        },
      });
    } catch {
      res.status(500).json({ error: 'Unable to load library catalogue.' });
    }
  });

  // POST /api/books
  app.post('/api/books', async (req, res) => {
    try {
      const result = await mutateDatabase((db) => createBookRecord(db, req.body ?? {}));
      if (!result.ok) {
        res.status(result.status).json({ error: result.error });
        return;
      }
      res.status(201).json({ book: result.data });
    } catch {
      res.status(500).json({ error: 'Unable to add book to catalogue.' });
    }
  });

  // GET /api/books/:id
  app.get('/api/books/:id', async (req, res) => {
    try {
      const db = await readDatabase();
      const books = hydrateBooks(db);
      const book = books.find((b) => b.id === req.params.id);

      if (!book) {
        res.status(404).json({ error: 'Book not found.' });
        return;
      }

      const history = hydrateLoans(db).filter((loan) => loan.bookId === book.id);
      res.json({ book, history });
    } catch {
      res.status(500).json({ error: 'Unable to load book details.' });
    }
  });

  // GET /api/members
  app.get('/api/members', async (_req, res) => {
    try {
      const db = await readDatabase();
      const members = hydrateMembers(db);
      res.json({ members });
    } catch {
      res.status(500).json({ error: 'Unable to load members.' });
    }
  });

  // POST /api/members
  app.post('/api/members', async (req, res) => {
    try {
      const result = await mutateDatabase((db) => createMemberRecord(db, req.body ?? {}));
      if (!result.ok) {
        res.status(result.status).json({ error: result.error });
        return;
      }
      res.status(201).json({ member: result.data });
    } catch {
      res.status(500).json({ error: 'Unable to register member.' });
    }
  });

  // GET /api/loans?status=active|returned|all
  app.get('/api/loans', async (req, res) => {
    try {
      const db = await readDatabase();
      const status = typeof req.query.status === 'string' ? req.query.status : 'all';
      let loans = hydrateLoans(db);

      if (status === 'active') {
        loans = loans.filter((loan) => loan.returnedAt === null);
      } else if (status === 'returned') {
        loans = loans.filter((loan) => loan.returnedAt !== null);
      }

      res.json({ loans });
    } catch {
      res.status(500).json({ error: 'Unable to load loan records.' });
    }
  });

  // POST /api/loans (Issue API)
  app.post('/api/loans', async (req, res) => {
    try {
      const result = await mutateDatabase((db) => issueBookLoan(db, req.body ?? {}));
      if (!result.ok) {
        res.status(result.status).json({ error: result.error });
        return;
      }
      res.status(201).json({ loan: result.data });
    } catch {
      res.status(500).json({ error: 'Unable to issue book.' });
    }
  });

  // POST /api/loans/:id/return (Return API)
  app.post('/api/loans/:id/return', async (req, res) => {
    try {
      const result = await mutateDatabase((db) => returnBookLoan(db, req.params.id));
      if (!result.ok) {
        res.status(result.status).json({ error: result.error, loan: result.data });
        return;
      }
      res.status(200).json({ loan: result.data });
    } catch {
      res.status(500).json({ error: 'Unable to process book return.' });
    }
  });

  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve('dist/index.html'));

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve('dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Library Management System running on http://localhost:${PORT}`);
  });
}

startServer();
