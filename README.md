# Library Management System

A full-stack web application for managing a library catalogue, registered members, and book circulation. Library staff can add books, register members, issue books, process returns, and track due dates from one interface.

## Features

### Book Catalogue

- View the library's books and see total, available, and issued counts.
- Search books by title, author, ISBN, or call number.
- Filter the catalogue by availability.
- Add a book with its title, author, ISBN, category, call number, and publication year.
- Open a book's details and view its loan history.

### Members

- Register members with a name, email address, and department.
- View member codes, departments, and active loan counts.
- Validate email addresses and prevent duplicate registrations.

### Loans and Circulation

- Issue an available book to a registered member.
- Set a loan period from 1 to 60 days; the default is 14 days.
- View active, returned, and overdue loans.
- Return an issued book and update its availability.
- Prevent a book from being issued again while it has an active loan.

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Backend:** Node.js and Express
- **Storage:** Local JSON file
- **Icons and motion:** Lucide React and Motion

## Getting Started

### Prerequisites

Install Node.js and npm.

### Installation

```bash
git clone https://github.com/itzsonu/library-management-system.git
cd library-management-system
npm install
```

### Run in development mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The development server runs the Express API and serves the Vite application.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the application in development mode |
| `npm run build` | Build the frontend with Vite |
| `npm run lint` | Check TypeScript types without generating output |

Business-rule tests are located in `src/lib/libraryRules.test.ts`. A test script is not currently configured in `package.json`.

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check whether the server is running |
| `GET` | `/api/books` | List books; supports search and availability filters |
| `POST` | `/api/books` | Add a book |
| `GET` | `/api/books/:id` | Get a book and its loan history |
| `GET` | `/api/members` | List registered members |
| `POST` | `/api/members` | Register a member |
| `GET` | `/api/loans` | List loans |
| `POST` | `/api/loans` | Issue a book |
| `POST` | `/api/loans/:id/return` | Return a book |

### Example: Add a book

```json
{
  "title": "Database Internals",
  "author": "Alex Petrov",
  "isbn": "978-1492040347",
  "category": "Databases",
  "callNumber": "QA76.9.D3 P48",
  "publishedYear": 2019
}
```

### Example: Register a member

```json
{
  "name": "Aarav Nair",
  "email": "aarav.nair@example.edu",
  "department": "Computer Applications"
}
```

### Example: Issue a book

```json
{
  "bookId": "book-1",
  "memberId": "member-1",
  "loanDays": 14
}
```

The loans endpoint accepts `status=all`, `status=active`, or `status=returned`. The books endpoint accepts a search query `q` and `status=all`, `status=available`, or `status=issued`.

## Data Storage

The application creates a `data/library.json` file the first time it accesses the library data. If the file does not exist, it initializes it with sample books, members, and loan records. Data is stored in this local JSON file; the project does not currently use a separate database server.

## Project Structure

```text
.
├── server.ts                  # Express server and API routes
├── server/
│   └── store.ts               # JSON-file storage and sample data
├── src/
│   ├── App.tsx                # Main application and navigation
│   ├── components/            # Catalogue, member, loan, and book views
│   ├── lib/
│   │   ├── api.ts             # Frontend API requests
│   │   ├── libraryRules.ts    # Library business rules
│   │   └── libraryRules.test.ts
│   └── types/
│       └── library.ts         # TypeScript data models
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Author

**Name:** MRITUNJAI KUMAR  
**SRN:** PES1PG25CA134
