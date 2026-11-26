# Library Management System (Project 10)

A full-stack **Next.js App Router** Library Management System backed by **PostgreSQL** and **Prisma ORM**. Built for managing book holdings, registered library members, and transactional issue/return circulation workflows.

**Author:** MRITUNJAI KUMAR  
**SRN:** PES1PG25CA134  
**Course:** UQ25CA752A — WAF-II Experiential Learning (Unit-4, Project 10)

---

## Overview & Features

- **Server-Rendered Catalogue (`/library`)**: Displays live book inventory, summary counts (Total Books, Available, Issued, Registered Members), availability status, and active borrower due dates directly from PostgreSQL.
- **Search & Availability Filtering**: Search books by title, author, ISBN, or call number, and filter by `All Books`, `Available Books`, or `Issued Books` with a clear empty-state message when no matches exist.
- **Book Detail & Circulation (`/library/books/[id]`)**: Displays full book metadata, circulation history, an inline **Issue to Member** form when available, and a **Return Book** action when issued.
- **Loans Ledger (`/library/loans`)**: Tracks active and returned loans with due dates, overdue detection, and one-click returns.
- **Member Management (`/library/members`)**: Registers new library members with automatic institutional member codes (`LIB-101`, etc.) and displays active loan counts.
- **Add Book Modal**: Allows adding new books to the catalogue with server-side validation and duplicate ISBN protection.

---

## Core Concepts Used

1. **Database Integration (PostgreSQL + Prisma)**: Relational `Book`, `Member`, and `Loan` models in `prisma/schema.prisma` with foreign keys, indexes, and atomic `$transaction` updates in `lib/libraryService.ts`.
2. **Server-Side Rendering (Next.js App Router)**: Default Server Components (`app/library/page.tsx`, `app/library/books/[id]/page.tsx`, `app/library/loans/page.tsx`, `app/library/members/page.tsx`) fetch up-to-date PostgreSQL records on each request, keeping database access strictly on the server and limiting `'use client'` to small interactive controls.
3. **API Development (Route Handlers)**: REST endpoints under `app/api/` validate payloads on the server, enforce business rules, and return semantic HTTP status codes (`200`, `201`, `400`, `404`, `409`, `500`) without exposing raw database errors.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19 & TypeScript
- **Database**: PostgreSQL with Prisma ORM (`@prisma/client` / `prisma`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Icons**: Lucide React

---

## Local Setup & Database Migration

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env.local` (and `.env` if running Prisma CLI commands directly without `dotenv`):
   ```bash
   cp .env.example .env.local
   ```
   Update `DATABASE_URL` in `.env.local` with your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/library_db?schema=public"
   ```

3. **Generate Prisma Client & apply database migrations**:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Seed synthetic sample data**:
   ```bash
   npm run db:seed
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000/library`.

---

## API Endpoints

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/books?q=&status=` | Search/filter books and catalogue summary | `200`, `500` |
| `POST` | `/api/books` | Add a new book to the catalogue | `201`, `400`, `409`, `500` |
| `GET` | `/api/books/[id]` | Get book details and circulation history | `200`, `404`, `500` |
| `GET` | `/api/members` | List members with active/total loan counts | `200`, `500` |
| `POST` | `/api/members` | Register a new member | `201`, `400`, `409`, `500` |
| `GET` | `/api/loans?status=` | List all, active, or returned loans | `200`, `500` |
| `POST` | `/api/loans` | Issue an available book to a member | `201`, `400`, `404`, `409`, `500` |
| `POST` | `/api/loans/[id]/return` | Return an active loan and restore availability | `200`, `400`, `404`, `409`, `500` |

---

## Verification Checklist

- [x] Search books by title and author; verify clear empty state on unmatched queries.
- [x] Issue an available book (`POST /api/loans`) and confirm `Book.available` becomes `false`.
- [x] Attempt to issue the same book again and confirm HTTP `409 Conflict` rejection.
- [x] Return the active loan (`POST /api/loans/[id]/return`) and confirm `returnedAt` is recorded and `Book.available` becomes `true`.
- [x] Attempt a duplicate return on the same loan and confirm safe `409 Conflict` handling without altering state.
- [x] Verify `404` on unknown book/member/loan IDs and `400` on missing/invalid inputs.

---

## Vercel Deployment Notes

- Suggested repository name per assignment convention (`srn-name`): **`pes1pg25ca134-mritunjai-kumar`**
- Provision a hosted PostgreSQL database (such as Vercel Postgres, Neon, or Supabase).
- Set `DATABASE_URL` in **Vercel Project → Settings → Environment Variables**.
- Run `npx prisma migrate deploy` and `npm run db:seed` against the production database after connecting `DATABASE_URL`.
- Build command: `npm run build` (`prisma generate && next build`).
